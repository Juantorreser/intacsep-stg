import React, {useState, useEffect} from "react";
import {createRoot} from "react-dom/client";
import {useAuth} from "../../context/AuthContext";
import {useNavigate} from "react-router-dom";
import Header from "../Header";
import Sidebar from "../Sidebar";
import "jspdf-autotable"; // For table support in jsPDF
import {sortBitacoras} from "../../utils/utils"; // Assume these functions exist
import BitacoraDetail from "./BitacoraDetail";
import OldBitacoraDetail from "./OldBitacoraPDF";
import ModalTemplate from "../ModalTemplate";
import EventsPopup from "./Eventos/EventsPopup";
import {
  fetchBitacoras,
  fetchClients,
  fetchMonitoreos,
  fetchUsers,
  fetchOrigenes,
  fetchDestinos,
  fetchOperadores,
} from "../../utils/api";
import {generateAuditoriaForCreation, generateAuditoriasFromChanges} from "../../utils/auditoria";

const defaultFormData = {
  bitacora_id: "",
  folio_servicio: "",
  linea_transporte: ".",
  destino: {nombre: "", estado: "", municipio: ""},
  origen: {nombre: "", estado: "", municipio: ""},
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
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [roleData, setRoleData] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState("all");
  const [PDFOption, setPDFOption] = useState({
    selectValue: "",
  });
  const [bitacoras, setBitacoras] = useState([]);
  const [selectedBitacora, setSelectedBitacora] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1); // Track total pages
  const [totalItems, setTotalItems] = useState(25);
  const [clients, setClients] = useState([]);
  const [monitoreos, setMonitoreos] = useState([]);
  const [users, setUsers] = useState([]);
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
  const [idFilter, setIdFilter] = useState("");
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const [loadingBitacoras, setLoadingBitacoras] = useState(false);
  const [selectedTransporte, setSelectedTransporte] = useState(null);
  const [showFrecuenciaModal, setShowFrecuenciaModal] = useState(false);
  const [selectedFrecuenciaBitacora, setSelectedFrecuenciaBitacora] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoadingBitacoras(true);

        const operadorFullName = `${user.firstName} ${user.lastName}`;
        const shouldReadAll = roleData?.bitacoras?.read_all;

        const [
          bitacorasData,
          clientsData,
          monitoreosData,
          usersData,
          origenesData,
          destinosData,
          operadoresData,
        ] = await Promise.all([
          fetchBitacoras(currentPage, itemsPerPage, shouldReadAll ? "" : operadorFullName),
          fetchClients(),
          fetchMonitoreos(),
          fetchUsers(),
          fetchOrigenes(),
          fetchDestinos(),
          fetchOperadores(),
        ]);

        setBitacoras(bitacorasData.bitacoras);
        setTotalItems(bitacorasData.totalItems);
        setTotalPages(bitacorasData.totalPages);
        setClients(clientsData);
        setMonitoreos(monitoreosData);
        setUsers(usersData);
        setOrigenes(origenesData);
        setDestinos(destinosData);
        setOperadores(operadoresData);

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
  }, [user, roleData, currentPage, itemsPerPage]);

  const updateFormDataFromUser = () => {
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        operador: `${user.firstName} ${user.lastName}`,
        telefono: user.phone,
      }));
    }
  };

  const handleModalToggle = () => {
    setShowModal(!showModal);
  };

  const handlePDFToggle = (bitacora) => {
    setSelectedBitacora(bitacora);
    setShowPrintModal(!showPrintModal);

    const closedIds = getClosedTransportesFromEventos(bitacora);
    const allTransportesClosed =
      bitacora.transportes?.every((t) => closedIds.includes(t.id)) ?? false;

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
      const response = await fetch(`${baseUrl}/bitacora`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        credentials: "include",
        body: JSON.stringify(formData),
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
          const [
            bitacorasData,
            clientsData,
            monitoreosData,
            usersData,
            origenesData,
            destinosData,
            operadoresData,
          ] = await Promise.all([
            fetchBitacoras(currentPage, itemsPerPage, shouldReadAll ? "" : operadorFullName),
            fetchClients(),
            fetchMonitoreos(),
            fetchUsers(),
            fetchOrigenes(),
            fetchDestinos(),
            fetchOperadores(),
          ]);

          setBitacoras(bitacorasData.bitacoras);
          setTotalItems(bitacorasData.totalItems);
          setTotalPages(bitacorasData.totalPages);
          setClients(clientsData);
          setMonitoreos(monitoreosData);
          setUsers(usersData);
          setOrigenes(origenesData);
          setDestinos(destinosData);
          setOperadores(operadoresData);

          updateFormDataFromUser();
          setBitacoras(bitacorasData.bitacoras);
          setTotalItems(bitacorasData.totalItems);
          setTotalPages(bitacorasData.totalPages);
          setClients(clientsData);
          setMonitoreos(monitoreosData);
          setUsers(usersData);
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
        console.error("Failed to create bitácora:", response.statusText);
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

  const getFilteredBitacoras = () => {
    let filtered = bitacoras;

    if (idFilter) {
      filtered = filtered.filter((bitacora) => bitacora.bitacora_id.toString().includes(idFilter));
    }

    if (statusFilter) {
      filtered = filtered.filter((bitacora) => bitacora.status === statusFilter);
    }

    if (clienteFilter) {
      filtered = filtered.filter((bitacora) => bitacora.cliente === clienteFilter);
    }

    if (operadorFilter) {
      filtered = filtered.filter((bitacora) => bitacora.operador === operadorFilter);
    }

    if (monitoreoFilter) {
      filtered = filtered.filter((bitacora) => bitacora.monitoreo === monitoreoFilter);
    }

    if (creationDateFilter) {
      filtered = filtered.filter(
        (bitacora) =>
          new Date(bitacora.createdAt).toISOString().split("T")[0] === creationDateFilter
      );
    }

    return filtered;
  };

  const sortedFilteredBitacoras = sortBitacoras(getFilteredBitacoras(), sortField, sortOrder);

  const filteredBitacoras = bitacoras.filter((bitacora) => {
    return (
      (clienteFilter === "" || bitacora.cliente === clienteFilter) &&
      (operadorFilter === "" || bitacora.operador === operadorFilter)
    );
  });

  const clearFilters = () => {
    setStatusFilter("");
    setCreationDateFilter("");
    setSortField("ID");
    setSortOrder("desc");
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const operadorFullName = `${user.firstName} ${user.lastName}`;
    const shouldReadAll = roleData?.bitacoras?.read_all;

    fetchBitacoras(newPage, itemsPerPage, shouldReadAll ? "" : operadorFullName);
  };

  const handleItemsPerPageChange = (event) => {
    const newLimit = Number(event.target.value);
    const operadorFullName = `${user.firstName} ${user.lastName}`;
    const shouldReadAll = roleData?.bitacoras?.read_all;

    setItemsPerPage(newLimit);
    fetchBitacoras(currentPage, newLimit, shouldReadAll ? "" : operadorFullName); // Refetch with new limit
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
      if (transporteId === "") {
        root.render(<BitacoraDetail bitacora={bitacora} origenes={origenes} destinos={destinos} />);
      } else {
        root.render(
          <BitacoraDetail
            bitacora={bitacora}
            transporteId={selectedTransporte}
            origenes={origenes}
            destinos={destinos}
          />
        );
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

  const getClosedTransportesFromEventos = (bitacora) => {
    const closedIds = new Set();

    bitacora?.eventos?.forEach((evento) => {
      if (evento.nombre === "Cierre de servicio" && evento.transportes) {
        evento.transportes.forEach((t) => closedIds.add(t.id));
      }
    });

    return Array.from(closedIds);
  };

  const isAnyTransporteClosed = (bitacora) => {
    const closedIds = getClosedTransportesFromEventos(bitacora);
    return closedIds.length > 0;
  };

  const handleSortChange = (field) => {
    const order = field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);
    sortData(field, order);
  };

  const sortData = (field, order) => {
    filteredBitacoras.sort((a, b) => {
      if (a[field] < b[field]) {
        return order === "asc" ? -1 : 1;
      }
      if (a[field] > b[field]) {
        return order === "asc" ? 1 : -1;
      }
      return 0;
    });
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

  const openFrecuenciaModal = (bitacora) => {
    setSelectedFrecuenciaBitacora(bitacora);
    setShowFrecuenciaModal(true);
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
    if (!freq) return "#333235";
    const freqMs = freq * 60000;
    const elapsed = Date.now() - new Date(evt.createdAt).getTime();

    if (elapsed < freqMs * 0.75) return "#80ff7e"; // Verde
    if (elapsed < freqMs) return "#ffff8d"; // Amarillo
    return "#ffa0a0"; // Rojo
  };

  return (
    <section id="activeBits">
      <div className="w-100 d-flex h-100 mt-0">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <div className="page-header">
            <h1>Monitoreo - Bitácoras</h1>
            {roleData?.bitacoras?.create && (
              <button className="new-btn" onClick={() => setShowModal(!showModal)}>
                <i className="fa fa-plus"></i>
              </button>
            )}
          </div>

          {/* Table */}
          {roleData?.bitacoras?.read && (
            <div className="table-wrapper">
              <div className="table-container">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th
                          className="half"
                          onClick={() => handleSortChange("frecuencia")}
                          style={{cursor: "pointer"}}>
                          Frec {sortField === "frecuencia" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="one"
                          onClick={() => handleSortChange("bitacora_id")}
                          style={{cursor: "pointer"}}>
                          ID {sortField === "bitacora_id" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="two"
                          onClick={() => handleSortChange("cliente")}
                          style={{cursor: "pointer"}}>
                          Cliente {sortField === "cliente" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="two"
                          onClick={() => handleSortChange("monitoreo")}
                          style={{cursor: "pointer"}}>
                          Tipo Monitoreo{" "}
                          {sortField === "monitoreo" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="two"
                          onClick={() => handleSortChange("operador")}
                          style={{cursor: "pointer"}}>
                          Operador {sortField === "operador" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="two"
                          onClick={() => handleSortChange("createdAt")}
                          style={{cursor: "pointer"}}>
                          Fecha Creación{" "}
                          {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="one"
                          onClick={() => handleSortChange("status")}
                          style={{cursor: "pointer"}}>
                          Estatus <br /> Bitácora{" "}
                          {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="text-center two">
                          Estatus <br /> Documentación
                        </th>
                        <th className="text-center half relative">
                          <i className="fa fa-download"></i>
                        </th>
                        {/* <th className="text-center half">
                        <i className="fa fa-clipboard-check"></i>
                      </th> */}
                        {/* <th className="text-center half">
                        <i className="fa fa-eye"></i>
                      </th> */}
                      </tr>

                      {/* Filter Row */}
                      <tr>
                        <th className="half"></th>
                        <th className="one">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="# ID"
                            value={idFilter}
                            onChange={(e) => setIdFilter(e.target.value)}
                          />
                        </th>

                        <th className="two">
                          <select
                            id="clienteFilter"
                            className="form-select"
                            value={clienteFilter}
                            onChange={(e) => setClienteFilter(e.target.value)}>
                            <option value="">Todos</option>
                            {clients.map((client, id) => (
                              <option key={id} value={client.razon_social}>
                                {client.razon_social}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="two">
                          <select
                            id="clienteFilter"
                            className="form-select"
                            value={monitoreoFilter}
                            onChange={(e) => setMonitoreoFilter(e.target.value)}>
                            <option value="">Todos</option>
                            {monitoreos.map((monitreo, id) => (
                              <option key={id} value={monitreo.tipoMonitoreo}>
                                {monitreo.tipoMonitoreo}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="two">
                          <select
                            id="operadorFilter"
                            className="form-select"
                            value={operadorFilter}
                            onChange={(e) => setOperadorFilter(e.target.value)}>
                            <option value="">Todos</option>
                            {operadores.map((operador, id) => (
                              <option key={id} value={operador.name}>
                                {operador.name}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="two">
                          <div className="">
                            <input
                              id="creationDateFilter"
                              type="date"
                              className="form-control"
                              value={creationDateFilter}
                              onChange={(e) => setCreationDateFilter(e.target.value)}
                            />
                          </div>
                        </th>
                        <th className="one">
                          <div>
                            <select
                              id="statusFilter"
                              className="form-select"
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}>
                              <option value="">Todos</option>
                              <option value="nueva">Nueva</option>
                              <option value="validada">Validada</option>
                              <option value="iniciada">Iniciada</option>
                              <option value="cerrada">Cerrada</option>
                              <option value="finalizada">Finalizada</option>
                              <option value="cerrada (e)">Cerrada (e)</option>
                            </select>
                          </div>
                        </th>
                        <th className="two"></th>
                        <th className="half"></th>
                        {/* <th className="half"></th> */}
                        {/* <th className="half"></th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingBitacoras ? (
                        <div className="loading-placeholder text-center py-5 w-full h-full flex items-center justify-center">
                          <i className="fa fa-spinner fa-spin me-1" style={{fontSize: "24px"}}></i>{" "}
                          Cargando bitacoras...
                        </div>
                      ) : (
                        sortedFilteredBitacoras.map((bitacora) => (
                          <tr key={bitacora._id}>
                            <td className="half text-capitalize">
                              <div
                                className="semaforo"
                                onClick={() => openFrecuenciaModal(bitacora)}
                                style={{cursor: "pointer"}}>
                                {getEventColor(bitacora).map((color, index) => (
                                  <div
                                    key={index}
                                    className={`circle`}
                                    style={{
                                      backgroundColor: color,
                                    }}></div>
                                ))}
                              </div>
                            </td>
                            <td
                              className="one"
                              style={{
                                backgroundColor: getLatestFrecuenciaColor(bitacora),
                              }}>
                              <a
                                href={`/bitacora/${bitacora._id}`}
                                className="text-decoration-none d-block text-center text-dark">
                                {bitacora.bitacora_id}
                              </a>
                            </td>

                            <td className="two">{bitacora.cliente}</td>
                            <td className="two">{bitacora.monitoreo}</td>
                            <td className="two ">{bitacora.operador}</td>
                            <td className="two">
                              {new Date(bitacora.createdAt).toLocaleDateString()}
                            </td>
                            <td className="one text-capitalize">
                              {bitacora.status}
                              {bitacora.edited ? " (e)" : ""}
                            </td>
                            <td className="two">{getRecorrido(bitacora)}</td>
                            <td className="text-center half position-relative">
                              <button
                                className={
                                  isAnyTransporteClosed(bitacora)
                                    ? "btn btn-danger icon-btn"
                                    : "btn btn-secondary icon-btn"
                                }
                                onClick={() => handlePDFToggle(bitacora)}
                                disabled={!isAnyTransporteClosed(bitacora)}>
                                <i className="fa fa-file-pdf"></i>
                              </button>
                            </td>
                            {/* <td className="text-center half position-relative">
                            <button
                              className={
                                bitacora.edited === false
                                  ? "btn btn-secondary icon-btn"
                                  : "btn btn-warning icon-btn"
                              }
                              // onClick={() => generatePDF(bitacora.edited_bitacora)}
                              onClick={() => handlePDFToggle(bitacora)}
                              disabled={bitacora.edited == false}>
                              <i className="fa fa-file-pdf"></i>
                            </button>
                          </td> */}
                            {/* <td className="text-center half position-relative">
                            <button
                              className={
                                bitacora.edited == false
                                  ? "btn btn-secondary icon-btn"
                                  : "btn btn-primary icon-btn"
                              }
                              onClick={() => handleEditClick(bitacora._id)}
                              disabled={bitacora.edited == false}>
                              <i className="fa fa-eye"></i>
                            </button>
                          </td> */}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {roleData?.bitacoras?.read && (
            <div className="d-flex justify-content-between align-items-center mx-3 my-3 gap-4">
              <div className="d-flex align-items-center justify-content-start">
                <label htmlFor="itemsPerPage" className="form-label p-0 m-0 s-font fw-bold">
                  Items Por Página:
                </label>
                <select
                  id="itemsPerPage"
                  className="form-select itemsSelector s-font ms-2"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="m-font">{`${startItem}-${endItem} de ${totalItems}`}</span>
                </div>
              </div>

              <div className="d-flex align-items-center">
                <button
                  className="btn border-0"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}>
                  <i className="fa fa-chevron-left s-font"></i>
                </button>

                <div className="mx-0 s-font">
                  {Array.from({length: Math.min(3, totalPages)}).map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        className={`btn pageLink s-font ${
                          pageNum === currentPage ? "fw-bold fs-6" : "opacity-75"
                        }`}
                        onClick={() => handlePageChange(pageNum)}>
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 3 && (
                    <>
                      <span className="mx-1">...</span>
                      <button
                        className={`btn  pageLink s-font ${
                          totalPages === currentPage ? "fw-bold" : ""
                        }`}
                        onClick={() => handlePageChange(totalPages)}>
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  className="btn border-0"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}>
                  <i className="fa fa-chevron-right s-font"></i>
                </button>
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
            onSubmit={handlePDFSubmit}>
            {/* PDF Option Form */}
            <form onSubmit={handlePDFSubmit}>
              {/* Radio Buttons */}
              <div className="mb-3">
                {(() => {
                  const closedIds = getClosedTransportesFromEventos(selectedBitacora);
                  const allClosed =
                    selectedBitacora?.transportes?.every((t) => closedIds.includes(t.id)) ?? false;

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
                    {getClosedTransportesFromEventos(selectedBitacora).map((transporteId) => (
                      <option value={transporteId} key={transporteId}>
                        {transporteId.split("_")[1]} - {transporteId.split("_")[2]}
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
                Tipo de Monitoreo
              </label>
              <select
                className="form-select"
                id="monitoreo"
                value={formData.monitoreo}
                onChange={handleChange}
                required>
                <option value="">Selecciona una opción</option>
                {monitoreos.map((monitoreo) => (
                  <option key={monitoreo._id} value={monitoreo.tipoMonitoreo}>
                    {monitoreo.tipoMonitoreo}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente */}
            <div className="mb-3">
              <label htmlFor="cliente" className="form-label">
                Cliente
              </label>
              <select
                className="form-select"
                id="cliente"
                value={formData.cliente}
                onChange={handleChange}
                required>
                <option value="">Selecciona una opción</option>
                {clients.map((client) => (
                  <option key={client._id} value={client.razon_social}>
                    {client.razon_social}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="folio_servicio">Folio de Servicio</label>
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
                Origen
              </label>
              <select
                id="origen"
                className="form-select"
                value={formData.origen}
                onChange={handleChange}
                required>
                <option value="">Seleccionar</option>
                {origenes.map((origen) => (
                  <option key={origen._id} value={origen._id}>
                    {`${origen.nombre}, ${origen.municipio}, ${origen.estado}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Destino */}
            <div className="mb-3">
              <label htmlFor="destino" className="form-label">
                Destino
              </label>
              <select
                id="destino"
                className="form-select"
                value={formData.destino}
                onChange={handleChange}
                required>
                <option value="">Seleccionar</option>
                {destinos.map((destino) => (
                  <option key={destino._id} value={destino._id}>
                    {`${destino.nombre}, ${destino.municipio}, ${destino.estado}`}
                  </option>
                ))}
              </select>
            </div>
            {formData.monitoreo === "Custodia fisica" && (
              <>
                <div className="mb-3">
                  <label className="form-label">Nombre de Primer Custodio</label>
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
                  <label className="form-label">Teléfono Primer Custodio</label>
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
        <EventsPopup bitacora={selectedFrecuenciaBitacora} onClose={closeFrecuenciaModal} />
      )}
    </section>
  );
};

export default BitacorasPage;
