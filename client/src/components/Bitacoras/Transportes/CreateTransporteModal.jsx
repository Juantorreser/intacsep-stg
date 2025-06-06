import React, {useState, useEffect} from "react";
import {Modal, Form, Tabs, Tab} from "react-bootstrap";
import {useAuth} from "../../../context/AuthContext";

const CreateTransporteModal = ({show, handleClose, addTransporte, transportes, bitacora}) => {
  const [transporteData, setTransporteData] = useState({
    tracto: {
      eco: "",
      placa: "",
      marca: "",
      modelo: "",
      color: "",
      tipo: "",
    },
    remolque: {
      eco: "",
      placa: "",
      color: "",
      capacidad: "",
      sello: "",
    },
    lineaTransporte: "",
    operador: "",
    telefono: "",
  });

  //ID Variables
  const [idMethod, setIdMethod] = useState("manual");
  const [unitInfo, setUnitInfo] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedUnitName, setSelectedUnitName] = useState("");
  const [operadores, setOperadores] = useState([]);
  const token = import.meta.env.VITE_WIALON_TOKEN;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [units, setUnits] = useState();
  const [roleData, setRoleData] = useState(null);
  const {user, verifyToken, setUser} = useAuth();

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken(); // Ensure user is verified
        setUser(data);
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        navigate("/login");
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchRolePermissions = async () => {
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
  }, [user]);

  useEffect(() => {
    fetchOperadores();
    fetchAllUnits();
    console.log("Cached token:", localStorage.getItem("wialon_token"));
  }, []);

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

  //Get Wialon Units
  const fetchAllUnits = (retryCount = 0) => {
    const sess = window.wialon.core.Session.getInstance();
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 3000;

    if (!token) {
      console.warn("Wialon token is not available.");
      return;
    }

    // Avoid re-initializing the session every time
    if (!sess.getBaseUrl()) {
      sess.initSession("https://hst-api.wialon.com");
    }

    sess.loginToken(token, "", (code) => {
      if (code) {
        console.error("Wialon login failed with code:", code);

        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY * (retryCount + 1);
          console.log(`Retrying login in ${delay / 1000}s...`);
          setTimeout(() => fetchAllUnits(retryCount + 1), delay);
        } else {
          console.error("Maximum retry attempts reached. Could not connect to Wialon.");
        }

        return;
      }

      const flags = window.wialon.item.Item.dataFlag.base;

      sess.updateDataFlags([{type: "type", data: "avl_unit", flags, mode: 0}], (code) => {
        if (code) {
          console.error("Failed to update Wialon data flags. Code:", code);
          return;
        }

        const units = sess.getItems("avl_unit") || [];
        const unitList = units.map((unit) => ({
          id: unit.getId(),
          name: unit.getName(),
        }));
        setUnits(unitList);
      });
    });
  };

  // Handle form input changes
  const handleChange = (e) => {
    const {name, value} = e.target;
    const [section, field] = name.split(".");
    if (section && field) {
      setTransporteData((prevData) => ({
        ...prevData,
        [section]: {
          ...prevData[section],
          [field]: value,
        },
      }));
    } else {
      setTransporteData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  // Handle form submission
  const handleSubmitTransporte = (e) => {
    e.preventDefault();
    console.log(transporteData);

    let newId;

    if (idMethod === "wialon") {
      if (!selectedUnitId || !selectedUnitName) {
        alert("Por favor seleccione una unidad Wialon.");
        return;
      }
      newId = `${selectedUnitId}_${selectedUnitName}_${transporteData.tracto.eco}`;
    } else if (idMethod === "automatic") {
      newId = `0_${(transportes.length + 1).toString().padStart(2, "0")}_${
        transporteData.tracto.eco
      }`;
    } else if (idMethod === "manual") {
      // Creamos un ID vacío temporal único usando timestamp
      newId = `blank_${Date.now()}`;
    }

    // Check if the ID already exists in transportes
    const exists = transportes.some((transporte) => transporte.id === newId);
    if (exists) {
      alert("El transporte ya existe. Por favor, seleccione otro.");
      return;
    }

    const newTransporteData = {id: newId, ...transporteData};

    addTransporte(newTransporteData, bitacora._id);
    setTransporteData({
      tracto: {
        eco: "",
        placa: "",
        marca: "",
        modelo: "",
        color: "",
        tipo: "",
      },
      remolque: {
        eco: "",
        placa: "",
        color: "",
        capacidad: "",
        sello: "",
      },
      lineaTransporte: "",
      operador: "",
      telefono: "",
    });
    setSearchTerm("");
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Crear Nuevo Transporte</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmitTransporte}>
          <Tabs defaultActiveKey="gps" className="mb-3">
            {/* TAB 1 - GPS ID */}
            {roleData?.gps_id?.read && (
              <Tab eventKey="gps" title="GPS ID">
                <Form.Group className="mb-3">
                  <Form.Label>Método de ID</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      label="Manual (ID vacío)"
                      name="idMethod"
                      value="manual"
                      checked={idMethod === "manual"}
                      onChange={() => setIdMethod("manual")}
                    />
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

                {(idMethod === "automatic" || idMethod === "manual") && (
                  <Form.Group className="mb-3">
                    <Form.Label>ID generado</Form.Label>
                    <Form.Control
                      type="text"
                      value={
                        idMethod === "automatic"
                          ? `0_${(transportes.length + 1).toString().padStart(2, "0")}_${
                              transporteData.tracto.eco
                            }`
                          : "(ID en blanco)"
                      }
                      disabled
                    />
                  </Form.Group>
                )}
              </Tab>
            )}

            {/* TAB 2 - ECO (REMOLQUE) */}
            {roleData?.remolque?.read && (
              <Tab eventKey="remolque" title="REMOLQUE">
                <h5>Datos del Remolque</h5>
                {["eco", "placa", "color", "capacidad", "sello"].map((field) => (
                  <Form.Group className="mb-3" key={field}>
                    <Form.Label>{field.toUpperCase()}</Form.Label>
                    <Form.Control
                      type="text"
                      name={`remolque.${field}`}
                      value={transporteData.remolque[field]}
                      onChange={handleChange}
                    />
                  </Form.Group>
                ))}
              </Tab>
            )}

            {/* TAB 3 - TRACTO */}
            {roleData?.tracto?.read && (
              <Tab eventKey="tracto" title="TRACTO">
                <h5>Datos del Tracto</h5>
                {["eco", "placa", "marca", "modelo", "color", "tipo"].map((field) => (
                  <Form.Group className="mb-3" key={field}>
                    <Form.Label>{field.toUpperCase()}</Form.Label>
                    <Form.Control
                      type="text"
                      name={`tracto.${field}`}
                      value={transporteData.tracto[field]}
                      onChange={handleChange}
                    />
                  </Form.Group>
                ))}
              </Tab>
            )}

            {/* TAB 4 - OPERADOR */}
            {roleData?.operador?.read && (
              <Tab eventKey="operador" title="OPERADOR">
                <h5>Datos del Operador</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Línea de Transporte</Form.Label>
                  <Form.Control
                    type="text"
                    name="lineaTransporte"
                    value={transporteData.lineaTransporte}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Operador</Form.Label>
                  <Form.Control
                    type="text"
                    name="operador"
                    value={transporteData.operador}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="telefono"
                    value={transporteData.telefono}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Tab>
            )}
          </Tabs>

          {/* BOTONES */}
          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-danger me-2" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              Crear
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateTransporteModal;
