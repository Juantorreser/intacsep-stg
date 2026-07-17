import {useState, useEffect, useCallback} from "react";
import Tooltip from "../Tooltip";
import {createRoot} from "react-dom/client";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";
import Sidebar from "../Sidebar";
import "jspdf-autotable"; // For table support in jsPDF
import {convertToUpperCase} from "../../utils/utils"; // Assume these functions exist
import PageHeader from "../PageHeader";
import BitacoraDetail from "./BitacoraDetail";
import OldBitacoraDetail from "./OldBitacoraPDF";
import ModalTemplate from "../ModalTemplate";
import EventsPopup from "./Eventos/EventsPopup";
import {
  fetchBitacoras,
  fetchClients,
  fetchMonitoreos,
  fetchOrigenes,
  fetchDestinos,
  fetchOperadores,
} from "../../utils/api";
import {generateAuditoriaForCreation} from "../../utils/auditoria";

const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({length: totalPages}, (_, i) => i + 1);
  const visible = new Set([1, totalPages, currentPage]);
  if (currentPage > 1) visible.add(currentPage - 1);
  if (currentPage < totalPages) visible.add(currentPage + 1);
  const sorted = Array.from(visible).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
    result.push(sorted[i]);
  }
  return result;
};

const defaultFormData = {
  bitacora_id: "",
  folio_servicio: "",
  linea_transporte: ".",
  destino: {nombre: "", estado: "", cliente: ""},
  origen: {nombre: "", estado: "", cliente: ""},
  monitoreo: "",
  cliente: "",
  enlace: ".",
  id_acceso: ".",
  contra_acceso: ".",
  remolque: {
    eco: "",
    placa: "",
    color: "",
    capacidad: "",
    sello: "",
  },
  tracto: {
    eco: "",
    placa: "",
    marca: "",
    modelo: "",
    color: "",
    tipo: "",
  },
  operador: ".",
  telefono: ".",
  inicioMonitoreo: "",
  finalMonitoreo: "",
  status: "nueva",
  eventos: [],
  custodia: {
    custodio1_nombre: "",
    custodio1_telefono: "",
    custodio2_nombre: "",
    custodio2_telefono: "",
    placa: "",
    modelo: "",
    color: "",
    marca: "",
  },
};

