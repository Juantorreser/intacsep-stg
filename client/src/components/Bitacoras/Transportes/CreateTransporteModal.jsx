import React, {useState, useEffect, useRef} from "react";
import {Form, Tabs, Tab} from "react-bootstrap";
import {useAuth} from "../../../context/AuthContext";
import ModalTemplate from "../../../components/ModalTemplate"; // adjust path if needed

const CreateTransporteModal = ({
  show,
  handleClose,
  addTransporte,
  transportes,
  bitacora,
  units,
  onDraftCreated,
}) => {
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
    gpsUnits: [], // Array de GPS units
  });

  const [idMethod, setIdMethod] = useState("manual");
  const [unitInfo, setUnitInfo] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedUnitName, setSelectedUnitName] = useState("");
  const [selectedGpsUnits, setSelectedGpsUnits] = useState([]); // Array de GPS seleccionados
  const [gpsSearchTerm, setGpsSearchTerm] = useState(""); // Para buscar GPS
  const [operadores, setOperadores] = useState([]);
  const [lineasTransporte, setLineasTransporte] = useState([]);
  // const [units, setUnits] = useState([]);

  const [roleData, setRoleData] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [draftLineaText, setDraftLineaText] = useState("");
  const [draftOperadorText, setDraftOperadorText] = useState("");

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
    // Fetch initial data
    if (bitacora && bitacora.cliente) {
      fetchLineasTransporte(bitacora.cliente);
    }
    // fetchAllUnits();
    console.log("Cached token:", localStorage.getItem("wialon_token"));
  }, [bitacora]);

  // Fetch lineas de transporte filtered by client
  const fetchLineasTransporte = async (cliente) => {
    try {
      let url = `${baseUrl}/lineas-transporte`;
      if (cliente && cliente !== "all") {
        url += `?cliente=${encodeURIComponent(cliente)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLineasTransporte(data);
      } else {
        console.error("Failed to fetch lineas transporte:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching lineas transporte:", e);
    }
  };

  const fetchOperadores = async (lineaTransporte = null) => {
    try {
      let url = `${baseUrl}/operadores`;
      if (lineaTransporte && lineaTransporte !== "all") {
        url += `?lineaTransporte=${encodeURIComponent(lineaTransporte)}`;
      }

      console.log("Fetching operadores for lineaTransporte:", lineaTransporte, "URL:", url);

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOperadores(data);
        console.log("Operadores fetched:", data);
        console.log("Operadores count:", data.length);
      } else {
        console.error("Failed to fetch operadores:", response.statusText);
        // Clear operadores on error
        setOperadores([]);
      }
    } catch (e) {
      console.error("Error fetching operadores:", e);
      // Clear operadores on error
      setOperadores([]);
    }
  };

  // const fetchAllUnits = (retryCount = 0) => {
  //   const sess = window.wialon.core.Session.getInstance();
  //   const MAX_RETRIES = 5;
  //   const RETRY_DELAY = 3000;

  //   if (!token) return;

  //   if (!sess.getBaseUrl()) {
  //     sess.initSession("https://hst-api.wialon.com");
  //   }

  //   sess.loginToken(token, "", (code) => {
  //     if (code) {
  //       if (retryCount < MAX_RETRIES) {
  //         setTimeout(() => fetchAllUnits(retryCount + 1), RETRY_DELAY * (retryCount + 1));
  //       }
  //       return;
  //     }

  //     const flags = window.wialon.item.Item.dataFlag.base;
  //     sess.updateDataFlags([{type: "type", data: "avl_unit", flags, mode: 0}], (code) => {
  //       if (code) return;

  //       const units = sess.getItems("avl_unit") || [];
  //       const unitList = units.map((unit) => ({
  //         id: unit.getId(),
  //         name: unit.getName(),
  //       }));
  //       setUnits(unitList);
  //       console.log("Fetched Wialon units:", unitList);
  //     });
  //   });
  // };

  const validatePhoneNumber = (phone) => {
    // Regex para validar número de teléfono mexicano de exactamente 10 dígitos seguidos
    // Solo acepta formato: 1234567890 (sin espacios, guiones o paréntesis)
    const phoneRegex = /^\d{10}$/;

    // Debe ser exactamente 10 dígitos seguidos
    return phoneRegex.test(phone);
  };

  const handleGpsUnitToggle = (unit) => {
    setSelectedGpsUnits((prev) => {
      const isSelected = prev.some((u) => u.id === unit.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== unit.id);
      } else {
        return [...prev, unit];
      }
    });
  };

  const generateTransporteId = () => {
    const numericId = (transportes.length + 1).toString().padStart(3, "0");
    const tractoPlaca = transporteData.tracto.placa || "N/A";
    return `T${numericId}_${tractoPlaca}`;
  };

  // Filtrar GPS basado en búsqueda
  const filteredGpsUnits = units.filter(
    (unit) =>
      unit.name.toLowerCase().includes(gpsSearchTerm.toLowerCase()) ||
      unit.id.toString().includes(gpsSearchTerm)
  );

  // Función para seleccionar/deseleccionar todos los GPS filtrados
  const handleSelectAllFiltered = () => {
    const allFilteredSelected = filteredGpsUnits.every((unit) =>
      selectedGpsUnits.some((selected) => selected.id === unit.id)
    );

    if (allFilteredSelected) {
      // Deseleccionar todos los filtrados
      setSelectedGpsUnits((prev) =>
        prev.filter((selected) => !filteredGpsUnits.some((filtered) => filtered.id === selected.id))
      );
    } else {
      // Seleccionar todos los filtrados
      const newSelections = filteredGpsUnits.filter(
        (unit) => !selectedGpsUnits.some((selected) => selected.id === unit.id)
      );
      setSelectedGpsUnits((prev) => [...prev, ...newSelections]);
    }
  };

  const handleChange = (e) => {
    const {name, value} = e.target;
    const [section, field] = name.split(".");

    // Validar teléfono si el campo es 'telefono'
    if (name === "telefono") {
      if (value && !validatePhoneNumber(value)) {
        setPhoneError(
          "El número de teléfono debe tener exactamente 10 dígitos seguidos (ej: 1234567890)"
        );
      } else {
        setPhoneError("");
      }
    }

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

  const handleSubmitTransporte = async (e) => {
    e.preventDefault();

    // Validar teléfono antes de enviar
    if (transporteData.telefono && !validatePhoneNumber(transporteData.telefono)) {
      setPhoneError("El número de teléfono debe tener exactamente 10 dígitos seguidos");
      return;
    }

    let newId;
    if (idMethod === "wialon") {
      if (selectedGpsUnits.length === 0) {
        alert("Por favor seleccione al menos una unidad Wialon.");
        return;
      }
      newId = generateTransporteId();
    } else if (idMethod === "automatic") {
      newId = generateTransporteId();
    } else {
      newId = `blank_${Date.now()}`;
    }

    const exists = transportes.some((t) => t.id === newId);
    if (exists) {
      alert("El transporte ya existe. Por favor, seleccione otro.");
      return;
    }

    // Crear el transporte con múltiples GPS
    const newTransporte = {
      id: newId,
      ...transporteData,
      gpsUnits: selectedGpsUnits.map((unit) => ({
        wialonId: unit.id,
        name: unit.name,
        data: {},
      })),
    };

    // Check if any draft values were entered (not in catalog)
    if (roleData?.crear_draft_transporte) {
      const lineaEnCatalog = lineasTransporte.some(
        (l) => l.nombre.toUpperCase() === transporteData.lineaTransporte?.toUpperCase()
      );
      const operadorEnCatalog = operadores.some(
        (o) => o.nombre.toUpperCase() === transporteData.operador?.toUpperCase()
      );
      const lineaEsDraft = !!transporteData.lineaTransporte && !lineaEnCatalog;
      const operadorEsDraft = !!transporteData.operador && !operadorEnCatalog;

      if (lineaEsDraft || operadorEsDraft) {
        try {
          await fetch(`${baseUrl}/drafts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              bitacora_id: bitacora._id,
              bitacora_num_id: bitacora.bitacora_id,
              transporte_id: newId,
              cliente: bitacora.cliente,
              lineaTransporte: transporteData.lineaTransporte,
              lineaTransporte_es_draft: lineaEsDraft,
              operador: transporteData.operador,
              operador_es_draft: operadorEsDraft,
              creado_por: `${user.firstName} ${user.lastName}`,
            }),
          });
          if (onDraftCreated) onDraftCreated();
        } catch (err) {
          console.error("Error creating draft:", err);
        }
      }
    }

    addTransporte(newTransporte, bitacora._id);

    // Reset form
    setTransporteData({
      tracto: {eco: "", placa: "", marca: "", modelo: "", color: "", tipo: ""},
      remolque: {eco: "", placa: "", color: "", capacidad: "", sello: ""},
      lineaTransporte: "",
      operador: "",
      telefono: "",
      gpsUnits: [],
    });

    setSelectedGpsUnits([]);
    setGpsSearchTerm(""); // Limpiar búsqueda
    setSearchTerm("");
    setDraftLineaText("");
    setDraftOperadorText("");
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
                <Form.Label>Seleccionar unidades Wialon (múltiples)</Form.Label>

                {/* Barra de búsqueda */}
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fa fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por nombre o ID..."
                      value={gpsSearchTerm}
                      onChange={(e) => setGpsSearchTerm(e.target.value)}
                    />
                    {gpsSearchTerm && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setGpsSearchTerm("")}>
                        <i className="fa fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Controles de selección */}
                {filteredGpsUnits.length > 0 && (
                  <div className="mb-2 d-flex justify-content-between align-items-center">
                    <small className="text-muted">{filteredGpsUnits.length} GPS encontrados</small>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={handleSelectAllFiltered}>
                      {filteredGpsUnits.every((unit) =>
                        selectedGpsUnits.some((selected) => selected.id === unit.id)
                      )
                        ? "Deseleccionar todos"
                        : "Seleccionar todos"}
                    </button>
                  </div>
                )}

                {/* Lista de GPS con mejor diseño */}
                <div
                  className="gps-units-selection"
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    border: "1px solid #dee2e6",
                    borderRadius: "0.375rem",
                    padding: "0",
                  }}>
                  {units.length === 0 ? (
                    <div className="p-3 text-muted text-center">
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Cargando unidades...
                    </div>
                  ) : filteredGpsUnits.length === 0 ? (
                    <div className="p-3 text-muted text-center">
                      <i className="fa fa-search me-2"></i>
                      No se encontraron GPS con "{gpsSearchTerm}"
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {filteredGpsUnits.map((unit) => {
                        const isSelected = selectedGpsUnits.some((u) => u.id === unit.id);
                        return (
                          <div
                            key={unit.id}
                            className={`list-group-item list-group-item-action d-flex align-items-center ${
                              isSelected ? "active" : ""
                            }`}
                            style={{cursor: "pointer", border: "none"}}
                            onClick={() => handleGpsUnitToggle(unit)}>
                            <div className="form-check me-3">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleGpsUnitToggle(unit)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{unit.name}</div>
                              <small className="text-muted">ID: {unit.id}</small>
                            </div>
                            {isSelected && (
                              <div className="text-success">
                                <i className="fa fa-check-circle"></i>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Resumen de selección */}
                {selectedGpsUnits.length > 0 && (
                  <div className="mt-3 p-2 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <strong>{selectedGpsUnits.length}</strong> GPS seleccionados
                      </small>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setSelectedGpsUnits([])}>
                        Limpiar selección
                      </button>
                    </div>
                    <div className="mt-2">
                      <div className="d-flex flex-wrap gap-1">
                        {selectedGpsUnits.map((unit) => (
                          <span
                            key={unit.id}
                            className="badge bg-primary"
                            style={{fontSize: "0.75rem"}}>
                            {unit.name}
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-1"
                              style={{fontSize: "0.5rem"}}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGpsUnitToggle(unit);
                              }}></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Form.Group>
            )}

            {(idMethod === "automatic" || idMethod === "manual") && (
              <Form.Group className="mb-3">
                <Form.Label>ID generado</Form.Label>
                <Form.Control
                  type="text"
                  value={idMethod === "automatic" ? generateTransporteId() : "(ID en blanco)"}
                  disabled
                />
                <Form.Text className="text-muted">
                  Formato: T{String(transportes.length + 1).padStart(3, "0")}_
                  {transporteData.tracto.placa || "N/A"}
                </Form.Text>
              </Form.Group>
            )}
          </Tab>
        )}

        {roleData?.tracto?.create && (
          <Tab eventKey="tracto" title="TRACTO">
            <h5>Datos del Tracto</h5>
            {["eco", "placa", "marca", "modelo", "color", "tipo"].map((field) => (
              <Form.Group className="mb-3" key={field}>
                <Form.Label>{field.toUpperCase()} <span className="text-danger">*</span></Form.Label>
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
                <Form.Label>{field.toUpperCase()} <span className="text-danger">*</span></Form.Label>
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
              <Form.Label>Línea de Transporte <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="lineaTransporte"
                value={draftLineaText ? "" : transporteData.lineaTransporte}
                onChange={async (e) => {
                  const selectedLinea = e.target.value;
                  setDraftLineaText("");
                  setDraftOperadorText("");
                  setTransporteData((prev) => ({ ...prev, lineaTransporte: selectedLinea, operador: "" }));
                  setOperadores([]);
                  if (selectedLinea && selectedLinea !== "all") fetchOperadores(selectedLinea);
                }}
                required={!!roleData?.operador?.create && !draftLineaText}>
                <option value="">Selecciona una línea de transporte</option>
                {lineasTransporte.map((linea) => (
                  <option key={linea._id} value={linea.nombre}>
                    {linea.nombre}
                  </option>
                ))}
              </Form.Select>
              {roleData?.crear_draft_transporte && (
                <Form.Control
                  type="text"
                  className="mt-2"
                  value={draftLineaText}
                  placeholder="O escribe una línea nueva..."
                  onChange={async (e) => {
                    const val = e.target.value;
                    setDraftLineaText(val);
                    setDraftOperadorText("");
                    setTransporteData((prev) => ({ ...prev, lineaTransporte: val, operador: "" }));
                    setOperadores([]);
                    if (val) fetchOperadores(val);
                  }}
                />
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Operador <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="operador"
                value={draftOperadorText ? "" : transporteData.operador}
                onChange={(e) => {
                  setDraftOperadorText("");
                  setTransporteData((prev) => ({ ...prev, operador: e.target.value }));
                }}
                required={!!roleData?.operador?.create && !draftOperadorText}
                disabled={!transporteData.lineaTransporte}>
                <option value="">
                  {transporteData.lineaTransporte
                    ? "Selecciona un operador"
                    : "Selecciona una línea de transporte primero"}
                </option>
                {operadores.map((operador) => (
                  <option key={operador._id} value={operador.nombre}>
                    {operador.nombre}
                  </option>
                ))}
              </Form.Select>
              {roleData?.crear_draft_transporte && (
                <Form.Control
                  type="text"
                  className="mt-2"
                  value={draftOperadorText}
                  placeholder="O escribe un operador nuevo..."
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraftOperadorText(val);
                    setTransporteData((prev) => ({ ...prev, operador: val }));
                  }}
                />
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Teléfono <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="telefono"
                value={transporteData.telefono}
                onChange={handleChange}
                required={!!roleData?.operador?.create}
                isInvalid={!!phoneError}
              />
              {phoneError && (
                <Form.Control.Feedback type="invalid">{phoneError}</Form.Control.Feedback>
              )}
              <Form.Text className="text-muted">
                Formato: 1234567890 (exactamente 10 dígitos seguidos)
              </Form.Text>
            </Form.Group>
          </Tab>
        )}
      </Tabs>
    </ModalTemplate>
  );
};

export default CreateTransporteModal;
