import React, {useState, useEffect} from "react";
import {Form, Tabs, Tab} from "react-bootstrap";
import {useAuth} from "../../../context/AuthContext";
import ModalTemplate from "../../../components/ModalTemplate"; // adjust path if needed

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

  const [idMethod, setIdMethod] = useState("manual");
  const [unitInfo, setUnitInfo] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedUnitName, setSelectedUnitName] = useState("");
  const [operadores, setOperadores] = useState([]);
  const [units, setUnits] = useState();
  const [roleData, setRoleData] = useState(null);

  const {user, verifyToken, setUser} = useAuth();
  const token = import.meta.env.VITE_WIALON_TOKEN;
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken();
        setUser(data);
      } catch (e) {
        console.error("Error verifying token or fetching user:", e);
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
        console.error("Error fetching role permissions:", e);
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
      } else {
        console.error("Failed to fetch operadores:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching operadores:", e);
    }
  };

  const fetchAllUnits = (retryCount = 0) => {
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
          setTimeout(() => fetchAllUnits(retryCount + 1), RETRY_DELAY * (retryCount + 1));
        }
        return;
      }

      const flags = window.wialon.item.Item.dataFlag.base;
      sess.updateDataFlags([{type: "type", data: "avl_unit", flags, mode: 0}], (code) => {
        if (code) return;

        const units = sess.getItems("avl_unit") || [];
        const unitList = units.map((unit) => ({
          id: unit.getId(),
          name: unit.getName(),
        }));
        setUnits(unitList);
      });
    });
  };

  const handleChange = (e) => {
    const {name, value} = e.target;
    const [section, field] = name.split(".");
    if (section && field) {
      setTransporteData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setTransporteData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmitTransporte = (e) => {
    e.preventDefault();

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
    } else {
      newId = `blank_${Date.now()}`;
    }

    const exists = transportes.some((t) => t.id === newId);
    if (exists) {
      alert("El transporte ya existe. Por favor, seleccione otro.");
      return;
    }

    const newTransporte = {id: newId, ...transporteData};
    addTransporte(newTransporte, bitacora._id);

    setTransporteData({
      tracto: {eco: "", placa: "", marca: "", modelo: "", color: "", tipo: ""},
      remolque: {eco: "", placa: "", color: "", capacidad: "", sello: ""},
      lineaTransporte: "",
      operador: "",
      telefono: "",
    });

    setSearchTerm("");
    handleClose();
  };

  return (
    <ModalTemplate
      show={show}
      title="Crear Nuevo Transporte"
      onClose={handleClose}
      onSubmit={handleSubmitTransporte}>
      <Tabs defaultActiveKey="gps" className="mb-3">
        {roleData?.gps_id?.create && (
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

        {roleData?.tracto?.create && (
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
                  required={!!roleData?.tracto?.create}
                />
              </Form.Group>
            ))}
          </Tab>
        )}

        {roleData?.remolque?.create && (
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
                  required={!!roleData?.remolque?.create}
                />
              </Form.Group>
            ))}
          </Tab>
        )}

        {roleData?.operador?.create && (
          <Tab eventKey="operador" title="OPERADOR">
            <h5>Datos del Operador</h5>
            <Form.Group className="mb-3">
              <Form.Label>Línea de Transporte</Form.Label>
              <Form.Control
                type="text"
                name="lineaTransporte"
                value={transporteData.lineaTransporte}
                onChange={handleChange}
                required={!!roleData?.operador?.create}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Operador</Form.Label>
              <Form.Control
                type="text"
                name="operador"
                value={transporteData.operador}
                onChange={handleChange}
                required={!!roleData?.operador?.create}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="text"
                name="telefono"
                value={transporteData.telefono}
                onChange={handleChange}
                required={!!roleData?.operador?.create}
              />
            </Form.Group>
          </Tab>
        )}
      </Tabs>
    </ModalTemplate>
  );
};

export default CreateTransporteModal;