const BitacorasPage = () => {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const {user} = useAuth();
  const {isSidebarCollapsed, toggleSidebar, setIsMobileSidebarOpen} = useSidebar();
  const [showModal, setShowModal] = useState(false);
  const [roleData, setRoleData] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState("all");
  const [bitacoras, setBitacoras] = useState([]);
  const [selectedBitacora, setSelectedBitacora] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1); // Track total pages
  const [totalItems, setTotalItems] = useState(25);
  const [clients, setClients] = useState([]);
  const [monitoreos, setMonitoreos] = useState([]);
  const [origenes, setOrigenes] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [sortField, setSortField] = useState("bitacora_id"); // Default sort field
  const [sortOrder, setSortOrder] = useState("desc"); // Default sort order
  const [statusFilter, setStatusFilter] = useState("");
  const [creationDateFilter, setCreationDateFilter] = useState("");
  const [clienteFilter, setClienteFilter] = useState("");
  const [operadorFilter, setOperadorFilter] = useState("");
  const [monitoreoFilter, setMonitoreoFilter] = useState("");
  const [lineaTransporteFilter, setLineaTransporteFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const [loadingBitacoras, setLoadingBitacoras] = useState(false);
  const [selectedTransporte, setSelectedTransporte] = useState(null);
  const [showFrecuenciaModal, setShowFrecuenciaModal] = useState(false);
  const [selectedFrecuenciaBitacora, setSelectedFrecuenciaBitacora] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bitacoraToDelete, setBitacoraToDelete] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasActiveFilters =
    idFilter || clienteFilter || statusFilter || monitoreoFilter ||
    operadorFilter || lineaTransporteFilter || creationDateFilter;

  const updateFormDataFromUser = useCallback(() => {
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        operador: `${user.firstName} ${user.lastName}`,
        telefono: user.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoadingBitacoras(true);

        const operadorFullName = `${user.firstName} ${user.lastName}`;
        const shouldReadAll = roleData?.bitacoras?.read_all;

        // Build filters object
        const filters = {
          statusFilter,
          creationDateFilter,
          clienteFilter,
          monitoreoFilter,
          operadorFilter,
          lineaTransporteFilter,
          idFilter,
          sortField,
          sortOrder,
        };

        const [
          bitacorasData,
          clientsData,
          monitoreosData,
          origenesData,
          destinosData,
          operadoresData,
        ] = await Promise.all([
          fetchBitacoras(
            currentPage,
            itemsPerPage,
            shouldReadAll ? "" : operadorFullName,
            filters,
            roleData
          ),
          fetchClients(roleData),
          fetchMonitoreos(),
          fetchOrigenes(),
          fetchDestinos(),
          fetchOperadores(),
        ]);

        setBitacoras(bitacorasData.bitacoras);
        setTotalItems(bitacorasData.totalItems);
        setTotalPages(bitacorasData.totalPages);
        setClients(clientsData);
        setMonitoreos(monitoreosData);
        setOrigenes(origenesData);
        setDestinos(destinosData);
        setOperadores(operadoresData);

        // Console log to show Cliente field from one bitacora per client
        console.log("=== CLIENTE FIELD ANALYSIS ===");

        // Group by normalized (uppercase) client name to find duplicates
        const normalizedClientMap = new Map();
        const clientVariations = new Map();

        bitacorasData.bitacoras.forEach((bitacora) => {
          const normalizedName = bitacora.cliente.toUpperCase();

          if (!normalizedClientMap.has(normalizedName)) {
            normalizedClientMap.set(normalizedName, []);
            clientVariations.set(normalizedName, new Set());
          }

          normalizedClientMap.get(normalizedName).push(bitacora);
          clientVariations.get(normalizedName).add(bitacora.cliente);
        });

        // Show grouped results
        normalizedClientMap.forEach((bitacoras, normalizedName) => {
          const variations = Array.from(clientVariations.get(normalizedName));
          const hasDuplicates = variations.length > 1;

          console.group(
            `${hasDuplicates ? "🔴 DUPLICATE" : "✅ UNIQUE"} - Normalized: "${normalizedName}"`
          );
          console.log("Variations found:", variations);
          console.log("Total bitacoras:", bitacoras.length);

          // Show one example bitacora for each variation
          variations.forEach((variation) => {
            const exampleBitacora = bitacoras.find((b) => b.cliente === variation);
            if (exampleBitacora) {
              console.log(`  "${variation}" example:`, {
                bitacora_id: exampleBitacora.bitacora_id,
                _id: exampleBitacora._id,
                count: bitacoras.filter((b) => b.cliente === variation).length,
              });
            }
          });

          console.groupEnd();
        });

        console.log("=== END CLIENTE FIELD ANALYSIS ===");

        updateFormDataFromUser();
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoadingBitacoras(false);
      }
    };

    if (user && roleData) {
      initialize();
    }
  }, [
    user,
    roleData,
    currentPage,
    itemsPerPage,
    statusFilter,
    creationDateFilter,
    clienteFilter,
    monitoreoFilter,
    operadorFilter,
    lineaTransporteFilter,
    idFilter,
    sortField,
    sortOrder,
    updateFormDataFromUser,
  ]);

  const handleModalToggle = () => {
    setShowModal(!showModal);
  };

  const handlePDFToggle = (bitacora) => {
    setSelectedBitacora(bitacora);
    setShowPrintModal(!showPrintModal);

    const closedTransportes = getClosedTransportesFromEventos(bitacora);
    const allTransportesClosed =
      bitacora.transportes?.every((t) => closedTransportes.some((ct) => tMatch(ct, t))) ?? false;

    setSelectedOption(allTransportesClosed ? "all" : "one");
  };

  useEffect(() => {
    const fetchRolePermissions = async () => {
      if (!user) return; // Ensure user is available before fetching role data

      try {
        const response = await fetch(`${baseUrl}/roles/${user.role}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        setRoleData(data);
      } catch (e) {
        console.log("Error fetching role permissions:", e);
      }
    };

    fetchRolePermissions();
  }, [user, baseUrl]);

  const handleChange = (e) => {
    const {id, value} = e.target;

    if (id.startsWith("remolque") || id.startsWith("tracto")) {
      const [field, key] = id.split("_");
      setFormData((prevData) => ({
        ...prevData,
        [field]: {
          ...prevData[field],
          [key]: value,
        },
      }));
    } else if (id.startsWith("custodia")) {
      const field = id.replace("custodia_", "");
      setFormData((prevData) => ({
        ...prevData,
        custodia: {
          ...prevData.custodia,
          [field]: value,
        },
      }));
    } else if (id === "cliente") {
      // When client changes, reset origin and destination
      setFormData((prevData) => ({
        ...prevData,
        [id]: value,
        origen: "", // Reset origin when client changes
        destino: "", // Reset destination when client changes
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [id]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate ObjectIds before processing
      const validateObjectId = (id) => {
        if (!id || typeof id !== "string") return false;
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        return objectIdRegex.test(id.trim());
      };

      // Check if origen and destino are valid ObjectIds
      if (!validateObjectId(formData.origen)) {
        alert("Error: El origen debe ser un ID válido (24 caracteres hexadecimales sin espacios)");
        return;
      }

      if (!validateObjectId(formData.destino)) {
        alert("Error: El destino debe ser un ID válido (24 caracteres hexadecimales sin espacios)");
        return;
      }

      // Convert text fields to uppercase before sending
      // Exclude certain fields that should remain as-is
      const excludeFields = [
        "status",
        "inicioMonitoreo",
        "finalMonitoreo",
        "telefono",
        "_id",
        "createdAt",
        "updatedAt",
        "origen",
        "destino", // ObjectIds should not be converted to uppercase as strings
      ];
      const uppercaseFormData = convertToUpperCase(formData, excludeFields);

      const response = await fetch(`${baseUrl}/bitacora`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        credentials: "include",
        body: JSON.stringify(uppercaseFormData),
      });
      if (response.ok) {
        // After successful creation, you might want to refetch bitacoras
        setFormData(defaultFormData); // 💥 Reset all fields
        const operadorFullName = `${user.firstName} ${user.lastName}`;
        const shouldReadAll = roleData?.bitacoras?.read_all;

        const createdBitacora = await response.json();

        // 🔍 Audit bitácora creation
        await generateAuditoriaForCreation({
          newData: formData.bitacora_id,
          bitacoraId: createdBitacora.bitacora_id, // Use backend response ID
          user,
        });

        try {
          setLoadingBitacoras(true);

          // Build filters object for refetch
          const filters = {
            statusFilter,
            creationDateFilter,
            clienteFilter,
            monitoreoFilter,
            operadorFilter,
            lineaTransporteFilter,
            idFilter,
            sortField,
            sortOrder,
          };

          const [
            bitacorasData,
            clientsData,
            monitoreosData,
            origenesData,
            destinosData,
            operadoresData,
          ] = await Promise.all([
            fetchBitacoras(
              currentPage,
              itemsPerPage,
              shouldReadAll ? "" : operadorFullName,
              filters,
              roleData
            ),
            fetchClients(roleData),
            fetchMonitoreos(),
            fetchOrigenes(),
            fetchDestinos(),
            fetchOperadores(),
          ]);

          setBitacoras(bitacorasData.bitacoras);
          setTotalItems(bitacorasData.totalItems);
          setTotalPages(bitacorasData.totalPages);
          setClients(clientsData);
          setMonitoreos(monitoreosData);
          setOrigenes(origenesData);
          setDestinos(destinosData);
          setOperadores(operadoresData);

          updateFormDataFromUser();
        } catch (e) {
          console.error("Verification failed:", e);
        } finally {
          setLoadingBitacoras(false);
        }

        handleModalToggle();
      } else {
        // Handle validation errors from backend
        if (response.status === 400) {
          const errorData = await response.json();
          if (errorData.details && Array.isArray(errorData.details)) {
            alert(`Error de validación:\n${errorData.details.join("\n")}`);
          } else {
            alert(`Error: ${errorData.error || "Datos inválidos"}`);
          }
        } else {
          console.error("Failed to create bitácora:", response.statusText);
          alert("Error al crear la bitácora. Por favor, inténtalo de nuevo.");
        }
      }
    } catch (e) {
      console.error("Error creating bitácora:", e);
    }
  };

  const handleRadioChange = (e) => {
    setSelectedOption(e.target.value);
    if (e.target.value === "option2") {
      setFormData({...formData, selectValue: ""}); // Reset select value when "option2" is selected
    }
  };

  const handleSelectChange = (e) => {
    setSelectedTransporte(e.target.value);
  };

  const handlePDFSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    if (selectedOption === "all") {
      console.log(selectedBitacora?.bitacora_id);
      generatePDF(selectedBitacora);
    } else if (selectedOption === "one") {
      console.log(selectedTransporte);
      generatePDF(selectedBitacora, selectedTransporte);
    }
  };

  // Server-side filtering is now handled by the API
  const sortedFilteredBitacoras = bitacoras;

  // Clear filters function
  const clearFilters = () => {
    setStatusFilter("");
    setCreationDateFilter("");
    setClienteFilter("");
    setMonitoreoFilter("");
    setOperadorFilter("");
    setLineaTransporteFilter("");
    setIdFilter("");
    setSortField("bitacora_id");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Filter change handlers that reset to page 1
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCreationDateFilterChange = (value) => {
    setCreationDateFilter(value);
    setCurrentPage(1);
  };

  const handleClienteFilterChange = (value) => {
    setClienteFilter(value);
    setCurrentPage(1);
  };

  const handleMonitoreoFilterChange = (value) => {
    setMonitoreoFilter(value);
    setCurrentPage(1);
  };

  const handleIdFilterChange = (value) => {
    setIdFilter(value);
    setCurrentPage(1);
  };

  const handleOperadorFilterChange = (value) => {
    setOperadorFilter(value);
    setCurrentPage(1);
  };

  const handleLineaTransporteFilterChange = (value) => {
    setLineaTransporteFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (event) => {
    const newLimit = Number(event.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const generatePDF = async (bitacora, transporteId = "") => {
    const tempContainer = document.createElement("div");
    tempContainer.id = "tempContainer";
    tempContainer.style.position = "absolute";
    tempContainer.style.top = "0";
    tempContainer.style.left = "0";
    tempContainer.style.width = "100%";
    tempContainer.style.backgroundColor = "#fff";
    tempContainer.style.zIndex = "10000";
    document.body.appendChild(tempContainer);

    const root = createRoot(tempContainer);

    const oldBitacorasCount = import.meta.env.VITE_OLD_BITACORAS_COUNT;

    if (parseInt(bitacora.bitacora_id) <= oldBitacorasCount) {
      root.render(<OldBitacoraDetail bitacora={bitacora} />);
    } else {
      // Fetch the bitacora with resolved origen and destino names using the same endpoint as BitacoraDetailPage
      const response = await fetch(`${baseUrl}/bitacora/${bitacora._id}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const resolvedBitacora = await response.json();

        if (transporteId === "") {
          root.render(<BitacoraDetail bitacora={resolvedBitacora} />);
        } else {
          root.render(
            <BitacoraDetail bitacora={resolvedBitacora} transporteId={selectedTransporte} />
          );
        }
      } else {
        console.error("Failed to fetch resolved bitacora:", response.statusText);
        // Fallback to original bitacora
        if (transporteId === "") {
          root.render(<BitacoraDetail bitacora={bitacora} />);
        } else {
          root.render(<BitacoraDetail bitacora={bitacora} transporteId={selectedTransporte} />);
        }
      }
    }

    const style = document.createElement("style");
    style.textContent = `
    @media print {
      .sidebar-wrapper {
        display: none; /* Hide everything outside tempContainer */
      }
    }
  `;
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
      root.unmount();
      document.body.removeChild(tempContainer);
      document.head.removeChild(style);
    }, 10); // Adjusted delay to ensure rendering completion
  };

  const tMatch = (a, b) =>
    (a.internalId && b.internalId && a.internalId === b.internalId) || a.id === b.id;

  const getTransporteLabel = (transporte) => {
    const id = transporte?.id || "";
    if (!id) return "Sin ID";
    if (id.startsWith("T") && id.includes("_")) return id;
    const parts = id.split("_");
    if (parts.length >= 3) return `${parts[1]} - ${parts[2]}`;
    if (parts.length === 2) return `${parts[0]} - ${parts[1]}`;
    return id;
  };

  // Returns current transporte objects (from bitacora.transportes) that have a cierre evento.
  const getClosedTransportesFromEventos = (bitacora) => {
    const closedRefs = [];

    bitacora?.eventos?.forEach((evento) => {
      if (evento.nombre.toUpperCase() === "CIERRE DE SERVICIO" && evento.transportes) {
        evento.transportes.forEach((et) => closedRefs.push(et));
      }
    });

    // Return the live transporte objects matched by internalId or id
    return (bitacora?.transportes || []).filter((t) =>
      closedRefs.some((ref) => tMatch(ref, t))
    );
  };

  const isAnyTransporteClosed = (bitacora) => {
    return getClosedTransportesFromEventos(bitacora).length > 0;
  };

  // Delete handlers
  const handleDeleteClick = (bitacora) => {
    setBitacoraToDelete(bitacora);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setBitacoraToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!bitacoraToDelete) return;

    try {
      const response = await fetch(`${baseUrl}/bitacora/${bitacoraToDelete._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Remove the deleted bitacora from the list
        setBitacoras(bitacoras.filter((b) => b._id !== bitacoraToDelete._id));
        setShowDeleteModal(false);
        setBitacoraToDelete(null);
      } else {
        console.error("Failed to delete bitácora:", response.statusText);
      }
    } catch (e) {
      console.error("Error deleting bitácora:", e);
    }
  };

  const handleSortChange = (field) => {
    const order = field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const getEventColor = (bitacora) => {
    // if (!["iniciada", "validada"].includes(bitacora.status)) {
    //   return ["#333235"];
    // }

    const eventos = bitacora.eventos || [];

    // Últimos 5 eventos más recientes
    const lastFive = [...eventos]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return lastFive.map((evt, idx) => {
      // Si es "Cierre de servicio", devolver negro
      if (evt.nombre === "Cierre de servicio") return "black";

      // Si tiene la bandera de frecuencia cumplida
      if (idx > 0 && evt.isFrecuenciaMet != null) {
        return evt.isFrecuenciaMet ? "#51FF4E" : "#F82929";
      }

      // Si no tiene bandera, calcular según tiempo
      const freq = evt.frecuencia;
      if (!freq) return "#333235";
      const freqMs = freq * 60000;
      const elapsed = Date.now() - new Date(evt.createdAt).getTime();

      if (elapsed < freqMs * 0.75) return "#51FF4E";
      if (elapsed < freqMs) return "#ECEC27";
      return "#F82929";
    });
  };

  const getRecorrido = (bitacora) => {
    if (
      bitacora.status != "iniciada" &&
      bitacora.status != "validada" &&
      bitacora.status != "cerrada" &&
      bitacora.status != "finalizada"
    ) {
      return ""; // No events
    }

    const latestEvent = bitacora.eventos.reduce((latest, current) =>
      new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current
    );

    const recorrido = latestEvent.nombre;
    if (!recorrido) return ""; // No frecuencia

    return recorrido;
  };

  const openFrecuenciaModal = async (bitacora) => {
    try {
      // Fetch the bitacora with resolved origen and destino names using the same endpoint as BitacoraDetailPage
      const response = await fetch(`${baseUrl}/bitacora/${bitacora._id}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const resolvedBitacora = await response.json();
        setSelectedFrecuenciaBitacora(resolvedBitacora);
        setShowFrecuenciaModal(true);
      } else {
        console.error("Failed to fetch resolved bitacora:", response.statusText);
        // Fallback to original bitacora
        setSelectedFrecuenciaBitacora(bitacora);
        setShowFrecuenciaModal(true);
      }
    } catch (error) {
      console.error("Error fetching resolved bitacora:", error);
      // Fallback to original bitacora
      setSelectedFrecuenciaBitacora(bitacora);
      setShowFrecuenciaModal(true);
    }
  };

  const closeFrecuenciaModal = () => {
    setShowFrecuenciaModal(false);
    setSelectedFrecuenciaBitacora(null);
  };

  const getLatestFrecuenciaColor = (bitacora) => {
    const eventos = bitacora.eventos || [];

    if (["cerrada", "finalizada", "nueva"].includes(bitacora.status)) {
      return "#FFFFFF"; // Blanco
    }

    const sortedEventos = [...eventos].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const evt = sortedEventos[0];

    if (!evt) return "#333235";

    if (evt.nombre === "Cierre de servicio") return "#000000";
    if (evt.isFrecuenciaMet != null) return evt.isFrecuenciaMet ? "#51FF4E" : "#F82929";

    const freq = evt.frecuencia;
    if (!freq) return "#FFFFF";
    const freqMs = freq * 60000;
    const elapsed = Date.now() - new Date(evt.createdAt).getTime();

    if (elapsed < freqMs * 0.75) return "#80ff7e"; // Verde
    if (elapsed < freqMs) return "#ffff8d"; // Amarillo
    return "#ffa0a0"; // Rojo
  };

  const getUniqueTransportLines = (bitacora) => {
    const transportLines = new Set();

    // Iterate through all events in the bitácora
    if (bitacora.eventos && Array.isArray(bitacora.eventos)) {
      bitacora.eventos.forEach((evento) => {
        // Check if the event has transportes
        if (evento.transportes && Array.isArray(evento.transportes)) {
          evento.transportes.forEach((transporte) => {
            // Add the lineaTransporte if it exists and is not empty
            if (transporte.lineaTransporte && transporte.lineaTransporte.trim() !== "") {
              transportLines.add(transporte.lineaTransporte.trim());
            }
          });
        }
      });
    }

    // Also check transportes directly in the bitacora (for compatibility)
    if (bitacora.transportes && Array.isArray(bitacora.transportes)) {
      bitacora.transportes.forEach((transporte) => {
        if (transporte.lineaTransporte && transporte.lineaTransporte.trim() !== "") {
          transportLines.add(transporte.lineaTransporte.trim());
        }
      });
    }

    // Convert Set to Array and join with commas
    return Array.from(transportLines).join(", ");
  };

  // Get all unique transport lines from all bitacoras for the filter dropdown
  const getAllUniqueTransportLines = () => {
    const transportLines = new Set();

    bitacoras.forEach((bitacora) => {
      // Check eventos
      if (bitacora.eventos && Array.isArray(bitacora.eventos)) {
        bitacora.eventos.forEach((evento) => {
          if (evento.transportes && Array.isArray(evento.transportes)) {
            evento.transportes.forEach((transporte) => {
              if (transporte.lineaTransporte && transporte.lineaTransporte.trim() !== "") {
                transportLines.add(transporte.lineaTransporte.trim());
              }
            });
          }
        });
      }

      // Check transportes directly (for compatibility)
      if (bitacora.transportes && Array.isArray(bitacora.transportes)) {
        bitacora.transportes.forEach((transporte) => {
          if (transporte.lineaTransporte && transporte.lineaTransporte.trim() !== "") {
            transportLines.add(transporte.lineaTransporte.trim());
          }
        });
      }
    });

    return Array.from(transportLines).sort();
  };

  return (
    <section id="activeBits">
      <div className="w-100 d-flex h-100 mt-0">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          {/* Page header */}
          <PageHeader
            title="Bitácoras"
            count={totalItems}
            onToggleSidebar={() => setIsMobileSidebarOpen(true)}
            filters={
              <div className="bits-filters-panel">
                <div className="row g-2">
                  <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                    <label className="small fw-bold mb-1">ID</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Buscar ID..."
                      value={idFilter}
                      onChange={(e) => handleIdFilterChange(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                    <label className="small fw-bold mb-1">Cliente</label>
                    <select
                      className="form-select form-select-sm"
                      value={clienteFilter}
                      onChange={(e) => handleClienteFilterChange(e.target.value)}>
                      <option value="">Todos los clientes</option>
                      {clients
                        .sort((a, b) => a.razon_social.localeCompare(b.razon_social))
                        .map((c, i) => (
                          <option key={i} value={c.razon_social}>{c.razon_social}</option>
                        ))}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                    <label className="small fw-bold mb-1">Línea Transporte</label>
                    <select
                      className="form-select form-select-sm"
                      value={lineaTransporteFilter}
                      onChange={(e) => handleLineaTransporteFilterChange(e.target.value)}>
                      <option value="">Todas las líneas</option>
                      {getAllUniqueTransportLines().map((linea, id) => (
                        <option key={id} value={linea}>
                          {linea}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                    <label className="small fw-bold mb-1">Tipo Monitoreo</label>
                    <select
                      className="form-select form-select-sm"
                      value={monitoreoFilter}
                      onChange={(e) => handleMonitoreoFilterChange(e.target.value)}>
                      <option value="">Todos los tipos</option>
                      {monitoreos
                        .sort((a, b) => a.tipoMonitoreo.localeCompare(b.tipoMonitoreo))
                        .map((monitreo, id) => (
                          <option key={id} value={monitreo.tipoMonitoreo}>
                            {monitreo.tipoMonitoreo}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                    <label className="small fw-bold mb-1">Usuario</label>
                    <select
                      className="form-select form-select-sm"
                      value={operadorFilter}
                      onChange={(e) => handleOperadorFilterChange(e.target.value)}>
                      <option value="">Todos los usuarios</option>
                      {operadores
                        .filter((operador) => operador && operador.name)
                        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                        .map((operador, id) => (
                          <option key={id} value={operador.name}>
                            {operador.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                    <label className="small fw-bold mb-1">Fecha Creación</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={creationDateFilter}
                      onChange={(e) => handleCreationDateFilterChange(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                    <label className="small fw-bold mb-1">Estatus</label>
                    <select
                      className="form-select form-select-sm"
                      value={statusFilter}
                      onChange={(e) => handleStatusFilterChange(e.target.value)}>
                      <option value="">Todos los estatus</option>
                      <option value="nueva">Nueva</option>
                      <option value="validada">Validada</option>
                      <option value="iniciada">Iniciada</option>
                      {roleData?.ver_bitacoras_cerradas !== false && (
                        <>
                          <option value="cerrada">Cerrada</option>
                          <option value="cerrada (e)">Cerrada (e)</option>
                        </>
                      )}
                      <option value="finalizada">Finalizada</option>
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-md-3 col-lg-2 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => { clearFilters(); }}>
                      <i className="fa fa-eraser me-1"></i>Limpiar
                    </button>
                  </div>
                </div>
              </div>
            }
          >
            {roleData?.bitacoras?.create && (
                <button className="new-btn" onClick={() => setShowModal(!showModal)}>
                  <i className="fa fa-plus"></i>
                </button>
              )}
          </PageHeader>

          {/* Table */}
          {roleData?.bitacoras?.read && (
            <div className="bits-table-shell mt-4">
            <div className="table-wrapper">
              <div className="table-container">
                <div className="table-responsive">
                  <table className="table table-hover modern-table">
                    <thead className="table-header">
                      <tr>
                        <th
                          className="sortable-header"
                          onClick={() => handleSortChange("frecuencia")}
                          style={{cursor: "pointer", width: "80px"}}>
                          <div className="header-content">
                            <span className="header-text">Frec</span>
                            {sortField === "frecuencia" && (
                              <i
                                className={`fa fa-sort-${
                                  sortOrder === "asc" ? "up" : "down"
                                } ms-1`}></i>
                            )}
                          </div>
                        </th>
                        <th
                          className="sortable-header"
                          onClick={() => handleSortChange("bitacora_id")}
                          style={{cursor: "pointer", width: "100px"}}>
                          <div className="header-content">
                            <span className="header-text">ID</span>
                            {sortField === "bitacora_id" && (
                              <i
                                className={`fa fa-sort-${
                                  sortOrder === "asc" ? "up" : "down"
                                } ms-1`}></i>
                            )}
                          </div>
                        </th>
                        <th
                          className="sortable-header"
                          onClick={() => handleSortChange("cliente")}
                          style={{cursor: "pointer", width: "150px"}}>
                          <div className="header-content">
                            <span className="header-text">Cliente</span>
                            {sortField === "cliente" && (
                              <i
                                className={`fa fa-sort-${
                                  sortOrder === "asc" ? "up" : "down"
                                } ms-1`}></i>
                            )}
                          </div>
                        </th>
                        <th
                          className="sortable-header d-none d-lg-table-cell"
                          style={{cursor: "pointer", width: "180px"}}>
                          <div className="header-content">
                            <span className="header-text">
                              Líneas de
                              <br />
                              Transporte
                            </span>
                          </div>
                        </th>
                        <th
                          className="sortable-header d-none d-md-table-cell"
                          onClick={() => handleSortChange("monitoreo")}
                          style={{cursor: "pointer", width: "120px"}}>
                          <div className="header-content">
                            <span className="header-text">
                              Tipo
                              <br />
                              Monitoreo
                            </span>
                            {sortField === "monitoreo" && (
                              <i
                                className={`fa fa-sort-${
                                  sortOrder === "asc" ? "up" : "down"
                                } ms-1`}></i>
                            )}
                          </div>
                        </th>
                        <th
                          className="sortable-header d-none d-lg-table-cell"
                          onClick={() => handleSortChange("operador")}
                          style={{cursor: "pointer", width: "140px"}}>
                          <div className="header-content">
                            <span className="header-text">Usuario</span>
                            {sortField === "operador" && (
                              <i
                                className={`fa fa-sort-${
                                  sortOrder === "asc" ? "up" : "down"
                                } ms-1`}></i>
                            )}
                          </div>
                        </th>
                        <th
                          className="sortable-header d-none d-md-table-cell"
                          onClick={() => handleSortChange("createdAt")}
                          style={{cursor: "pointer", width: "110px"}}>
                          <div className="header-content">
                            <span className="header-text">
                              Fecha
                              <br />
                              Creación
                            </span>
                            {sortField === "createdAt" && (
                              <i
                                className={`fa fa-sort-${
                                  sortOrder === "asc" ? "up" : "down"
                                } ms-1`}></i>
                            )}
                          </div>
                        </th>
                        <th
                          className="sortable-header"
                          onClick={() => handleSortChange("status")}
                          style={{cursor: "pointer", width: "120px"}}>
                          <div className="header-content">
                            <span className="header-text">Estatus</span>
                            {sortField === "status" && (
                              <i
                                className={`fa fa-sort-${
                                  sortOrder === "asc" ? "up" : "down"
                                } ms-1`}></i>
                            )}
                          </div>
                        </th>
                        <th className="text-center d-none d-lg-table-cell" style={{width: "150px"}}>
                          <span className="header-text">
                            Estatus
                            <br />
                            Documentación
                          </span>
                        </th>
                        <th className="text-center" style={{width: "80px"}}>
                          <i className="fa fa-download text-muted"></i>
                        </th>
                        <th className="text-center" style={{width: "80px"}}>
                          <i className="fa fa-trash text-muted"></i>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {loadingBitacoras ? (
                        <tr>
                          <td colSpan="12" className="text-center py-5">
                            <div className="loading-container">
                              <i className="fa fa-spinner fa-spin text-primary me-2"></i>
                              <span className="text-muted">Cargando bitácoras...</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        sortedFilteredBitacoras.map((bitacora) => (
                          <tr key={bitacora._id} className="table-row">
                            <td data-label="Frec" className="table-cell" style={{width: "80px"}}>
                              <div
                                className="semaforo-container"
                                onClick={() => openFrecuenciaModal(bitacora)}
                                style={{cursor: "pointer"}}>
                                {getEventColor(bitacora).map((color, index) => (
                                  <div
                                    key={index}
                                    className="semaforo-circle"
                                    style={{
                                      backgroundColor: color,
                                    }}></div>
                                ))}
                              </div>
                            </td>
                            <td data-label="ID" className="table-cell" style={{width: "100px"}}>
                              <a
                                href={`/bitacora/${bitacora._id}`}
                                className={`bitacora-link ${
                                  getLatestFrecuenciaColor(bitacora) === "#000000"
                                    ? "text-white"
                                    : "text-dark"
                                }`}
                                style={{
                                  backgroundColor: getLatestFrecuenciaColor(bitacora),
                                }}>
                                {bitacora.bitacora_id}
                              </a>
                            </td>
                            <td data-label="Cliente" className="table-cell" style={{width: "150px"}}>
                              <span className="cell-text">{bitacora.cliente}</span>
                            </td>
                            <td
                              className="table-cell d-none d-lg-table-cell"
                              style={{width: "180px"}}>
                              <span className="cell-text">{getUniqueTransportLines(bitacora)}</span>
                            </td>
                            <td
                              className="table-cell d-none d-md-table-cell"
                              style={{width: "120px"}}>
                              <span className="cell-text">{bitacora.monitoreo}</span>
                            </td>
                            <td
                              className="table-cell d-none d-lg-table-cell"
                              style={{width: "140px"}}>
                              <span className="cell-text">{bitacora.operador}</span>
                            </td>
                            <td
                              className="table-cell d-none d-md-table-cell"
                              style={{width: "110px"}}>
                              <span className="cell-text">
                                {new Date(bitacora.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td data-label="Estatus" className="table-cell text-center" style={{width: "120px"}}>
                              <div style={{display: "flex", justifyContent: "center", alignItems: "center", gap: "0.375rem"}}>
                                <span className={`status-badge status-${bitacora.status}`}>
                                  {bitacora.status}
                                  {bitacora.edited ? " (e)" : ""}
                                </span>
                                {roleData?.aceptar_draft && bitacora.draft_pendiente && (
                                  <Tooltip text="Borrador pendiente de aprobación" position="top">
                                    <span className="draft-dot" />
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                            <td
                              className="table-cell d-none d-lg-table-cell"
                              style={{width: "150px"}}>
                              <span className="cell-text">{getRecorrido(bitacora)}</span>
                            </td>
                            <td className="table-cell table-cell-actions text-center" style={{width: "80px"}}>
                              <div className="d-flex justify-content-center">
                                <button
                                  className={`action-btn ${
                                    isAnyTransporteClosed(bitacora) ? "btn-primary" : "btn-secondary"
                                  }`}
                                  onClick={() => handlePDFToggle(bitacora)}
                                  disabled={!isAnyTransporteClosed(bitacora)}
                                  title="Descargar PDF">
                                  <i className="fa fa-file-pdf"></i>
                                </button>
                              </div>
                            </td>
                            <td className="table-cell table-cell-actions text-center" style={{width: "80px"}}>
                              <div className="d-flex justify-content-center">
                                {roleData?.bitacoras?.delete && (
                                  <button
                                    className="action-btn btn-danger"
                                    onClick={() => handleDeleteClick(bitacora)}
                                    title="Eliminar bitácora">
                                    <i className="fa fa-trash"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pagination-container">
                <div className="pagination-content">
                  <div className="pagination-info">
                    <div className="items-per-page">
                      <label htmlFor="itemsPerPage" className="form-label">
                        Items por página:
                      </label>
                      <select
                        id="itemsPerPage"
                        className="form-select form-select-sm modern-select"
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  <div className="pagination-stats">
                    <span className="stats-text">{`${startItem}-${endItem} de ${totalItems}`}</span>
                  </div>

                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}>
                      <i className="fa fa-chevron-left"></i>
                    </button>

                    <div className="page-numbers">
                      {getPageNumbers(currentPage, totalPages).map((page, i) =>
                        page === "..." ? (
                          <span key={`ellipsis-${i}`} className="page-ellipsis">...</span>
                        ) : (
                          <button
                            key={page}
                            type="button"
                            className={`page-btn ${page === currentPage ? "active" : ""}`}
                            onClick={() => handlePageChange(page)}>
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}>
                      <i className="fa fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Print PDF Select Modal */}

      <>
        {showPrintModal && selectedBitacora && (
          <ModalTemplate
            show={showPrintModal}
            title="Método de Impresión"
            onClose={handlePDFToggle}
            onSubmit={handlePDFSubmit}
            submitClass="btn btn-primary"
            submitText="Imprimir">
            {/* PDF Option Form */}
            <form onSubmit={handlePDFSubmit}>
              {/* Radio Buttons */}
              <div className="mb-3">
                {(() => {
                  const closedTransportes = getClosedTransportesFromEventos(selectedBitacora);
                  const allClosed =
                    selectedBitacora?.transportes?.every((t) => closedTransportes.some((ct) => tMatch(ct, t))) ?? false;

                  return (
                    <div className="d-flex">
                      <div className="d-flex w-100 gap-2">
                        <input
                          type="radio"
                          id="all"
                          name="radioOption"
                          value="all"
                          checked={selectedOption === "all"}
                          onChange={handleRadioChange}
                          disabled={!allClosed}
                        />
                        <label htmlFor="all" className={allClosed ? "" : "text-muted"}>
                          Todos los transportes
                        </label>
                      </div>

                      <div className="d-flex w-100 gap-2">
                        <input
                          type="radio"
                          id="one"
                          name="radioOption"
                          value="one"
                          checked={selectedOption === "one"}
                          onChange={handleRadioChange}
                        />
                        <label htmlFor="one">Seleccionar transporte</label>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Transporte Select if "one" option selected */}
              {selectedOption === "one" && selectedBitacora?.transportes?.length > 0 && (
                <div className="mb-3">
                  <label htmlFor="selectValue" className="form-label">
                    ID del transporte
                  </label>
                  <select
                    id="selectValue"
                    className="form-select"
                    value={formData.selectValue}
                    onChange={handleSelectChange}
                    required>
                    <option value="">Seleccionar ID</option>
                    {getClosedTransportesFromEventos(selectedBitacora).map((t) => (
                      <option value={t.internalId || t.id} key={t.internalId || t.id}>
                        {getTransporteLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </form>
          </ModalTemplate>
        )}
      </>

      {/* Modal with Backdrop */}
      {showModal && (
        <ModalTemplate
          show={showModal}
          title="Nueva Bitácora"
          onClose={handleModalToggle}
          onSubmit={handleSubmit}>
          <div style={{maxHeight: "60vh", overflowY: "auto", paddingRight: "6px"}}>
            {/* Tipo de Monitoreo */}
            <div className="mb-3">
              <label htmlFor="monitoreo" className="form-label">
                Tipo de Monitoreo <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                id="monitoreo"
                value={formData.monitoreo}
                onChange={handleChange}
                required>
                <option value="">Selecciona una opción</option>
                {monitoreos
                  .sort((a, b) => a.tipoMonitoreo.localeCompare(b.tipoMonitoreo))
                  .map((monitoreo) => (
                    <option key={monitoreo._id} value={monitoreo.tipoMonitoreo}>
                      {monitoreo.tipoMonitoreo}
                    </option>
                  ))}
              </select>
            </div>

            {/* Cliente */}
            <div className="mb-3">
              <label htmlFor="cliente" className="form-label">
                Cliente <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                id="cliente"
                value={formData.cliente}
                onChange={handleChange}
                required>
                <option value="">Selecciona una opción</option>
                {clients
                  .sort((a, b) => a.razon_social.localeCompare(b.razon_social))
                  .map((client) => (
                    <option key={client._id} value={client.razon_social}>
                      {client.razon_social}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="folio_servicio">Folio de Servicio <span className="text-danger">*</span></label>
              <input
                id="folio_servicio"
                type="text"
                value={formData.folio_servicio}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            {/* Origen */}
            <div className="mb-3">
              <label htmlFor="origen" className="form-label">
                Origen <span className="text-danger">*</span>
              </label>
              <select
                id="origen"
                className="form-select"
                value={formData.origen}
                onChange={handleChange}
                disabled={!formData.cliente}
                required>
                <option value="">
                  {formData.cliente ? "Seleccionar origen" : "Primero selecciona un cliente"}
                </option>
                {formData.cliente &&
                  origenes
                    .filter((origen) => origen.cliente === formData.cliente)
                    .sort((a, b) =>
                      `${a.nombre}, ${a.estado}`.localeCompare(`${b.nombre}, ${b.estado}`)
                    )
                    .map((origen) => (
                      <option key={origen._id} value={origen._id}>
                        {`${origen.nombre}, ${origen.estado}`}
                      </option>
                    ))}
              </select>
            </div>

            {/* Destino */}
            <div className="mb-3">
              <label htmlFor="destino" className="form-label">
                Destino <span className="text-danger">*</span>
              </label>
              <select
                id="destino"
                className="form-select"
                value={formData.destino}
                onChange={handleChange}
                disabled={!formData.cliente}
                required>
                <option value="">
                  {formData.cliente ? "Seleccionar destino" : "Primero selecciona un cliente"}
                </option>
                {formData.cliente &&
                  destinos
                    .filter((destino) => destino.cliente === formData.cliente)
                    .sort((a, b) =>
                      `${a.nombre}, ${a.estado}`.localeCompare(`${b.nombre}, ${b.estado}`)
                    )
                    .map((destino) => (
                      <option key={destino._id} value={destino._id}>
                        {`${destino.nombre}, ${destino.estado}`}
                      </option>
                    ))}
              </select>
            </div>
            {(formData.monitoreo === "Custodia fisica" ||
              formData.monitoreo === "CUSTODIA FISICA" ||
              formData.monitoreo?.toLowerCase() === "custodia fisica") && (
              <>
                <div className="mb-3">
                  <label className="form-label">Nombre de Primer Custodio <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    id="custodia_custodio1_nombre"
                    className="form-control"
                    value={formData.custodia.custodio1_nombre}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Teléfono Primer Custodio <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    id="custodia_custodio1_telefono"
                    className="form-control"
                    value={formData.custodia.custodio1_telefono}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Nombre de Segundo Custodio</label>
                  <input
                    type="text"
                    id="custodia_custodio2_nombre"
                    className="form-control"
                    value={formData.custodia.custodio2_nombre}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Teléfono Segundo Custodio</label>
                  <input
                    type="text"
                    id="custodia_custodio2_telefono"
                    className="form-control"
                    value={formData.custodia.custodio2_telefono}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Placa</label>
                  <input
                    type="text"
                    id="custodia_placa"
                    className="form-control"
                    value={formData.custodia.placa}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Modelo</label>
                  <input
                    type="text"
                    id="custodia_modelo"
                    className="form-control"
                    value={formData.custodia.modelo}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Color</label>
                  <input
                    type="text"
                    id="custodia_color"
                    className="form-control"
                    value={formData.custodia.color}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Marca</label>
                  <input
                    type="text"
                    id="custodia_marca"
                    className="form-control"
                    value={formData.custodia.marca}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>
        </ModalTemplate>
      )}

      {showFrecuenciaModal && selectedFrecuenciaBitacora && (
        <EventsPopup
          bitacora={selectedFrecuenciaBitacora}
          onClose={closeFrecuenciaModal}
          origenes={origenes}
          destinos={destinos}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && bitacoraToDelete && (
        <ModalTemplate
          show={showDeleteModal}
          title="Confirmar Eliminación"
          onClose={handleCloseDeleteModal}
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirmDelete();
          }}
          submitClass="btn btn-danger"
          submitText="Eliminar">
          <p>
            ¿Está seguro de que desea eliminar la bitácora{" "}
            <strong>{bitacoraToDelete.bitacora_id}</strong>?
          </p>
          <p className="text-muted small">
            La bitácora será marcada como eliminada y no aparecerá en las búsquedas, pero se
            mantendrá en la base de datos para auditoría.
          </p>
        </ModalTemplate>
      )}
    </section>
  );
};

export default BitacorasPage;
