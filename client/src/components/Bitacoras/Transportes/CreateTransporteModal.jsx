import React, {useState, useEffect} from "react";
import {Modal, Form} from "react-bootstrap";
import {useWialon} from "../../../context/WialonProvider";

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
  const [idMethod, setIdMethod] = useState("wialon");
  const [unitInfo, setUnitInfo] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedUnitName, setSelectedUnitName] = useState("");
  const [operadores, setOperadores] = useState([]);
  const token = import.meta.env.VITE_WIALON_TOKEN;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [units, setUnits] = useState();

  useEffect(() => {
    fetchOperadores();
    fetchAllUnits();
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
        alert("Por favor, seleccione una unidad de Wialon.");
        return;
      }
      newId = `${selectedUnitId}_${selectedUnitName}_${transporteData.tracto.eco}`;
    } else {
      newId = `0_${(transportes.length + 1).toString().padStart(2, "0")}_${
        transporteData.tracto.eco
      }`;
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
          <Form.Group className="mb-3">
            <Form.Label>Método de ID</Form.Label>
            <div>
              <Form.Check
                type="radio"
                label="Intacsep ID"
                name="idMethod"
                value="wialon"
                checked={idMethod === "wialon"}
                onChange={() => setIdMethod("wialon")}
              />
              <Form.Check
                type="radio"
                label="Automatico"
                name="automatic"
                value="automatic"
                checked={idMethod === "automatic"}
                onChange={() => setIdMethod("automatic")}
              />
            </div>
            {/* <Form.Control
              type="text"
              name="id"
              value={(transportes.length + 1).toString().padStart(2, "0")}
              onChange={handleChange}
              required
              disabled
            /> */}
          </Form.Group>

          {idMethod === "automatic" ? (
            <Form.Group className="mb-3">
              <Form.Label>ID</Form.Label>
              <Form.Control
                type="text"
                value={(transportes.length + 1).toString().padStart(2, "0")}
                disabled
              />
            </Form.Group>
          ) : (
            <Form.Group className="mb-3">
              <Form.Label>Seleccionar Intacsep ID</Form.Label>
              <Form.Select
                className="unit-select"
                value={selectedUnitId}
                onChange={(e) => {
                  const unitId = e.target.value;
                  const selected = units?.find((u) => u.id.toString() === unitId);
                  if (selected) {
                    setSelectedUnitId(selected.id);
                    setSelectedUnitName(selected.name);
                    setSearchTerm(selected.name); // optional if you still use the input box later
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

          {/* Tracto Fields */}
          <h5>Tracto</h5>
          <Form.Group className="mb-3">
            <Form.Label>Eco</Form.Label>
            <Form.Control
              type="text"
              name="tracto.eco"
              value={transporteData.tracto.eco}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Placa</Form.Label>
            <Form.Control
              type="text"
              name="tracto.placa"
              value={transporteData.tracto.placa}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Marca</Form.Label>
            <Form.Control
              type="text"
              name="tracto.marca"
              value={transporteData.tracto.marca}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Modelo</Form.Label>
            <Form.Control
              type="text"
              name="tracto.modelo"
              value={transporteData.tracto.modelo}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Color</Form.Label>
            <Form.Control
              type="text"
              name="tracto.color"
              value={transporteData.tracto.color}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tipo</Form.Label>
            <Form.Control
              type="text"
              name="tracto.tipo"
              value={transporteData.tracto.tipo}
              onChange={handleChange}
              required
            />
          </Form.Group>

          {/* Remolque Fields */}
          <h5>Remolque</h5>
          <Form.Group className="mb-3">
            <Form.Label>Eco</Form.Label>
            <Form.Control
              type="text"
              name="remolque.eco"
              value={transporteData.remolque.eco}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Placa</Form.Label>
            <Form.Control
              type="text"
              name="remolque.placa"
              value={transporteData.remolque.placa}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Color</Form.Label>
            <Form.Control
              type="text"
              name="remolque.color"
              value={transporteData.remolque.color}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Capacidad</Form.Label>
            <Form.Control
              type="text"
              name="remolque.capacidad"
              value={transporteData.remolque.capacidad}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Sello</Form.Label>
            <Form.Control
              type="text"
              name="remolque.sello"
              value={transporteData.remolque.sello}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <h5>Datos</h5>
          <Form.Group className="mb-3">
            <Form.Label>Linea de Transporte</Form.Label>
            <Form.Control
              type="text"
              name="lineaTransporte"
              value={transporteData.lineaTransporte}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Operador</Form.Label>
            <Form.Control
              type="text"
              name="operador"
              value={transporteData.operador}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Telefono</Form.Label>
            <Form.Control
              type="text"
              name="telefono"
              value={transporteData.telefono}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <div className="d-flex w-100 justify-content-end">
            <button type="cancel" className="btn btn-danger px-3 me-3" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success px-4">
              Crear
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateTransporteModal;
