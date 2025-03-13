import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import Header from "../Header";
import Sidebar from "../Sidebar";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus} from "@fortawesome/free-solid-svg-icons";
import {useAuth} from "../../context/AuthContext";
import {Modal, Button, Form, Row} from "react-bootstrap";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import CreateTransporteModal from "./Transportes/CreateTransporteModal";
import NewEventModal from "./Eventos/NewEventModal";

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

  const handleEditTransporte = () => {
    setEditedTransporte(selectedTransporte);
    setEditTransporteModalVisible(true);
  };

  //TRANSPORTES LOGIC
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);
  const handleSelectTransporte = (transporte) => {
    setSelectedTransporte(transporte);
  };

  const handleTransportEdit = (e) => {
    e.preventDefault();

    // Find the index of the transporte by its ID
    const index = bitacora.transportes.findIndex(
      (transporte) => transporte.id === editedTransporte.id
    );

    if (index > -1) {
      // Update the specific transporte in the transportes array
      const updatedTransportes = [...bitacora.transportes];
      updatedTransportes[index] = editedTransporte;

      // Update bitacora with the modified transportes array
      const updatedBitacora = {
        ...bitacora,
        transportes: updatedTransportes,
      };

      setBitacora(updatedBitacora); // Update state

      // Call handleEditSubmit to send updates to the API
      handleEditSubmit(e, updatedBitacora);
      setEditTransporteModalVisible(false);
    } else {
      console.error("Transporte not found");
    }
  };

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

        // Ensure that transportes is populated if it doesn't already exist
        // if (data.transportes.length == 0) {
        //   console.log("Adding default transporte data...");
        //   const transporteToAdd = {
        //     id: transportes.length + 1,
        //     tracto: {
        //       eco: data.tracto.eco,
        //       placa: data.tracto.placa,
        //       marca: data.tracto.marca,
        //       modelo: data.tracto.modelo,
        //       color: data.tracto.color,
        //       tipo: data.tracto.tipo,
        //     },
        //     remolque: {
        //       eco: data.remolque.eco,
        //       placa: data.remolque.placa,
        //       color: data.remolque.color,
        //       capacidad: data.remolque.capacidad,
        //       sello: data.remolque.sello,
        //     },
        //   };
        //   await addTransporte(transporteToAdd, data._id);
        // }

        setIsEventStarted(data.status === "iniciada");
        setFinishButtonDisabled(data.status === "finalizada" || data.status === "cerrada");
      } else {
        console.error("Failed to fetch bitácora:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching bitácora:", e);
    }
  };

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

  const handleFinish = async () => {
    if (bitacora.status === "iniciada") {
      try {
        const response = await fetch(`${baseUrl}/bitacora/${id}/finish`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            finalMonitoreo: new Date().toISOString(), // Set the finish time
          }),
          credentials: "include",
        });
        if (response.ok) {
          const updatedBitacora = await response.json();
          setBitacora(updatedBitacora);
          setFinishButtonDisabled(true);
        } else {
          console.error("Failed to finish bitácora:", response.statusText);
        }
      } catch (e) {
        console.error("Error finishing bitácora:", e);
      }
    }
    if (bitacora.status === "iniciada") {
      try {
        const response = await fetch(`${baseUrl}/bitacora/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "cerrada",
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
      fetchBitacora();
    }

    fetchBitacora();
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

  const EventCard = ({event, eventos}) => {
    const {
      _id,
      nombre,
      descripcion,
      ubicacion,
      duracion,
      ultimo_posicionamiento,
      velocidad,
      coordenadas,
      createdAt,
      registrado_por,
      frecuencia,
      transportes,
    } = event;
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
      nombre,
      registrado_por,
      descripcion,
      ubicacion,
      duracion,
      ultimo_posicionamiento,
      velocidad,
      coordenadas,
      frecuencia,
      createdAt,
      transportes,
    });

    const isLastEvent = events[events.length - 1] === event;

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
      // console.log(formData);
      if (edited_bitacora) {
        edited_bitacora.eventos.forEach((evento, i) => {
          if (evento.nombre === formData.nombre) {
            formData.createdAt = edited_bitacora.eventos[i].createdAt;
            edited_bitacora.eventos[i] = formData;
          }
        });
      }

      handleEditSubmit(e);
    };

    const handleShowTransporteModal = (transporte) => {
      setSelectedTransporte(transporte);
      setShowTransporteModal(true);
    };

    const handleCloseTransporteModal = () => {
      setShowTransporteModal(false);
      setSelectedTransporte(null);
    };

    return (
      <div className="card mb-3">
        <div className="card-header text-center pt-3">
          <h5 className="card-title fw-semibold">{nombre}</h5>
          <Button
            variant="primary"
            onClick={handleEditClick}
            className="position-absolute end-0 top-0 mt-2 me-3 btn"
            disabled={
              !(
                (roleData && roleData.edit_eventos_a && bitacora.status !== "cerrada") ||
                (roleData && roleData.edit_eventos_c && bitacora.status === "cerrada")
              )
            }>
            <i className="fa fa-edit"></i>
          </Button>
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
                {isLastEvent && (
                  <div className="semaforoEvent">
                    {getEventColor(bitacora).map((color, index) => (
                      <div
                        key={index}
                        className={`circle`}
                        style={{
                          backgroundColor: color,
                        }}></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <p className="card-text">
                <strong>Transportes:</strong>{" "}
                {transportes && transportes.length > 0
                  ? transportes.map((transporte, index) => {
                      const transporteId = transporte.id.includes("_")
                        ? transporte.id.split("_")[1] // Obtiene la parte después del '_'
                        : transporte.id; // Mantiene el ID original

                      return (
                        <a
                          href="#"
                          key={index}
                          className="transport-link"
                          onClick={(e) => {
                            e.preventDefault();
                            handleShowTransporteModal(transporte);
                          }}>
                          {`${bitacora.bitacora_id}.${transporteId}`}
                          {index < transportes.length - 1 ? ", " : ""}
                        </a>
                      );
                    })
                  : ""}
              </p>
              <p className="card-text">
                <strong>Duracion:</strong> {duracion}
              </p>
              <p className="card-text">
                <strong>Ubicación:</strong> {ubicacion}
              </p>
              <p className="card-text">
                <strong>Último Posicionamiento:</strong> {ultimo_posicionamiento}
              </p>
              <p className="card-text">
                <strong>Velocidad:</strong> {velocidad}
              </p>
              <p className="card-text">
                <strong>Coordenadas:</strong> {coordenadas}
              </p>
              <p className="card-text">
                <strong>Fecha:</strong> {new Date(createdAt).toLocaleDateString()}
              </p>
              <p className="card-text">
                <strong>Hora:</strong> {new Date(createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
        <Modal show={showTransporteModal} onHide={handleCloseTransporteModal} backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title>Transporte Information</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedTransporte && (
              <div className="row mt-3">
                <div className="col-md-6">
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
                <div className="col-md-6">
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
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseTransporteModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Modal */}
        <Modal show={showModal} onHide={handleClose} backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title>Editar Evento</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleFormSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  disabled
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Registrado Por</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={formData.registrado_por}
                  onChange={handleInputChange}
                  disabled
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Transportes</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={formData.transportes.map((transporte) => transporte.id).join(", ")}
                  onChange={handleInputChange}
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
                <Form.Label>Ubicación</Form.Label>
                <Form.Control
                  type="text"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Último Posicionamiento</Form.Label>
                <Form.Control
                  type="text"
                  name="ultimo_posicionamiento"
                  value={formData.ultimo_posicionamiento}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Velocidad</Form.Label>
                <Form.Control
                  type="text"
                  name="velocidad"
                  value={formData.velocidad}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Coordenadas</Form.Label>
                <Form.Control
                  type="text"
                  name="coordenadas"
                  value={formData.coordenadas}
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
              <Row className="justify-content-end">
                <Button
                  type="button"
                  className="btn btn-danger me-2 col-2"
                  onClick={handleClose} // This line is added
                >
                  Cancelar
                </Button>

                <Button variant="success" type="submit" className="col-2 me-2">
                  Guardar
                </Button>
              </Row>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    );
  };

  const events = Array.isArray(bitacora.eventos) ? bitacora.eventos : [];

  const getButtonClass = (status) => {
    switch (status) {
      case "nueva":
        return "btn btn-secondary"; // Style for "nueva"
      case "validada":
        return "btn btn-success"; // Style for "validada"
      case "iniciada":
        return "btn btn-danger"; // Style for "iniciada"
      case "finalizada":
        return "btn btn-secondary"; // Style for "finalizada"
      case "cerrada":
        return "btn btn-dark"; // Style for "cerrada"
      default:
        return "btn btn-secondary"; // Default style
    }
  };

  const getButtonText = (status) => {
    switch (status) {
      case "nueva":
        return "Iniciar";
      case "validada":
        return "Iniciar";
      case "iniciada":
        return "Finalizar";
      case "finalizada":
        return "Cerrada";
      case "cerrada":
        return "Cerrada";
      default:
        return "Iniciar"; // Default text
    }
  };

  const hasEventWithName = () => {
    const eventToStart = "Validación";
    const eventToFinish = "Cierre de servicio";

    if (bitacora.status === "validada") {
      return events.some((event) => event.nombre === eventToStart);
    } else if (bitacora.status === "iniciada") {
      // Obtener todos los transportes que han sido incluidos en un evento "Cierre de servicio"
      const transportesConCierre = new Set(
        events
          .filter((event) => event.nombre === eventToFinish)
          .flatMap((event) => event.transportes.map((t) => t.id)) // Suponiendo que transportes es un array de objetos con ID
      );

      // Verificar si TODOS los transportes de la bitácora están en un evento "Cierre de servicio"
      return bitacora.transportes.every((transporte) => transportesConCierre.has(transporte.id));
    }

    return false;
  };

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

  const handleEditSubmit = async (e, updatedBitacora) => {
    e.preventDefault();
    console.log("Submitting changes...");
    console.log(updatedBitacora.eventos);

    const submitBitacora = updatedBitacora ? updatedBitacora : bitacora;

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
        setBitacora(responseData); // Ensure frontend reflects changes from backend
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
      <Header />
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
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link"
                  id="changes-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#changes"
                  type="button"
                  role="tab"
                  aria-controls="changes"
                  aria-selected="false"
                  onClick={() => handleTabClick("changes")}>
                  <h6 className="p-0 m-0  fw-semibold">Logs</h6>
                  <p className="text-center p-0 m-0" style={{fontSize: "0.8rem"}}>
                    Total: {0}
                  </p>
                </button>
              </li>
            </ul>

            {/* Conditional Buttons */}
            {/* DETALLES BTN */}
            {activeTab === "detalles" &&
              roleData &&
              ((roleData.edit_bitacora_abierta && bitacora.status !== "cerrada") ||
                (bitacora.status === "cerrada" && roleData.edit_bitacora_cerrada)) && (
                <button
                  className="btn btn-primary position-absolute end-0 me-4"
                  onClick={() => {
                    setEditModalVisible(true);
                  }}>
                  <i className="fa fa-edit"></i>
                </button>
              )}
            {/* EVENTOS BTN */}
            {activeTab === "eventos" && (
              <button
                className="btn btn-primary rounded-5 position-absolute end-0 me-4"
                data-bs-toggle="modal"
                data-bs-target="#eventModal"
                disabled={bitacora.status === "cerrada"}>
                <FontAwesomeIcon icon={faPlus} />
              </button>
            )}
            {/* TRANSPORTES BTN */}
            {activeTab === "transportes" && (
              <div className="d-flex justify-content-between align-items-center">
                <button
                  variant="primary"
                  onClick={handleShow}
                  className="btn btn-primary rounded-5 position-absolute end-0 me-4">
                  <i className="fa fa-plus"></i>
                </button>
              </div>
            )}
          </div>
          <div className="scrollable-content flex-grow-1 overflow-auto px-3">
            <div className="tab-content" id="bitacoraTabsContent">
              {/* Detalles Tab Content */}
              <div
                className="tab-pane fade show active mt-4 mx-4"
                id="detalles"
                role="tabpanel"
                aria-labelledby="detalles-tab">
                <div className="card-body">
                  <div className="row ms-1">
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
                      {/* <h6 className="card-subtitle mb-2">
                                    <strong>ID Cliente:</strong> {cliente.ID_Cliente}
                                </h6> */}
                      {/* <h6 className="card-subtitle mb-2">
                        <strong>Operador:</strong> {bitacora.operador}
                      </h6>
                      <h6 className="card-subtitle mb-2">
                        <strong>Teléfono:</strong> {bitacora.telefono}
                      </h6>
                      <h6 className="card-subtitle mb-2">
                        <strong>Linea Transporte:</strong> {bitacora.linea_transporte}
                      </h6> */}
                    </div>

                    {/* Column 4 */}
                    <div className="col-md-6">
                      <h6 className="card-subtitle mb-2">
                        <strong>Tipo Monitoreo:</strong> {bitacora.monitoreo}
                      </h6>
                      <h6 className="card-subtitle mb-2">
                        <strong>Origen:</strong> {bitacora.origen}
                      </h6>
                      <h6 className="card-subtitle mb-2">
                        <strong>Destino:</strong> {bitacora.destino}
                      </h6>
                      {/* <h6 className="card-subtitle mb-2">
                        <strong>Enlace:</strong> {bitacora.enlace}
                      </h6>
                      <h6 className="card-subtitle mb-2">
                        <strong>ID Acceso:</strong> {bitacora.id_acceso}
                      </h6>
                      <h6 className="card-subtitle mb-2">
                        <strong>Contraseña Acceso:</strong> {bitacora.contra_acceso}
                      </h6> */}
                    </div>
                  </div>
                  <hr />
                  {/* New Row for Inicio Monitoreo, Final Monitoreo, and Iniciar button */}
                  <div className="row mt-3 mx-1">
                    <div className="col-md-5">
                      <p className="card-text mb-2">
                        <strong>Inicio Monitoreo:</strong>{" "}
                        {bitacora.inicioMonitoreo ? formatDate(bitacora.inicioMonitoreo) : "--"}
                      </p>
                    </div>
                    <div className="col-md-5">
                      <p className="card-text mb-2">
                        <strong>Final Monitoreo:</strong>{" "}
                        {bitacora.finalMonitoreo ? formatDate(bitacora.finalMonitoreo) : "--"}
                      </p>
                    </div>
                    <div className="col-md-2 d-flex justify-content-end align-items-center">
                      <button
                        id="iniciarBtn"
                        className={getButtonClass(bitacora.status)}
                        onClick={bitacora.status === "iniciada" ? handleFinish : handleStart}
                        disabled={!hasEventWithName()}>
                        {getButtonText(bitacora.status)}
                      </button>
                    </div>
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
                    {events
                      .slice()
                      .reverse()
                      .map((event, index) => (
                        <EventCard key={index} event={event} eventos={events} />
                      ))}
                  </div>
                </div>
              </div>

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
                    <ul className="list-group">
                      {bitacora.transportes.map((transporte) => {
                        const transporteId = transporte.id.includes("_")
                          ? transporte.id.split("_")[1] // Obtiene la parte después del '_'
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
                  </div>

                  {/* Right Side: Selected Transporte Details */}
                  <div className="col-md-8 ps-3">
                    {selectedTransporte ? (
                      <>
                        <div className="d-flex justify-content-end mt-3 me-4 position-absolute end-0 ">
                          {((roleData.edit_transportes_a && bitacora.status !== "cerrada") ||
                            (roleData.edit_transportes_c && bitacora.status === "cerrada")) && (
                            <button className="btn btn-primary" onClick={handleEditTransporte}>
                              <i className="fa fa-edit"></i>
                            </button>
                          )}
                        </div>
                        <div className="row mt-3">
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
            </div>
          </div>
        </div>
      </div>

      <NewEventModal edited={edited} eventTypes={eventTypes} />

      {editModalVisible && (
        <>
          <Modal
            show={editModalVisible}
            onHide={() => setEditModalVisible(false)}
            backdrop="static"
            keyboard={false}>
            <Modal.Header closeButton>
              <Modal.Title>Editar Bitácora</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleEditSubmit}>
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
                  <Form.Label htmlFor="folio_servicio">No. Bitacora</Form.Label>
                  <Form.Control
                    type="text"
                    id="bitacora_id"
                    name="bitacora_id"
                    value={bitacora.bitacora_id}
                    onChange={handleEditChange}
                    disabled
                  />
                </Form.Group>
                {/* cliente */}
                <div className="mb-3">
                  <label htmlFor="cliente" className="form-label">
                    Cliente
                  </label>
                  <select
                    className="form-select"
                    id="cliente"
                    name="cliente"
                    aria-label="cliente"
                    value={bitacora.cliente}
                    onChange={handleEditChange}
                    required>
                    <option value="">Selecciona una opción</option>
                    {clients.map((cliente) => (
                      <option key={cliente._id} value={cliente.razon_social}>
                        {cliente.razon_social}
                      </option>
                    ))}
                  </select>
                </div>
                {/* monitoreo */}
                {/* Tipo de Monitoreo */}
                <div className="mb-3">
                  <label htmlFor="monitoreo" className="form-label">
                    Tipo de Monitoreo
                  </label>
                  <select
                    className="form-select"
                    id="monitoreo"
                    name="monitoreo"
                    aria-label="Tipo de Monitoreo"
                    value={bitacora.monitoreo}
                    onChange={handleEditChange}
                    required>
                    <option value="">Selecciona una opción</option>
                    {monitoreos.map((monitoreo) => (
                      <option key={monitoreo._id} value={monitoreo.tipoMonitoreo}>
                        {monitoreo.tipoMonitoreo}
                      </option>
                    ))}
                  </select>
                </div>
                {/* operador
                <div className="mb-3">
                  <label htmlFor="operador" className="form-label">
                    Operador
                  </label>
                  <select
                    className="form-select"
                    id="operador"
                    aria-label="operador"
                    name="operador"
                    value={bitacora.operador}
                    onChange={handleEditChange}
                    required>
                    <option value="">Selecciona una opción</option>
                    {operadores.map((operador) => (
                      <option key={operador._id} value={operador.name}>
                        {operador.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label htmlFor="telefono">Telefono</Form.Label>
                  <Form.Control
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={bitacora.telefono}
                    onChange={handleEditChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="linea_transporte">Línea de transporte</Form.Label>
                  <Form.Control
                    type="text"
                    id="linea_transporte"
                    name="linea_transporte"
                    value={bitacora.linea_transporte}
                    onChange={handleEditChange}
                  />
                </Form.Group> */}
                {/* origen */}
                <div className="mb-3">
                  <label htmlFor="origen" className="form-label">
                    Origen
                  </label>
                  <select
                    className="form-select"
                    id="origen"
                    name="origen"
                    aria-label="origen"
                    value={bitacora.origen}
                    onChange={handleEditChange}
                    required>
                    <option value="">Selecciona una opción</option>
                    {origenes.map((origen) => (
                      <option key={origen._id} value={origen.name}>
                        {origen.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* destino */}
                <div className="mb-3">
                  <label htmlFor="destino" className="form-label">
                    Destino
                  </label>
                  <select
                    className="form-select"
                    id="destino"
                    name="destino"
                    aria-label="destino"
                    value={bitacora.destino}
                    onChange={handleEditChange}
                    required>
                    <option value="">Selecciona una opción</option>
                    {destinos.map((destino) => (
                      <option key={destino._id} value={destino.name}>
                        {destino.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* <Form.Group className="mb-3">
                  <Form.Label htmlFor="enlace">Enlace</Form.Label>
                  <Form.Control
                    type="text"
                    id="enlace"
                    name="enlace"
                    value={bitacora.enlace}
                    onChange={handleEditChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="id_acceso">ID acceso</Form.Label>
                  <Form.Control
                    type="text"
                    id="id_acceso"
                    name="id_acceso"
                    value={bitacora.id_acceso}
                    onChange={handleEditChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="contra_acceso">Contraseña acceso</Form.Label>
                  <Form.Control
                    type="text"
                    id="contra_acceso"
                    name="contra_acceso"
                    value={bitacora.contra_acceso}
                    onChange={handleEditChange}
                  />
                </Form.Group> */}

                <div className="w-100 d-flex flex-row justify-content-end">
                  <button
                    type="button"
                    className="btn btn-danger me-2"
                    data-bs-dismiss="modal"
                    onClick={() => setEditModalVisible(false)}>
                    Cancelar
                  </button>
                  <Button type="submit" variant="success" className="me-2">
                    Guardar
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </>
      )}

      {/* EDIT TRANSPORTES */}
      {isEditTransporteModalVisible && (
        <>
          {" "}
          <div className="modal-backdrop fade show"></div>
          <div className="modal show d-block">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Editar Transporte</h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditTransporteModalVisible(false)}
                  />
                </div>
                <div className="modal-body">
                  {/* Form inputs for editing transporte */}
                  <form onSubmit={handleTransportEdit}>
                    {/* Example inputs for tracto */}
                    <h5>Tracto</h5>
                    <hr />
                    <div className="mb-3">
                      <label className="form-label">Eco</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.tracto.eco}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            tracto: {
                              ...editedTransporte.tracto,
                              eco: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Placa</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.tracto.placa}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            tracto: {
                              ...editedTransporte.tracto,
                              placa: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Marca</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.tracto.marca}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            tracto: {
                              ...editedTransporte.tracto,
                              marca: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Modelo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.tracto.modelo}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            tracto: {
                              ...editedTransporte.tracto,
                              modelo: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Color</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.tracto.color}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            tracto: {
                              ...editedTransporte.tracto,
                              color: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Tipo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.tracto.tipo}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            tracto: {
                              ...editedTransporte.tracto,
                              tipo: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <hr />

                    <h5>Remolque</h5>
                    <hr />
                    <div className="mb-3">
                      <label className="form-label">Eco</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.remolque.eco}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            remolque: {
                              ...editedTransporte.remolque,
                              eco: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Placa</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.remolque.placa}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            remolque: {
                              ...editedTransporte.remolque,
                              placa: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Color</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.remolque.color}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            remolque: {
                              ...editedTransporte.remolque,
                              color: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Capacidad</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.remolque.capacidad}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            remolque: {
                              ...editedTransporte.remolque,
                              capacidad: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Sello</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editedTransporte.remolque.sello}
                        onChange={(e) =>
                          setEditedTransporte({
                            ...editedTransporte,
                            remolque: {
                              ...editedTransporte.remolque,
                              sello: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="d-flex justify-content-end">
                      <button
                        type="cancel"
                        className="btn btn-danger me-3"
                        onClick={() => setEditTransporteModalVisible(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-success">
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
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
