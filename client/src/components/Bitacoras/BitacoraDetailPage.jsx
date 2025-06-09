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

  const handleEditTransporte = () => {
    setEditedTransporte({
      ...selectedTransporte,
      originalId: selectedTransporte.id, // <-- esto previene que se pierda el tab de GPS ID
    });
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

    const updatedTransportes = bitacora.transportes.map((transporte) =>
      transporte.id === editedTransporte.originalId ? editedTransporte : transporte
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
      <div className="loading-placeholder text-center py-5 w-full h-full flex items-center justify-center">
        <i className="fa fa-spinner fa-spin me-1" style={{fontSize: "24px"}}></i> Cargando
        bitacora...
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
      // const computeEventColor = () => {
      //   if (!frecuencia) return "#333235";

      //   const frecuenciaMs = frecuencia * 60000; // minutos a ms
      //   const elapsed = Date.now() - new Date(createdAt).getTime();

      //   if (elapsed < frecuenciaMs * 0.75) return "#51FF4E"; // verde
      //   if (elapsed < frecuenciaMs) return "#ECEC27"; // amarillo
      //   return "#F82929"; // rojo
      // };

      const computeEventColor = () => {
        if (!frecuencia) return "#333235";

        if (!isLastEvent) {
          // use the persisted boolean
          return event.isFrecuenciaMet ? "#51FF4E" : "#F82929";
        }

        // last event: dynamic countdown
        const frecuenciaMs = frecuencia * 60000;
        const elapsed = Date.now() - new Date(createdAt).getTime();

        if (elapsed < frecuenciaMs * 0.75) return "#51FF4E";
        if (elapsed < frecuenciaMs) return "#ECEC27";
        return "#F82929";
      };

      // Asigna color inmediatamente y luego cada minuto
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

    // ─── In EventCard, swap out your old handleFormSubmit ───
    const handleFormSubmit = async (e) => {
      e.preventDefault();

      // 1) build the new eventos array
      const updatedEventos = bitacora.eventos.map((evt) =>
        evt._id === event._id
          ? {
              ...evt,
              descripcion: formData.descripcion,
              frecuencia: formData.frecuencia,
            }
          : evt
      );

      // 2) grab old vs new versions of this one event
      const oldEvent = bitacora.eventos.find((evt) => evt._id === event._id);
      const newEvent = updatedEventos.find((evt) => evt._id === event._id);

      // 3) optimistic UI update
      const updatedBitacora = {...bitacora, eventos: updatedEventos};
      setBitacora(updatedBitacora);
      setEventos(updatedEventos);

      // 4) send to server
      await handleEditSubmit(e, updatedBitacora);

      // 5) only if PATCH succeeded, audit per‐field in “Eventos”

      await generateAuditoriasFromChanges({
        oldData: oldEvent,
        newData: newEvent,
        bitacoraId: bitacora.bitacora_id,
        user,
        seccion: "Eventos",
      });

      // 6) close modal
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
            className="d-flex justify-content-between align-items-center cursor-pointer border p-2 rounded"
            onClick={toggleCollapse}>
            <span>
              {transporte.id.includes("_")
                ? `${transporte.id.split("_")[1]} - ${transporte.id.split("_")[2]}`
                : transporte.id}
            </span>
            <span>{isOpen ? "-" : "+"}</span>
          </div>
          {isOpen && (
            <div className="mt-2">
              <p>
                <strong>Duracion :</strong> {transporte.registro.duracion}
              </p>
              <p>
                <strong>Ubicacion :</strong> {transporte.registro.ubicacion}
              </p>
              <p>
                <strong>Velocidad :</strong> {transporte.registro.velocidad}
              </p>
              <p>
                <strong>Ultimo Posicionamiento :</strong>{" "}
                {transporte.registro.ultimo_posicionamiento}
              </p>
              <p>
                <strong>Coordenadas :</strong> {transporte.registro.coordenadas}
              </p>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center pt-3 px-3">
          <span className="text-muted small">
            {new Date(createdAt).toLocaleString("es-MX", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
          <h5 className="card-title fw-semibold mb-0">{nombre}</h5>

          {roleData?.bit_eventos?.update && (
            <button
              onClick={handleEditClick}
              className="new-btn"
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

        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p className="card-text">
                <strong>Registrado por:</strong> {registrado_por}
              </p>
              <p className="card-text">
                <strong>Descripción:</strong> {descripcion}
              </p>
              <div className="d-flex align-items-start gap-2">
                <strong>Frecuencia: </strong>
                <p> {`${frecuencia}  min`} </p>
                <div className="semaforoEvent">
                  <div className="circle" style={{backgroundColor: eventColor}}></div>
                </div>
              </div>
            </div>

            {/* New right col */}
            <div className="col-md-6">
              <p className="fw-bold text-center fs-5">Transportes</p>
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

  const handleEditChange = (e) => {
    const {name, value, type} = e.target;

    setBitacora((prev) => {
      if (type === "select-one") {
        return {...prev, [name]: value};
      } else {
        const [mainKey, subKey] = name.split(".");

        if (subKey) {
          return {
            ...prev,
            [mainKey]: {
              ...prev[mainKey], // Asegurar que mainKey no sea undefined
              [subKey]: value,
            },
          };
        } else {
          return {...prev, [name]: value};
        }
      }
    });
  };

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
      const response = await fetch(`${baseUrl}/bitacora/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitBitacora), // Use the updated bitacora
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
        <div className="content-wrapper">
          <div
            id="detailHeader"
            className="d-flex justify-content-start ps-5 align-items-center position-relative z-1">
            <div
              className="position-absolute start-0 ms-2 btn"
              onClick={() => navigate("/bitacoras")}>
              <i className="fa fa-chevron-left fw-bold"></i>
            </div>
            {/* Tab Navigation */}
            <ul className="nav nav-tabs ms-2" id="bitacoraTabs" role="tablist">
              {roleData?.bit_detalles.read && (
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link active"
                    id="detalles-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#detalles"
                    type="button"
                    role="tab"
                    aria-controls="detalles"
                    aria-selected="true"
                    onClick={() => handleTabClick("detalles")}>
                    <h6 className="p-0 m-0  fw-semibold">Detalles</h6>
                    <p className="text-center p-0 m-0" style={{fontSize: "0.8rem"}}>
                      ID: {bitacora.bitacora_id}
                    </p>
                  </button>
                </li>
              )}

              {roleData?.bit_transportes.read && (
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link"
                    id="transportes-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#transportes"
                    type="button"
                    role="tab"
                    aria-controls="transportes"
                    aria-selected="false"
                    onClick={() => handleTabClick("transportes")}>
                    <h6 className="p-0 m-0  fw-semibold">Transportes</h6>
                    <p className="text-center p-0 m-0" style={{fontSize: "0.8rem"}}>
                      Total: {bitacora.transportes.length}
                    </p>
                  </button>
                </li>
              )}

              {roleData?.bit_eventos.read && (
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link block"
                    id="eventos-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#eventos"
                    type="button"
                    role="tab"
                    aria-controls="eventos"
                    aria-selected="false"
                    onClick={() => handleTabClick("eventos")}>
                    <h6 className="p-0 m-0  fw-semibold">Eventos</h6>
                    <p className="text-center p-0 m-0" style={{fontSize: "0.8rem"}}>
                      Total: {bitacora.eventos.length}
                    </p>
                  </button>
                </li>
              )}
            </ul>

            {/* Conditional Buttons */}
            {/* DETALLES BTN */}
            {activeTab === "detalles" &&
              roleData?.bit_detalles?.update &&
              ((roleData.bitacora_abierta.update &&
                bitacora.status !== "cerrada" &&
                roleData.bitacoras.update) ||
                (bitacora.status === "cerrada" &&
                  roleData.bitacora_cerrada.update &&
                  roleData.bitacoras.update)) && (
                <button
                  className="new-btn position-absolute end-0 me-4"
                  onClick={() => {
                    setEditModalVisible(true);
                  }}>
                  <i className="fa fa-edit"></i>
                </button>
              )}
            {/* TRANSPORTES BTN */}
            {activeTab === "transportes" && roleData?.bit_transportes?.create && (
              <div className="d-flex justify-content-between align-items-center">
                <button
                  variant="primary"
                  onClick={handleShow}
                  className="new-btn position-absolute end-0 me-4">
                  <i className="fa fa-plus"></i>
                </button>
              </div>
            )}
            {/* EVENTOS BTN */}
            {activeTab === "eventos" && roleData?.bit_eventos?.create && (
              <button
                className="new-btn position-absolute end-0 me-4"
                data-bs-toggle="modal"
                data-bs-target="#eventModal"
                disabled={areAllTransportesClosed()}
                onClick={() => setModalOpen(true)}>
                <FontAwesomeIcon icon={faPlus} />
              </button>
            )}
          </div>

          <div className="scrollable-content flex-grow-1 overflow-auto px-3">
            <div className="tab-content" id="bitacoraTabsContent">
              {/* Detalles Tab Content */}
              {roleData?.bit_detalles.read && (
                <div
                  className="tab-pane fade show active mt-4 mx-4"
                  id="detalles"
                  role="tabpanel"
                  aria-labelledby="detalles-tab">
                  <div className="card-body">
                    <h5 className="fw-bold mb-4 text-center">Información General</h5>
                    <div className="row">
                      {/* Column 1 */}
                      <div className="col-md-6">
                        <h6 className="card-subtitle mb-2">
                          <strong>Folio Servicio:</strong> {bitacora.folio_servicio}
                        </h6>
                        <h6 className="card-subtitle mb-2">
                          <strong>No. Bitácora:</strong> {bitacora.bitacora_id}
                        </h6>
                        <h6 className="card-subtitle mb-2">
                          <strong>Cliente:</strong> {bitacora.cliente}
                        </h6>
                        <h6 className="card-subtitle mb-2">
                          <strong>Estatus:</strong> {capitalizeFirstLetter(bitacora.status)}
                        </h6>
                      </div>

                      {/* Column 4 */}
                      <div className="col-md-6">
                        <h6 className="card-subtitle mb-2">
                          <strong>Tipo Monitoreo:</strong> {bitacora.monitoreo}
                        </h6>
                        <h6 className="card-subtitle mb-2">
                          <p>
                            <strong>Origen:</strong> {getLocationText(bitacora.origen, origenes)}
                          </p>
                        </h6>
                        <h6 className="card-subtitle mb-2">
                          <p>
                            <strong>Destino:</strong> {getLocationText(bitacora.destino, destinos)}
                          </p>
                        </h6>
                      </div>
                    </div>

                    {bitacora.custodia && (
                      <div className="mt-4 border-top pt-3">
                        <h5 className="fw-bold mb-4 text-center">Información Custodia Física</h5>
                        <div className="row">
                          <div className="col-md-6">
                            <p>
                              <strong>Nombre Custodio 1:</strong>{" "}
                              {bitacora.custodia.custodio1_nombre || "--"}
                            </p>
                            <p>
                              <strong>Teléfono Custodio 1:</strong>{" "}
                              {bitacora.custodia.custodio1_telefono || "--"}
                            </p>
                            <p>
                              <strong>Nombre Custodio 2:</strong>{" "}
                              {bitacora.custodia.custodio2_nombre || "--"}
                            </p>
                            <p>
                              <strong>Teléfono Custodio 2:</strong>{" "}
                              {bitacora.custodia.custodio2_telefono || "--"}
                            </p>
                          </div>

                          <div className="col-md-6">
                            <p>
                              <strong>Placa:</strong> {bitacora.custodia.placa || "--"}
                            </p>
                            <p>
                              <strong>Modelo:</strong> {bitacora.custodia.modelo || "--"}
                            </p>
                            <p>
                              <strong>Color:</strong> {bitacora.custodia.color || "--"}
                            </p>
                            <p>
                              <strong>Marca:</strong> {bitacora.custodia.marca || "--"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <hr />
                    {bitacora.transportes.map((t) => {
                      // Find the "Validacion" event and extract inicioMonitoreo
                      const validacionEvento = bitacora.eventos.find(
                        (evento) =>
                          evento.nombre.toLowerCase() === "validación" &&
                          evento.transportes.some((tr) => tr.id === t.id)
                      );
                      const inicioMonitoreo = validacionEvento
                        ? validacionEvento.transportes.find((tr) => tr.id === t.id)?.inicioMonitoreo
                        : null;

                      // Find the "CIERRE DE SERVICIO" event and extract finalMonitoreo
                      const cierreEvento = bitacora.eventos.find(
                        (evento) =>
                          evento.nombre.toLowerCase() === "cierre de servicio" &&
                          evento.transportes.some((tr) => tr.id === t.id)
                      );
                      const finalMonitoreo = cierreEvento
                        ? cierreEvento.transportes.find((tr) => tr.id === t.id)?.finalMonitoreo
                        : null;

                      return (
                        <div key={t.id}>
                          <p className="fw-bold">{`GPS ID : ${
                            t.id.includes("_")
                              ? `${t.id.split("_")[1]} - ${t.id.split("_")[2]}`
                              : t.id
                          }`}</p>
                          <div>
                            <p className="card-text mb-2">
                              <strong>Inicio Monitoreo:</strong>{" "}
                              {inicioMonitoreo ? formatDate(inicioMonitoreo) : "--"}
                            </p>
                          </div>
                          <div>
                            <p className="card-text mb-2">
                              <strong>Final Monitoreo:</strong>{" "}
                              {finalMonitoreo ? formatDate(finalMonitoreo) : "--"}
                            </p>
                          </div>
                          <hr />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Transportes Tab Content */}
              <div
                className="tab-pane fade"
                id="transportes"
                role="tabpanel"
                aria-labelledby="transportes-tab">
                <div className="d-flex mt-4">
                  {/* Left Side: List of Transporte IDs */}
                  <div className="col-md-4 border-end pe-3">
                    <h5 className="fw-semibold">Lista de Transportes</h5>
                    {roleData?.gps_id?.read && (
                      <ul className="list-group">
                        {bitacora.transportes.map((transporte) => {
                          const transporteId = transporte.id.includes("_")
                            ? `${transporte.id.split("_")[1]} - ${transporte.id.split("_")[2]}` // Obtiene la parte después del '_'
                            : transporte.id; // Mantiene el ID original

                          return (
                            <li
                              key={transporte.id}
                              className={`list-group-item mt-2 ${
                                selectedTransporte?.id === transporte.id ? "active" : ""
                              }`}
                              onClick={() => handleSelectTransporte(transporte)}
                              style={{cursor: "pointer"}}>
                              GPS ID: {`${transporteId}`}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Right Side: Selected Transporte Details */}
                  <div className="col-md-8 ps-3">
                    {selectedTransporte ? (
                      <>
                        <div className="d-flex justify-content-end mt-3 me-4 position-absolute end-0 ">
                          {roleData.bit_transportes.update && (
                            <button className="new-btn" onClick={handleEditTransporte}>
                              <i className="fa fa-edit"></i>
                            </button>
                          )}
                        </div>
                        <div className="row mt-3">
                          {roleData?.tracto?.read && (
                            <div className="col-md-3">
                              <h5 className="card-subtitle mb-2 fw-semibold">Tracto:</h5>
                              <h6 className="card-subtitle mb-2">
                                <strong>Eco:</strong> {selectedTransporte.tracto.eco}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Placa:</strong> {selectedTransporte.tracto.placa}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Marca:</strong> {selectedTransporte.tracto.marca}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Modelo:</strong> {selectedTransporte.tracto.modelo}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Color:</strong> {selectedTransporte.tracto.color}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Tipo:</strong> {selectedTransporte.tracto.tipo}
                              </h6>
                            </div>
                          )}

                          {roleData?.remolque?.read && (
                            <div className="col-md-3">
                              <h5 className="card-subtitle mb-2 fw-semibold">Remolque:</h5>
                              <h6 className="card-subtitle mb-2">
                                <strong>Eco:</strong> {selectedTransporte.remolque.eco}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Placa:</strong> {selectedTransporte.remolque.placa}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Color:</strong> {selectedTransporte.remolque.color}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Capacidad:</strong> {selectedTransporte.remolque.capacidad}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Sello:</strong> {selectedTransporte.remolque.sello}
                              </h6>
                            </div>
                          )}

                          {roleData?.operador?.read && (
                            <div className="col-md-4">
                              <h6 className="card-subtitle mb-2">
                                <strong>Linea Transporte:</strong>{" "}
                                {selectedTransporte.lineaTransporte}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Operador:</strong> {selectedTransporte.operador}
                              </h6>
                              <h6 className="card-subtitle mb-2">
                                <strong>Telefono:</strong> {selectedTransporte.telefono}
                              </h6>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="alert alert-info" role="alert">
                        Seleccione un transporte de la lista para ver los detalles.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Eventos Tab Content */}
              <div
                className="tab-pane fade"
                id="eventos"
                role="tabpanel"
                aria-labelledby="eventos-tab">
                <div className="container mt-4">
                  <div>
                    {eventos
                      .slice()
                      .reverse()
                      .map((event, index) => (
                        <EventCard key={index} event={event} eventos={eventos} />
                      ))}
                  </div>
                </div>
              </div>
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
        }}
      />

      {editModalVisible && (
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
              value={bitacora.cliente}
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
              value={bitacora.monitoreo}
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
            <Form.Select name="origen" value={bitacora.origen} onChange={handleEditChange} required>
              <option value="">Selecciona una opción</option>
              {origenes.map((origen) => (
                <option key={origen._id} value={origen.name}>
                  {origen.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Destino</Form.Label>
            <Form.Select
              name="destino"
              value={bitacora.destino}
              onChange={handleEditChange}
              required>
              <option value="">Selecciona una opción</option>
              {destinos.map((destino) => (
                <option key={destino._id} value={destino.name}>
                  {destino.name}
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
            {roleData?.gps_id?.update && editedTransporte?.originalId?.startsWith("blank_") && (
              <Tab eventKey="gps" title="GPS ID">
                {/* ...ID generation logic */}
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
                      onChange={(e) =>
                        setEditedTransporte((prev) => ({
                          ...prev,
                          tracto: {...prev.tracto, [field]: e.target.value},
                        }))
                      }
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
                    onChange={(e) =>
                      setEditedTransporte((prev) => ({...prev, telefono: e.target.value}))
                    }
                  />
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
      />
    </section>
  );
};

export default BitacoraDetailPage;
