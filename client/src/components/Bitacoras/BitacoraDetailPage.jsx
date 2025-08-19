import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import Header from "../Header";
import Sidebar from "../Sidebar";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus} from "@fortawesome/free-solid-svg-icons";
import {useAuth} from "../../context/AuthContext";
import {Modal, Form, Button, Tabs, Tab, Row} from "react-bootstrap";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import CreateTransporteModal from "./Transportes/CreateTransporteModal";
import NewEventModal from "./Eventos/NewEventModal";
import {createAuditoria, generateAuditoriasFromChanges} from "../../utils/auditoria";
import {getLocationText} from "../../utils/api";
import {useMemo} from "react";
import ModalTemplate from "../../components/ModalTemplate"; // make sure path is valid
import {useSidebar} from "../../context/SidebarContext";

const BitacoraDetailPage = ({edited}) => {
  const {id} = useParams();
  const {user, verifyToken, setUser} = useAuth();
  const [bitacora, setBitacora] = useState(null);
  const [isEventStarted, setIsEventStarted] = useState(false);
  const [finishButtonDisabled, setFinishButtonDisabled] = useState(true);
  const [isEdited, setIsEdited] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [edited_bitacora, setEditedBitacora] = useState({});
  const [roleData, setRoleData] = useState(null);
  const [initialized, setInitialized] = useState(false); // Track initialization
  const [origenes, setOrigenes] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [clients, setClients] = useState([]);
  const [monitoreos, setMonitoreos] = useState([]);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("detalles");
  const [selectedTransporte, setSelectedTransporte] = useState(null);
  const [transportes, setTransportes] = useState(bitacora?.transportes || []);
  const [showModal, setShowModal] = useState(false);
  const [isEditTransporteModalVisible, setEditTransporteModalVisible] = useState(false);
  const [editedTransporte, setEditedTransporte] = useState(null);
  const [selectedTransportes, setSelectedTransportes] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [idMethod, setIdMethod] = useState("automatic");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedUnitName, setSelectedUnitName] = useState("");
  const [units, setUnits] = useState([]);
  const isEditable = useMemo(
    () => editedTransporte?.originalId?.startsWith("blank_"),
    [editedTransporte?.originalId]
  );
  const [modalOpen, setModalOpen] = useState(false);
  const {isSidebarCollapsed} = useSidebar();
  const [phoneError, setPhoneError] = useState("");

  const validatePhoneNumber = (phone) => {
    // Regex para validar número de teléfono mexicano de exactamente 10 dígitos seguidos
    // Solo acepta formato: 1234567890 (sin espacios, guiones o paréntesis)
    const phoneRegex = /^\d{10}$/;

    // Debe ser exactamente 10 dígitos seguidos
    return phoneRegex.test(phone);
  };

  const handleEditTransporte = () => {
    const selected = selectedTransporte;

    // Determine ID method based on the existing ID
    let initialIdMethod = "automatic";
    if (selected.id && !selected.id.startsWith("0_")) {
      initialIdMethod = "wialon";
    }

    setEditedTransporte({
      ...selected,
      originalId: selected.id,
    });
    setIdMethod(initialIdMethod); // <-- Set the method based on ID
    setEditTransporteModalVisible(true);
  };

  //TRANSPORTES LOGIC
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);
  const handleSelectTransporte = (transporte) => {
    setSelectedTransporte(transporte);
  };

  const handleTransportEdit = async (e) => {
    e.preventDefault();

    if (!editedTransporte) return;

    // Validar teléfono antes de enviar
    if (editedTransporte.telefono && !validatePhoneNumber(editedTransporte.telefono)) {
      setPhoneError("El número de teléfono debe tener exactamente 10 dígitos seguidos");
      return;
    }

    // Ensure ID is properly updated before saving
    let updatedId = editedTransporte.id;

    if (idMethod === "automatic") {
      updatedId = `0_${(transportes.length + 1).toString().padStart(2, "0")}_${
        editedTransporte?.tracto?.eco || "N/A"
      }`;
    } else if (idMethod === "wialon" && selectedUnitId && selectedUnitName) {
      updatedId = `${selectedUnitId}_${selectedUnitName}_${editedTransporte?.tracto?.eco || "N/A"}`;
    }

    const updatedEditedTransporte = {
      ...editedTransporte,
      id: updatedId,
    };

    const updatedTransportes = bitacora.transportes.map((transporte) =>
      transporte.id === editedTransporte.originalId ? updatedEditedTransporte : transporte
    );

    try {
      const response = await fetch(`${baseUrl}/bitacora/${bitacora._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({transportes: updatedTransportes}),
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar transporte: ${response.statusText}`);
      }

      const data = await response.json();
      setBitacora(data);
      setEditTransporteModalVisible(false);
      setSelectedTransporte(null);
      setEditedTransporte(null);
    } catch (error) {
      console.error("Error al guardar transporte editado:", error);
      alert("No se pudo guardar el transporte. Intenta nuevamente.");
    }
  };

  useEffect(() => {
    if (selectedTransporte) {
      const updatedTransporte = bitacora.transportes.find((t) => t.id === selectedTransporte.id);
      if (updatedTransporte) {
        setSelectedTransporte(updatedTransporte);
      }
    }
  }, [bitacora]); // Runs whenever bitacora updates

  const addTransporte = async (newTransporte, id) => {
    try {
      const response = await fetch(`${baseUrl}/bitacoras/${id}/transportes`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTransporte),
      });

      if (!response.ok) {
        throw new Error("Failed to add transporte");
      }

      const updatedBitacora = await response.json();

      // Assuming the updatedBitacora contains the updated transportes array
      setTransportes(updatedBitacora.transportes);
      fetchBitacora();
    } catch (error) {
      console.error("Error adding transporte:", error);
    }
  };

  //TABS
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  const [newEvent, setNewEvent] = useState({
    nombre: "",
    descripcion: "",
    ubicacion: "",
    duracion: "",
    ultimo_posicionamiento: "",
    velocidad: "",
    coordenadas: "",
    frecuencia: 0,
  });

  const [eventTypes, setEventTypes] = useState([]);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const fetchClients = async () => {
    try {
      const response = await fetch(`${baseUrl}/clients`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        console.error("Failed to fetch clients:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching clients:", e);
    }
  };

  const fetchMonitoreos = async () => {
    try {
      const response = await fetch(`${baseUrl}/monitoreos`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMonitoreos(data);
      } else {
        console.error("Failed to fetch monitoreos:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching monitoreos:", e);
    }
  };

  const fetchOrigenes = async () => {
    try {
      const response = await fetch(`${baseUrl}/origenes`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOrigenes(data);
      } else {
        console.error("Failed to fetch origenes:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching origenes:", e);
    }
  };

  const fetchDestinos = async () => {
    try {
      const response = await fetch(`${baseUrl}/destinos`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDestinos(data);
      } else {
        console.error("Failed to fetch destinos:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching destinos:", e);
    }
  };

  const fetchOperadores = async () => {
    try {
      const response = await fetch(`${baseUrl}/operadores`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOperadores(data);
        console.log(data);
      } else {
        console.error("Failed to fetch operadores:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching operadores:", e);
    }
  };

  const fetchBitacora = async () => {
    try {
      const response = await fetch(`${baseUrl}/bitacora/${id}`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();

        setBitacora(data);
        setEditedBitacora(data);
        setTransportes(data.transportes);
        setSelectedTransportes(data.transportes);

        setIsEventStarted(data.status === "iniciada");
        setFinishButtonDisabled(data.status === "finalizada" || data.status === "cerrada");
      } else {
        console.error("Failed to fetch bitácora:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching bitácora:", e);
    }
  };

  const fetchEventos = async () => {
    try {
      const response = await fetch(`${baseUrl}/bitacora/${id}`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();

        setBitacora(data);
        setEventos(data.eventos);
        setEditedBitacora(data);
        setTransportes(data.transportes);
        setSelectedTransportes(data.transportes);

        setIsEventStarted(data.status === "iniciada");
        setFinishButtonDisabled(data.status === "finalizada" || data.status === "cerrada");

        return data; // <-- ✅ Return updated bitacora
      } else {
        console.error("Failed to fetch bitácora:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching bitácora:", e);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken(); // Ensure user is verified
        setUser(data);
        setInitialized(true); // Set initialization as complete
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        navigate("/login");
      }
    };
    const fetchEventTypes = async () => {
      try {
        const response = await fetch(`${baseUrl}/event_types`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setEventTypes(data);
        } else {
          console.error("Failed to fetch event types:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching event types:", e);
      }
    };

    fetchClients();
    fetchOperadores();
    fetchOrigenes();
    fetchMonitoreos();
    fetchDestinos();
    fetchBitacora();
    fetchEventTypes();
    init();
  }, []);

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

    if (initialized) {
      fetchRolePermissions();
    }
  }, [initialized, user]);

  const handleStart = async () => {
    console.log(transportes);
    console.log(events);

    if (bitacora.status === "validada") {
      try {
        const response = await fetch(`${baseUrl}/bitacora/${id}/start`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inicioMonitoreo: new Date().toISOString(), // Set the start time
          }),
          credentials: "include",
        });
        if (response.ok) {
          const updatedBitacora = await response.json();
          setBitacora(updatedBitacora);
          setIsEventStarted(true);
          setFinishButtonDisabled(false);
        } else {
          console.error("Failed to start bitácora:", response.statusText);
        }
      } catch (e) {
        console.error("Error starting bitácora:", e);
      }
    }
    if (bitacora.status === "validada") {
      try {
        const response = await fetch(`${baseUrl}/bitacora/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "iniciada",
            inicioMonitoreo: new Date().toISOString(), // Set the start time
          }),
          credentials: "include",
        });
        if (response.ok) {
          const updatedBitacora = await response.json();
          setBitacora(updatedBitacora);
          setIsEventStarted(true);
          setFinishButtonDisabled(false);
        } else {
          console.error("Failed to start bitácora:", response.statusText);
        }
      } catch (e) {
        console.error("Error starting bitácora:", e);
      }
    }
  };

  const handleFinish = async (latestBitacora = bitacora) => {
    if (latestBitacora.status === "iniciada" && areAllTransportesClosed(latestBitacora)) {
      try {
        const response = await fetch(`${baseUrl}/bitacora/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "cerrada",
            inicioMonitoreo: new Date().toISOString(),
          }),
          credentials: "include",
        });

        if (response.ok) {
          const updatedBitacora = await response.json();
          setBitacora(updatedBitacora);
          setIsEventStarted(true);
          setFinishButtonDisabled(false);
        } else {
          console.error("Failed to close bitácora:", response.statusText);
        }
      } catch (e) {
        console.error("Error closing bitácora:", e);
      }

      fetchBitacora(); // Keep this to refresh the state
    }
  };

  useEffect(() => {
    fetchWialonUnits();
  }, []);

  const token = import.meta.env.VITE_WIALON_TOKEN;

  const fetchWialonUnits = (retryCount = 0) => {
    const sess = window.wialon.core.Session.getInstance();
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 3000;

    if (!token) return;

    if (!sess.getBaseUrl()) {
      sess.initSession("https://hst-api.wialon.com");
    }

    sess.loginToken(token, "", (code) => {
      if (code) {
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => fetchWialonUnits(retryCount + 1), RETRY_DELAY);
        }
        return;
      }

      const flags = window.wialon.item.Item.dataFlag.base;
      sess.updateDataFlags([{type: "type", data: "avl_unit", flags, mode: 0}], (code) => {
        if (code) return;
        const fetchedUnits = sess.getItems("avl_unit") || [];
        const unitList = fetchedUnits.map((unit) => ({
          id: unit.getId(),
          name: unit.getName(),
        }));
        setUnits(unitList);
        console.log(unitList);
      });
    });
  };

  const handleChange = (e) => {
    const {name, value} = e.target;
    setNewEvent((prev) => ({...prev, [name]: value}));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";

    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "short",
    };
    return date.toLocaleString("es-ES", options);
  };

  if (!bitacora) {
    return (
      <div className="loading-container text-center py-5">
        <i className="fa fa-spinner fa-spin text-primary me-2" style={{fontSize: "24px"}}></i>
        <span className="text-muted">Cargando bitácora...</span>
      </div>
    );
  }

  const EventCard = ({event}) => {
    const {_id, nombre, descripcion, createdAt, registrado_por, frecuencia, transportes} = event;
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
      nombre,
      registrado_por,
      descripcion,
      frecuencia,
      createdAt,
      transportes,
    });

    const [eventColor, setEventColor] = useState("#333235");

    useEffect(() => {
      const computeEventColor = () => {
        if (!frecuencia) return "#333235";

        if (!isLastEvent) {
          return event.isFrecuenciaMet ? "#51FF4E" : "#F82929";
        }

        const frecuenciaMs = frecuencia * 60000;
        const elapsed = Date.now() - new Date(createdAt).getTime();

        if (elapsed < frecuenciaMs * 0.75) return "#51FF4E";
        if (elapsed < frecuenciaMs) return "#ECEC27";
        return "#F82929";
      };

      setEventColor(computeEventColor());
      const interval = setInterval(() => {
        setEventColor(computeEventColor());
      }, 60000);

      return () => clearInterval(interval);
    }, [createdAt, frecuencia]);

    const isLastEvent = event._id === events[events.length - 1]?._id;

    const handleEditClick = () => setShowModal(true);
    const handleClose = () => setShowModal(false);
    const [showTransporteModal, setShowTransporteModal] = useState(false);
    const [selectedTransporte, setSelectedTransporte] = useState(null);

    const handleInputChange = (e) => {
      const {name, value} = e.target;
      setFormData({...formData, [name]: value});
    };

    const handleFormSubmit = async (e) => {
      e.preventDefault();

      const updatedEventos = bitacora.eventos.map((evt) =>
        evt._id === event._id
          ? {
              ...evt,
              descripcion: formData.descripcion,
              frecuencia: formData.frecuencia,
            }
          : evt
      );

      const oldEvent = bitacora.eventos.find((evt) => evt._id === event._id);
      const newEvent = updatedEventos.find((evt) => evt._id === event._id);

      const updatedBitacora = {...bitacora, eventos: updatedEventos};
      setBitacora(updatedBitacora);
      setEventos(updatedEventos);

      await handleEditSubmit(e, updatedBitacora);

      await generateAuditoriasFromChanges({
        oldData: oldEvent,
        newData: newEvent,
        bitacoraId: bitacora.bitacora_id,
        user,
        seccion: "Eventos",
      });

      setShowModal(false);
    };

    const handleShowTransporteModal = (transporte) => {
      setSelectedTransporte(transporte);
      setShowTransporteModal(true);
    };

    const handleCloseTransporteModal = () => {
      setShowTransporteModal(false);
      setSelectedTransporte(null);
    };

    const CollapsibleTransporte = ({transporte}) => {
      const [isOpen, setIsOpen] = useState(false);

      const toggleCollapse = () => {
        setIsOpen(!isOpen);
      };

      return (
        <div className="mb-3">
          <div
            className="d-flex justify-content-between align-items-center cursor-pointer border p-2 rounded modern-card"
            onClick={toggleCollapse}>
            <span className="fw-medium">
              {transporte.id.includes("_")
                ? `${transporte.id.split("_")[1]} - ${transporte.id.split("_")[2]}`
                : transporte.id}
            </span>
            <span className="text-primary fw-bold">{isOpen ? "−" : "+"}</span>
          </div>
          {isOpen && (
            <div className="mt-3 p-3 bg-light rounded">
              <div className="row">
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>Duración:</strong> {transporte.registro.duracion}
                  </p>
                  <p className="mb-2">
                    <strong>Ubicación:</strong> {transporte.registro.ubicacion}
                  </p>
                  <p className="mb-2">
                    <strong>Velocidad:</strong> {transporte.registro.velocidad}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>Último Posicionamiento:</strong>{" "}
                    {transporte.registro.ultimo_posicionamiento}
                  </p>
                  <p className="mb-2">
                    <strong>Coordenadas:</strong> {transporte.registro.coordenadas}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="modern-card mb-4">
        <div className="card-header-modern d-flex justify-content-between align-items-center pt-3 px-4">
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">
              {new Date(createdAt).toLocaleString("es-MX", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
            <h5 className="card-title fw-semibold mb-0">{nombre}</h5>
          </div>

          {roleData?.bit_eventos?.update && (
            <button
              onClick={handleEditClick}
              className="action-btn btn-primary"
              disabled={
                !(
                  (roleData && roleData.bit_eventos.update && bitacora.status !== "cerrada") ||
                  (roleData && roleData.bit_eventos.update && bitacora.status === "cerrada")
                )
              }>
              <i className="fa fa-edit"></i>
            </button>
          )}
          {!roleData?.bit_eventos?.update && <div></div>}
        </div>

        <div className="card-body-modern px-4 pb-4">
          <div className="row">
            <div className="col-md-6">
              <div className="info-group mb-3">
                <label className="info-label">Registrado por:</label>
                <span className="info-value">{registrado_por}</span>
              </div>
              <div className="info-group mb-3">
                <label className="info-label">Descripción:</label>
                <span className="info-value">{descripcion}</span>
              </div>
              <div className="info-group mb-3">
                <label className="info-label">Frecuencia:</label>
                <div className="d-flex align-items-center gap-2">
                  <span className="info-value">{`${frecuencia} min`}</span>
                  <div className="semaforo-container">
                    <div className="semaforo-circle" style={{backgroundColor: eventColor}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <h6 className="fw-bold text-center mb-3">Transportes</h6>
              {event.transportes.map((t, i) => (
                <div key={i}>
                  <CollapsibleTransporte transporte={t} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <ModalTemplate
          show={showTransporteModal}
          title="Transporte Information"
          onClose={handleCloseTransporteModal}>
          {selectedTransporte && (
            <div className="row mt-3">
              <div className="col-md-6">
                <h5>Tracto:</h5>
                {["eco", "placa", "marca", "modelo", "color", "tipo"].map((field) => (
                  <p key={field}>
                    <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>{" "}
                    {selectedTransporte.tracto[field]}
                  </p>
                ))}
              </div>
              <div className="col-md-6">
                <h5>Remolque:</h5>
                {["eco", "placa", "color", "capacidad", "sello"].map((field) => (
                  <p key={field}>
                    <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>{" "}
                    {selectedTransporte.remolque[field]}
                  </p>
                ))}
              </div>
            </div>
          )}
        </ModalTemplate>

        {/* Edit Modal */}
        <ModalTemplate
          show={showModal}
          title="Editar Evento"
          onClose={handleClose}
          onSubmit={handleFormSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control type="text" name="nombre" value={formData.nombre} disabled />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Registrado Por</Form.Label>
            <Form.Control
              type="text"
              name="registrado_por"
              value={formData.registrado_por}
              disabled
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Transportes</Form.Label>
            <Form.Control
              type="text"
              name="transportes"
              value={formData.transportes
                .map((t) =>
                  t.id.includes("_") ? `${t.id.split("_")[1]} - ${t.id.split("_")[2]}` : t.id
                )
                .join(", ")}
              disabled
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Frecuencia</Form.Label>
            <Form.Control
              type="number"
              name="frecuencia"
              value={formData.frecuencia}
              onChange={handleInputChange}
            />
          </Form.Group>
        </ModalTemplate>
      </div>
    );
  };

  const events = Array.isArray(bitacora.eventos) ? bitacora.eventos : [];

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Helper function to get the correct value for origen/destino dropdown
  const getLocationValue = (location, locationList) => {
    if (!location || !locationList || locationList.length === 0) {
      return "";
    }

    // If location is already an object with _id, stringify it
    if (typeof location === "object" && location._id) {
      // Ensure the location exists in the filtered list (same client)
      const existsInList = locationList.find((item) => item._id === location._id);
      if (existsInList) {
        return JSON.stringify(location);
      }
    }

    // If location is a string (ID), find the full object
    if (typeof location === "string") {
      const foundLocation = locationList.find((item) => item._id === location);
      if (foundLocation) {
        return JSON.stringify(foundLocation);
      }
    }

    return "";
  };

  const handleEditChange = (e) => {
    const {name, value, type} = e.target;

    setBitacora((prev) => {
      let updates = {};

      if (type === "select-one") {
        updates[name] = value;

        // If client changes, clear origen and destino to avoid invalid selections
        if (name === "cliente") {
          updates.origen = null;
          updates.destino = null;
        }
      } else {
        const [mainKey, subKey] = name.split(".");

        if (subKey) {
          updates[mainKey] = {
            ...prev[mainKey], // Asegurar que mainKey no sea undefined
            [subKey]: value,
          };
        } else {
          updates[name] = value;
        }
      }

      return {...prev, ...updates};
    });
  };

  const isTransporteUsedInEventos = (transporteId) => {
    return bitacora.eventos.some((evento) => evento.transportes.some((t) => t.id === transporteId));
  };

  const isTransporteInEvento = isTransporteUsedInEventos(editedTransporte?.originalId);

  const areAllTransportesClosed = (bitacoraToCheck = bitacora) => {
    if (!bitacoraToCheck || !bitacoraToCheck.transportes || !bitacoraToCheck.eventos) return false;

    const cierreEventos = bitacoraToCheck.eventos.filter(
      (e) =>
        e.nombre === "Cierre de servicio" ||
        e.nombre === "CIERRE DE SERVICIO" ||
        e.nombre === "cierre de servicio"
    );
    const transportesInCierre = new Set(
      cierreEventos.flatMap((e) => e.transportes.map((t) => t.id))
    );

    return bitacoraToCheck.transportes.every((t) => transportesInCierre.has(t.id));
  };

  const handleEditSubmit = async (e, updatedBitacora) => {
    e.preventDefault();
    console.log("Submitting changes...");

    const submitBitacora = updatedBitacora ? updatedBitacora : bitacora;
    console.log(submitBitacora);
    try {
      const minimalUpdate = {
        folio_servicio: submitBitacora.folio_servicio,
        cliente: submitBitacora.cliente,
        monitoreo: submitBitacora.monitoreo,
        origen: submitBitacora.origen,
        destino: submitBitacora.destino,
      };

      const response = await fetch(`${baseUrl}/bitacora/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(minimalUpdate),

        credentials: "include",
      });

      if (response.ok) {
        const responseData = await response.json();
        setBitacora(responseData);

        // Generar auditorías por cambio individual
        await generateAuditoriasFromChanges({
          oldData: edited_bitacora,
          newData: submitBitacora,
          bitacoraId: bitacora.bitacora_id,
          user,
          seccion: "Bitácora",
        });

        setIsEdited(true);
        setEditModalVisible(false);
      } else {
        console.error("Failed to edit bitácora:", response.statusText);
      }
    } catch (e) {
      console.error("Error editing bitácora:", e);
    }

    try {
      const response = await fetch(`${baseUrl}/bitacora/${id}/edited`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({edited: true}),
        credentials: "include",
      });

      if (response.ok) {
        const updatedBitacora = await response.json();
        setBitacora(updatedBitacora);
        setIsEventStarted(true);
        setFinishButtonDisabled(false);
      } else {
        console.error("Failed to start bitácora:", response.statusText);
      }
    } catch (e) {
      console.error("Error starting bitácora:", e);
    }
  };

  const getEventColor = (bitacora) => {
    if (bitacora.status != "iniciada" && bitacora.status != "validada") {
      return ["#333235"]; // No events
    }

    const latestEvent = bitacora.eventos.reduce((latest, current) =>
      new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current
    );

    const frecuencia = latestEvent.frecuencia;
    if (!frecuencia) return ["#333235"]; // No frecuencia

    const frecuenciaMs = frecuencia * 60000; // Convert minutes to milliseconds
    const eventTimeMs = new Date(latestEvent.createdAt).getTime();
    const currentTimeMs = new Date().getTime();
    const elapsedTimeMs = currentTimeMs - eventTimeMs;

    const greenColor = "#51FF4E"; // Green
    const yellowColor = "#ECEC27"; // Yellow
    const redColor = "#F82929"; // Red

    // Determine the color
    if (elapsedTimeMs < frecuenciaMs) {
      const threshold = frecuenciaMs * 0.75; // 75% of the frecuencia
      if (elapsedTimeMs < threshold) {
        return [greenColor]; // Green
      } else {
        return [yellowColor]; // Yellow
      }
    } else {
      return [redColor]; // Red
    }
  };

  const handleCheckboxChange = (e) => {
    const {value, checked} = e.target;
    const transporteId = value;
    const transporteToAdd = bitacora.transportes.find(
      (transporte) => String(transporte.id) === transporteId
    );

    if (value === "all") {
      // Handle "All" selection
      if (checked) {
        setSelectedTransportes(bitacora.transportes);
      } else {
        setSelectedTransportes([]);
      }
    } else {
      // Handle individual selections
      if (checked) {
        setSelectedTransportes((prev) => [...prev, transporteToAdd]);
      } else {
        setSelectedTransportes((prev) =>
          prev.filter((transporte) => transporte.id !== transporteToAdd.id)
        );
      }
    }
  };

  return (
    <section id="bitacoraDetail">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header-modern">
            <div className="back-button" onClick={() => navigate("/bitacoras")}>
              <i className="fa fa-chevron-left"></i>
              <span>Volver</span>
            </div>

            {/* Modern Tab Navigation */}
            <div className="modern-tabs">
              {roleData?.bit_detalles.read && (
                <button
                  className={`tab-button ${activeTab === "detalles" ? "active" : ""}`}
                  onClick={() => handleTabClick("detalles")}>
                  <span className="tab-title">Detalles</span>
                  <span className="tab-subtitle">ID: {bitacora.bitacora_id}</span>
                </button>
              )}

              {roleData?.bit_transportes.read && (
                <button
                  className={`tab-button ${activeTab === "transportes" ? "active" : ""}`}
                  onClick={() => handleTabClick("transportes")}>
                  <span className="tab-title">Transportes</span>
                  <span className="tab-subtitle">Total: {bitacora.transportes.length}</span>
                </button>
              )}

              {roleData?.bit_eventos.read && (
                <button
                  className={`tab-button ${activeTab === "eventos" ? "active" : ""}`}
                  onClick={() => handleTabClick("eventos")}>
                  <span className="tab-title">Eventos</span>
                  <span className="tab-subtitle">Total: {bitacora.eventos.length}</span>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            {activeTab === "detalles" && roleData?.bit_detalles?.update && (
              <button className="action-btn btn-primary" onClick={() => setEditModalVisible(true)}>
                <i className="fa fa-edit"></i>
              </button>
            )}
            {activeTab === "transportes" && roleData?.bit_transportes?.create && (
              <button className="action-btn btn-primary" onClick={handleShow}>
                <i className="fa fa-plus"></i>
              </button>
            )}
            {activeTab === "eventos" && roleData?.bit_eventos?.create && (
              <button
                className="action-btn btn-primary"
                disabled={areAllTransportesClosed()}
                onClick={() => setModalOpen(true)}>
                <FontAwesomeIcon icon={faPlus} />
              </button>
            )}
          </div>

          <div className="content-area">
            <div className="tab-content-modern">
              {/* Detalles Tab Content */}
              {roleData?.bit_detalles.read && (
                <div className={`tab-pane-modern ${activeTab === "detalles" ? "active" : ""}`}>
                  <div className="modern-card">
                    <div className="card-header-modern">
                      <h5 className="fw-bold mb-0">Información General</h5>
                    </div>
                    <div className="card-body-modern">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="info-group mb-3">
                            <label className="info-label">Folio Servicio:</label>
                            <span className="info-value">{bitacora.folio_servicio}</span>
                          </div>
                          <div className="info-group mb-3">
                            <label className="info-label">No. Bitácora:</label>
                            <span className="info-value">{bitacora.bitacora_id}</span>
                          </div>
                          <div className="info-group mb-3">
                            <label className="info-label">Cliente:</label>
                            <span className="info-value">{bitacora.cliente}</span>
                          </div>
                          <div className="info-group mb-3">
                            <label className="info-label">Estatus:</label>
                            <span className={`status-badge status-${bitacora.status}`}>
                              {capitalizeFirstLetter(bitacora.status)}
                            </span>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="info-group mb-3">
                            <label className="info-label">Tipo Monitoreo:</label>
                            <span className="info-value">{bitacora.monitoreo}</span>
                          </div>
                          <div className="info-group mb-3">
                            <label className="info-label">Origen:</label>
                            <span className="info-value">
                              {getLocationText(bitacora.origen, origenes)}
                            </span>
                          </div>
                          <div className="info-group mb-3">
                            <label className="info-label">Destino:</label>
                            <span className="info-value">
                              {getLocationText(bitacora.destino, destinos)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {bitacora.custodia && (
                        <div className="custodia-section">
                          <h6 className="fw-bold mb-3">Información Custodia Física</h6>
                          <div className="row">
                            <div className="col-md-6">
                              <div className="info-group mb-2">
                                <label className="info-label">Nombre Custodio 1:</label>
                                <span className="info-value">
                                  {bitacora.custodia.custodio1_nombre || "--"}
                                </span>
                              </div>
                              <div className="info-group mb-2">
                                <label className="info-label">Teléfono Custodio 1:</label>
                                <span className="info-value">
                                  {bitacora.custodia.custodio1_telefono || "--"}
                                </span>
                              </div>
                              <div className="info-group mb-2">
                                <label className="info-label">Nombre Custodio 2:</label>
                                <span className="info-value">
                                  {bitacora.custodia.custodio2_nombre || "--"}
                                </span>
                              </div>
                              <div className="info-group mb-2">
                                <label className="info-label">Teléfono Custodio 2:</label>
                                <span className="info-value">
                                  {bitacora.custodia.custodio2_telefono || "--"}
                                </span>
                              </div>
                            </div>

                            <div className="col-md-6">
                              <div className="info-group mb-2">
                                <label className="info-label">Placa:</label>
                                <span className="info-value">
                                  {bitacora.custodia.placa || "--"}
                                </span>
                              </div>
                              <div className="info-group mb-2">
                                <label className="info-label">Modelo:</label>
                                <span className="info-value">
                                  {bitacora.custodia.modelo || "--"}
                                </span>
                              </div>
                              <div className="info-group mb-2">
                                <label className="info-label">Color:</label>
                                <span className="info-value">
                                  {bitacora.custodia.color || "--"}
                                </span>
                              </div>
                              <div className="info-group mb-2">
                                <label className="info-label">Marca:</label>
                                <span className="info-value">
                                  {bitacora.custodia.marca || "--"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="monitoreo-section">
                        <h6 className="fw-bold mb-3">Información de Monitoreo</h6>
                        {bitacora.transportes.map((t) => {
                          const validacionEvento = bitacora.eventos.find(
                            (evento) =>
                              evento.nombre.toLowerCase() === "validación" &&
                              evento.transportes.some((tr) => tr.id === t.id)
                          );
                          const inicioMonitoreo = validacionEvento
                            ? validacionEvento.transportes.find((tr) => tr.id === t.id)
                                ?.inicioMonitoreo
                            : null;

                          const cierreEvento = bitacora.eventos.find(
                            (evento) =>
                              evento.nombre.toLowerCase() === "cierre de servicio" &&
                              evento.transportes.some((tr) => tr.id === t.id)
                          );
                          const finalMonitoreo = cierreEvento
                            ? cierreEvento.transportes.find((tr) => tr.id === t.id)?.finalMonitoreo
                            : null;

                          return (
                            <div
                              key={t.id}
                              className="transporte-monitoreo mb-3 p-3 bg-light rounded">
                              <h6 className="fw-semibold mb-2">
                                GPS ID:{" "}
                                {t.id.includes("_")
                                  ? `${t.id.split("_")[1]} - ${t.id.split("_")[2]}`
                                  : t.id}
                              </h6>
                              <div className="row">
                                <div className="col-md-6">
                                  <div className="info-group mb-2">
                                    <label className="info-label">Inicio Monitoreo:</label>
                                    <span className="info-value">
                                      {inicioMonitoreo ? formatDate(inicioMonitoreo) : "--"}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="info-group mb-2">
                                    <label className="info-label">Final Monitoreo:</label>
                                    <span className="info-value">
                                      {finalMonitoreo ? formatDate(finalMonitoreo) : "--"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transportes Tab Content */}
              {roleData?.bit_transportes.read && (
                <div className={`tab-pane-modern ${activeTab === "transportes" ? "active" : ""}`}>
                  <div className="modern-card">
                    <div className="card-header-modern">
                      <h5 className="fw-bold mb-0">Gestión de Transportes</h5>
                    </div>
                    <div className="card-body-modern">
                      <div className="row">
                        <div className="col-md-4 border-end pe-4">
                          <h6 className="fw-semibold mb-3">Lista de Transportes</h6>
                          {roleData?.gps_id?.read && (
                            <div className="transporte-list">
                              {bitacora.transportes.map((transporte) => {
                                const transporteId = transporte.id.includes("_")
                                  ? `${transporte.id.split("_")[1]} - ${
                                      transporte.id.split("_")[2]
                                    }`
                                  : transporte.id;

                                return (
                                  <div
                                    key={transporte.id}
                                    className={`transporte-item ${
                                      selectedTransporte?.id === transporte.id ? "active" : ""
                                    }`}
                                    onClick={() => handleSelectTransporte(transporte)}>
                                    <span className="transporte-id">GPS ID: {transporteId}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="col-md-8 ps-4">
                          {selectedTransporte ? (
                            <div className="transporte-details">
                              <div className="d-flex justify-content-end mb-3">
                                {roleData.bit_transportes.update && (
                                  <button
                                    className="action-btn btn-primary"
                                    onClick={handleEditTransporte}>
                                    <i className="fa fa-edit"></i>
                                  </button>
                                )}
                              </div>

                              <div className="row">
                                {roleData?.tracto?.read && (
                                  <div className="col-md-6">
                                    <div className="detail-section">
                                      <h6 className="fw-semibold mb-3">Tracto</h6>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Eco:</label>
                                        <span className="info-value">
                                          {selectedTransporte.tracto.eco}
                                        </span>
                                      </div>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Placa:</label>
                                        <span className="info-value">
                                          {selectedTransporte.tracto.placa}
                                        </span>
                                      </div>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Marca:</label>
                                        <span className="info-value">
                                          {selectedTransporte.tracto.marca}
                                        </span>
                                      </div>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Modelo:</label>
                                        <span className="info-value">
                                          {selectedTransporte.tracto.modelo}
                                        </span>
                                      </div>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Color:</label>
                                        <span className="info-value">
                                          {selectedTransporte.tracto.color}
                                        </span>
                                      </div>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Tipo:</label>
                                        <span className="info-value">
                                          {selectedTransporte.tracto.tipo}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {roleData?.remolque?.read && (
                                  <div className="col-md-6">
                                    <div className="detail-section">
                                      <h6 className="fw-semibold mb-3">Remolque</h6>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Eco:</label>
                                        <span className="info-value">
                                          {selectedTransporte.remolque.eco}
                                        </span>
                                      </div>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Placa:</label>
                                        <span className="info-value">
                                          {selectedTransporte.remolque.placa}
                                        </span>
                                      </div>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Color:</label>
                                        <span className="info-value">
                                          {selectedTransporte.remolque.color}
                                        </span>
                                      </div>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Capacidad:</label>
                                        <span className="info-value">
                                          {selectedTransporte.remolque.capacidad}
                                        </span>
                                      </div>
                                      <div className="info-group mb-2">
                                        <label className="info-label">Sello:</label>
                                        <span className="info-value">
                                          {selectedTransporte.remolque.sello}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {roleData?.operador?.read && (
                                <div className="operador-section mt-4">
                                  <h6 className="fw-semibold mb-3">Información del Operador</h6>
                                  <div className="row">
                                    <div className="col-md-4">
                                      <div className="info-group mb-2">
                                        <label className="info-label">Línea Transporte:</label>
                                        <span className="info-value">
                                          {selectedTransporte.lineaTransporte}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-md-4">
                                      <div className="info-group mb-2">
                                        <label className="info-label">Operador:</label>
                                        <span className="info-value">
                                          {selectedTransporte.operador}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-md-4">
                                      <div className="info-group mb-2">
                                        <label className="info-label">Teléfono:</label>
                                        <span className="info-value">
                                          {selectedTransporte.telefono}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="empty-state">
                              <i
                                className="fa fa-truck text-muted mb-3"
                                style={{fontSize: "3rem"}}></i>
                              <p className="text-muted">
                                Seleccione un transporte de la lista para ver los detalles.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Eventos Tab Content */}
              {roleData?.bit_eventos.read && (
                <div className={`tab-pane-modern ${activeTab === "eventos" ? "active" : ""}`}>
                  <div className="eventos-container">
                    {eventos
                      .slice()
                      .reverse()
                      .map((event, index) => (
                        <EventCard key={index} event={event} eventos={eventos} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NewEventModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        edited={edited}
        eventTypes={eventTypes}
        onEventAdded={async () => {
          const latest = await fetchEventos(); // Modify fetchEventos to return data
          await handleFinish(latest); // Pass it into handleFinish
          setModalOpen(false);
        }}
      />

      {editModalVisible &&
        bitacora &&
        clients.length > 0 &&
        monitoreos.length > 0 &&
        origenes.length > 0 &&
        destinos.length > 0 && (
          <ModalTemplate
            show={editModalVisible}
            title="Editar Bitácora"
            onClose={() => setEditModalVisible(false)}
            onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="folio_servicio">Folio de servicio</Form.Label>
              <Form.Control
                type="text"
                id="folio_servicio"
                name="folio_servicio"
                value={bitacora.folio_servicio}
                onChange={handleEditChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="bitacora_id">No. Bitácora</Form.Label>
              <Form.Control
                type="text"
                id="bitacora_id"
                name="bitacora_id"
                value={bitacora.bitacora_id}
                onChange={handleEditChange}
                disabled
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Cliente</Form.Label>
              <Form.Select
                name="cliente"
                value={bitacora.cliente || ""}
                onChange={handleEditChange}
                required>
                <option value="">Selecciona una opción</option>
                {clients.map((cliente) => (
                  <option key={cliente._id} value={cliente.razon_social}>
                    {cliente.razon_social}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tipo de Monitoreo</Form.Label>
              <Form.Select
                name="monitoreo"
                value={bitacora.monitoreo || ""}
                onChange={handleEditChange}
                required>
                <option value="">Selecciona una opción</option>
                {monitoreos.map((monitoreo) => (
                  <option key={monitoreo._id} value={monitoreo.tipoMonitoreo}>
                    {monitoreo.tipoMonitoreo}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Origen</Form.Label>
              <Form.Select
                name="origen"
                value={getLocationValue(
                  bitacora.origen,
                  origenes.filter((origen) => origen.cliente === bitacora?.cliente)
                )}
                onChange={(e) =>
                  setBitacora((prev) => ({
                    ...prev,
                    origen: e.target.value ? JSON.parse(e.target.value) : null,
                  }))
                }
                required>
                <option value="">Selecciona una opción</option>
                {origenes
                  .filter((origen) => origen.cliente === bitacora?.cliente)
                  .map((origen) => (
                    <option key={origen._id} value={JSON.stringify(origen)}>
                      {`${origen.nombre}, ${origen.estado}`}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Destino</Form.Label>
              <Form.Select
                name="destino"
                value={getLocationValue(
                  bitacora.destino,
                  destinos.filter((destino) => destino.cliente === bitacora?.cliente)
                )}
                onChange={(e) =>
                  setBitacora((prev) => ({
                    ...prev,
                    destino: e.target.value ? JSON.parse(e.target.value) : null,
                  }))
                }
                required>
                <option value="">Selecciona una opción</option>
                {destinos
                  .filter((destino) => destino.cliente === bitacora?.cliente)
                  .map((destino) => (
                    <option key={destino._id} value={JSON.stringify(destino)}>
                      {`${destino.nombre}, ${destino.estado}`}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </ModalTemplate>
        )}

      {/* EDIT TRANSPORTES */}
      {isEditTransporteModalVisible && editedTransporte && (
        <ModalTemplate
          show={isEditTransporteModalVisible}
          title="Editar Transporte"
          onClose={() => setEditTransporteModalVisible(false)}
          onSubmit={handleTransportEdit}>
          <Tabs defaultActiveKey="tracto" className="mb-3">
            {/* GPS ID Tab */}
            {roleData?.gps_id?.update && (
              <Tab eventKey="gps" title="GPS ID">
                {isTransporteInEvento ? (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>ID actual</Form.Label>
                      <Form.Control type="text" value={editedTransporte.id} disabled />
                      <Form.Text className="text-muted">
                        Este transporte ya está vinculado a un evento, por lo tanto no puede cambiar
                        su ID.
                      </Form.Text>
                    </Form.Group>
                  </>
                ) : (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Método de ID</Form.Label>
                      <div>
                        <Form.Check
                          type="radio"
                          label="Automático"
                          name="idMethod"
                          value="automatic"
                          checked={idMethod === "automatic"}
                          onChange={() => setIdMethod("automatic")}
                        />
                        <Form.Check
                          type="radio"
                          label="GPS ID"
                          name="idMethod"
                          value="wialon"
                          checked={idMethod === "wialon"}
                          onChange={() => setIdMethod("wialon")}
                        />
                      </div>
                    </Form.Group>
                    {idMethod === "wialon" && (
                      <Form.Group className="mb-3">
                        <Form.Label>Seleccionar unidad Wialon</Form.Label>
                        <Form.Select
                          value={selectedUnitId}
                          onChange={(e) => {
                            const unitId = e.target.value;
                            const selected = units?.find((u) => u.id.toString() === unitId);
                            if (selected) {
                              setSelectedUnitId(selected.id);
                              setSelectedUnitName(selected.name);

                              // Update ID preview (if eco exists)
                              if (editedTransporte?.tracto?.eco) {
                                const newId = `${selected.id}_${selected.name}_${editedTransporte.tracto.eco}`;
                                setEditedTransporte((prev) => ({...prev, id: newId}));
                              }
                            }
                          }}>
                          <option value="">Seleccione una unidad</option>
                          {units?.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    )}

                    {idMethod === "automatic" && (
                      <Form.Group className="mb-3">
                        <Form.Label>ID generado</Form.Label>
                        <Form.Control
                          type="text"
                          value={`0_${(transportes.length + 1).toString().padStart(2, "0")}_${
                            editedTransporte?.tracto?.eco || "N/A"
                          }`}
                          disabled
                        />
                      </Form.Group>
                    )}
                  </>
                )}
              </Tab>
            )}

            {/* Tracto Tab */}
            {roleData?.tracto?.update && (
              <Tab eventKey="tracto" title="TRACTO">
                {["eco", "placa", "marca", "modelo", "color", "tipo"].map((field) => (
                  <Form.Group className="mb-3" key={field}>
                    <Form.Label>{field.toUpperCase()}</Form.Label>
                    <Form.Control
                      type="text"
                      value={editedTransporte.tracto[field] || ""}
                      disabled={isTransporteInEvento && field === "eco"}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (isTransporteInEvento && field === "eco") return; // prevent change

                        setEditedTransporte((prev) => {
                          const updatedTracto = {
                            ...prev.tracto,
                            [field]: value,
                          };

                          // Only regenerate ID if editing 'eco' and in 'automatic' mode and editable
                          if (
                            field === "eco" &&
                            idMethod === "automatic" &&
                            (prev.originalId?.startsWith("blank_") || prev.id?.startsWith("0_"))
                          ) {
                            const updatedId = `0_${(transportes.length + 1)
                              .toString()
                              .padStart(2, "0")}_${value || "N/A"}`;
                            return {
                              ...prev,
                              id: updatedId,
                              tracto: updatedTracto,
                            };
                          }

                          return {
                            ...prev,
                            tracto: updatedTracto,
                          };
                        });
                      }}
                    />
                  </Form.Group>
                ))}
              </Tab>
            )}

            {/* Remolque Tab */}
            {roleData?.remolque?.update && (
              <Tab eventKey="remolque" title="REMOLQUE">
                {["eco", "placa", "color", "capacidad", "sello"].map((field) => (
                  <Form.Group className="mb-3" key={field}>
                    <Form.Label>{field.toUpperCase()}</Form.Label>
                    <Form.Control
                      type="text"
                      value={editedTransporte.remolque[field] || ""}
                      onChange={(e) =>
                        setEditedTransporte((prev) => ({
                          ...prev,
                          remolque: {...prev.remolque, [field]: e.target.value},
                        }))
                      }
                    />
                  </Form.Group>
                ))}
              </Tab>
            )}

            {/* Operador Tab */}
            {roleData?.operador?.update && (
              <Tab eventKey="operador" title="OPERADOR">
                <Form.Group className="mb-3">
                  <Form.Label>Línea de Transporte</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedTransporte.lineaTransporte || ""}
                    onChange={(e) =>
                      setEditedTransporte((prev) => ({...prev, lineaTransporte: e.target.value}))
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Operador</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedTransporte.operador || ""}
                    onChange={(e) =>
                      setEditedTransporte((prev) => ({...prev, operador: e.target.value}))
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedTransporte.telefono || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Validar teléfono en tiempo real
                      if (value && !validatePhoneNumber(value)) {
                        setPhoneError(
                          "El número de teléfono debe tener exactamente 10 dígitos seguidos (ej: 1234567890)"
                        );
                      } else {
                        setPhoneError("");
                      }
                      setEditedTransporte((prev) => ({...prev, telefono: value}));
                    }}
                    isInvalid={!!phoneError}
                  />
                  {phoneError && (
                    <Form.Control.Feedback type="invalid">{phoneError}</Form.Control.Feedback>
                  )}
                  <Form.Text className="text-muted">Formato: 1234567890</Form.Text>
                </Form.Group>
              </Tab>
            )}
          </Tabs>
        </ModalTemplate>
      )}

      {/* CREATE TRASNPORTES */}
      <CreateTransporteModal
        show={showModal}
        handleClose={handleClose}
        addTransporte={addTransporte}
        transportes={transportes}
        bitacora={bitacora}
        units={units}
      />
    </section>
  );
};

export default BitacoraDetailPage;
