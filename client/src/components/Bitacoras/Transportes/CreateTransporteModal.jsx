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

  // Refs for Select2 elements
  const lineaTransporteSelectRef = useRef(null);
  const operadorSelectRef = useRef(null);

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

  // Initialize Select2 for create transporte modal dropdowns
  useEffect(() => {
    if (window.$ && window.$.fn.select2 && show) {
      const initializeCreateTransporteSelect2 = () => {
        console.log("Initializing Create Transporte Select2...");

        // Destroy existing Select2 instances first
        [lineaTransporteSelectRef, operadorSelectRef].forEach((ref) => {
          if (ref.current && window.$(ref.current).hasClass("select2-hidden-accessible")) {
            window.$(ref.current).select2("destroy");
          }
        });

        // Linea Transporte filter
        if (
          lineaTransporteSelectRef.current &&
          lineaTransporteSelectRef.current.offsetParent !== null
        ) {
          window
            .$(lineaTransporteSelectRef.current)
            .select2({
              placeholder: "Selecciona una línea de transporte",
              allowClear: true,
              width: "100%",
              language: {
                noResults: function () {
                  return "No se encontraron resultados";
                },
                searching: function () {
                  return "Buscando...";
                },
              },
            })
            .val(transporteData.lineaTransporte || "")
            .trigger("change")
            .off("change") // Remove any existing handlers
            .on("change", function (e) {
              const selectedLinea = e.target.value;
              console.log("LineaTransporte changed via Select2:", selectedLinea);

              // Update state without triggering re-render of this effect
              setTransporteData((prev) => ({
                ...prev,
                lineaTransporte: selectedLinea,
                operador: "", // Reset operador when lineaTransporte changes
              }));

              // Clear operadores immediately
              setOperadores([]);

              // Fetch operadores for the selected linea de transporte
              if (selectedLinea && selectedLinea !== "all") {
                console.log("Fetching operadores for:", selectedLinea);
                fetchOperadores(selectedLinea);
              }
            });
        }

        // Operador filter - only initialize if we have operadores
        if (
          operadorSelectRef.current &&
          operadorSelectRef.current.offsetParent !== null &&
          operadores.length > 0
        ) {
          window
            .$(operadorSelectRef.current)
            .select2({
              placeholder: transporteData.lineaTransporte
                ? "Selecciona un operador"
                : "Selecciona una línea de transporte primero",
              allowClear: true,
              width: "100%",
              language: {
                noResults: function () {
                  return "No se encontraron resultados";
                },
                searching: function () {
                  return "Buscando...";
                },
              },
            })
            .val(transporteData.operador || "")
            .trigger("change")
            .off("change") // Remove any existing handlers
            .on("change", function (e) {
              const selectedOperador = e.target.value;
              console.log("Operador changed via Select2:", selectedOperador);

              // Update state directly
              setTransporteData((prev) => ({
                ...prev,
                operador: selectedOperador,
              }));
            });
        }
      };

      // Initialize after a delay to ensure DOM is ready
      setTimeout(initializeCreateTransporteSelect2, 500);
    }

    // Cleanup function to destroy Select2 instances
    return () => {
      if (window.$ && window.$.fn.select2) {
        [lineaTransporteSelectRef, operadorSelectRef].forEach((ref) => {
          if (ref.current && window.$(ref.current).hasClass("select2-hidden-accessible")) {
            window.$(ref.current).select2("destroy");
          }
        });
      }
    };
  }, [show]); // Only depend on show to avoid infinite re-renders

  // Update operador Select2 when operadores change
  useEffect(() => {
    if (window.$ && window.$.fn.select2 && operadorSelectRef.current && operadores.length > 0) {
      const $operadorSelect = window.$(operadorSelectRef.current);

      // Only update if Select2 is already initialized
      if ($operadorSelect.hasClass("select2-hidden-accessible")) {
        // Update the options without re-initializing
        const currentValue = $operadorSelect.val();
        $operadorSelect.trigger("change");

        // If current value is not in new options, clear it
        const validOptions = operadores.map((op) => op.nombre);
        if (currentValue && !validOptions.includes(currentValue)) {
          $operadorSelect.val("").trigger("change");
          setTransporteData((prev) => ({...prev, operador: ""}));
        }
      }
    }
  }, [operadores]);

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

    // Skip if this is a Select2 element (they handle their own state)
    if (name === "lineaTransporte" || name === "operador") {
      return;
    }

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

  const handleSubmitTransporte = (e) => {
    e.preventDefault();

    // Obtener valores actuales de Select2 antes de enviar
    let currentLineaTransporte = transporteData.lineaTransporte;
    let currentOperador = transporteData.operador;

    if (window.$ && window.$.fn.select2) {
      // Obtener valor actual de línea de transporte desde Select2
      if (
        lineaTransporteSelectRef.current &&
        window.$(lineaTransporteSelectRef.current).hasClass("select2-hidden-accessible")
      ) {
        const lineaValue = window.$(lineaTransporteSelectRef.current).val();
        if (lineaValue) {
          currentLineaTransporte = lineaValue;
        }
      }

      // Obtener valor actual de operador desde Select2
      if (
        operadorSelectRef.current &&
        window.$(operadorSelectRef.current).hasClass("select2-hidden-accessible")
      ) {
        const operadorValue = window.$(operadorSelectRef.current).val();
        if (operadorValue) {
          currentOperador = operadorValue;
        }
      }
    }

    // Actualizar el estado con los valores actuales de Select2
    const finalTransporteData = {
      ...transporteData,
      lineaTransporte: currentLineaTransporte,
      operador: currentOperador,
    };

    console.log("Datos finales del transporte:", finalTransporteData);

    // Validar teléfono antes de enviar
    if (finalTransporteData.telefono && !validatePhoneNumber(finalTransporteData.telefono)) {
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
      ...finalTransporteData,
      gpsUnits: selectedGpsUnits.map((unit) => ({
        wialonId: unit.id,
        name: unit.name,
        data: {}, // Se llenará cuando se obtengan los datos
      })),
    };

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
    handleClose();
  };

  return (
    <>
      <style>{`
        /* Hide native select dropdowns when Select2 is initialized */
        .select2-hidden-accessible {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
        
        .select2-container--default .select2-selection--single {
          height: 38px;
          border: 1px solid #ced4da;
          border-radius: 0.375rem;
          background-color: #fff;
        }
        .select2-container--default .select2-selection--single .select2-selection__rendered {
          line-height: 36px;
          padding-left: 12px;
          color: #495057;
        }
        .select2-container--default .select2-selection--single .select2-selection__arrow {
          height: 36px;
          right: 10px;
        }
        .select2-container--default.select2-container--focus .select2-selection--single {
          border-color: #86b7fe;
          outline: 0;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        .select2-dropdown {
          border: 1px solid #ced4da;
          border-radius: 0.375rem;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
        .select2-container--default .select2-search--dropdown .select2-search__field {
          border: 1px solid #ced4da;
          border-radius: 0.375rem;
          padding: 8px 12px;
        }
        .select2-container--default .select2-results__option--highlighted[aria-selected] {
          background-color: #0d6efd !important;
          color: #ffffff !important;
        }
        .select2-container--default .select2-results__option[aria-selected=true] {
          background-color: #e9ecef !important;
          color: #495057 !important;
        }
        .select2-container--default .select2-results__option {
          color: #495057 !important;
          background-color: #ffffff !important;
        }
        .select2-container--default .select2-results__option:hover {
          background-color: #f8f9fa !important;
          color: #495057 !important;
        }
        .select2-container--default .select2-results__option:focus {
          background-color: #0d6efd !important;
          color: #ffffff !important;
        }
        .select2-dropdown {
          z-index: 99999 !important;
        }
        .modal .select2-dropdown {
          z-index: 99999 !important;
        }
        .select2-container {
          z-index: 99999 !important;
        }
      `}</style>
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
                      <small className="text-muted">
                        {filteredGpsUnits.length} GPS encontrados
                      </small>
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
                <Form.Select
                  ref={lineaTransporteSelectRef}
                  name="lineaTransporte"
                  value={transporteData.lineaTransporte}
                  required={!!roleData?.operador?.create}>
                  <option value="">Selecciona una línea de transporte</option>
                  {lineasTransporte.map((linea) => (
                    <option key={linea._id} value={linea.nombre}>
                      {linea.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Operador</Form.Label>
                <Form.Select
                  ref={operadorSelectRef}
                  name="operador"
                  value={transporteData.operador}
                  required={!!roleData?.operador?.create}
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
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono</Form.Label>
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
    </>
  );
};

export default CreateTransporteModal;
