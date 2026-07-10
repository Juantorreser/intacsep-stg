import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import PageHeader from "../PageHeader";
import ModalTemplate from "../ModalTemplate";
import DataTable from "../DataTable";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { fetchLineasTransporte } from "../../utils/api";

const baseUrl = import.meta.env.VITE_BASE_URL;

const MAX_PX = 1024;
const compressImage = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.85);
      } catch (err) {
        console.warn("Canvas compression failed:", err);
        resolve(file);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

const formatDate = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const ConfidenceBadge = ({ value }) => {
  if (value == null) return <span className="badge bg-secondary">N/A</span>;
  let cls = "bg-danger"; let label = "Baja";
  if (value >= 85) { cls = "bg-success"; label = "Alta"; }
  else if (value >= 60) { cls = "bg-warning text-dark"; label = "Media"; }
  return <span className={`badge ${cls}`}>{label} ({value.toFixed(1)}%)</span>;
};

const SwapBadge = ({ record }) => {
  if (record.hubo_cambio_remolque === null || record.hubo_cambio_remolque === undefined) {
    return record.placa_remolque_entrada
      ? <span className="badge bg-secondary">En patio</span>
      : <span className="text-muted small">—</span>;
  }
  if (record.hubo_cambio_remolque === false)
    return <span className="badge bg-success">Salió igual</span>;
  return <span className="badge bg-warning text-dark">Cambio remolque</span>;
};

const PlacaTestPage = () => {
  const { user, verifyToken, setUser } = useAuth();
  const { isSidebarCollapsed, setIsMobileSidebarOpen } = useSidebar();
  const navigate = useNavigate();

  const cameraInputRef = useRef(null);
  const remolqueCameraInputRef = useRef(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState("");
  const [savedRecords, setSavedRecords] = useState([]);
  const [remolqueRecords, setRemolqueRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [selectedRecordForSalida, setSelectedRecordForSalida] = useState(null);
  const [isSmartMode, setIsSmartMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("tractos");

  const [lineasTransporte, setLineasTransporte] = useState([]);
  const [roleData, setRoleData] = useState(null);
  const [formData, setFormData] = useState({
    placa: "",
    placaRemolque: "",
    lineaTransporte: "",
    hasRemolque: false,
    cliente: "",
    timestamp: "",
  });

  const isSmartModeRef = useRef(isSmartMode);
  const selectedRecordRef = useRef(selectedRecordForSalida);
  const savedRecordsRef = useRef(savedRecords);
  useEffect(() => { isSmartModeRef.current = isSmartMode; }, [isSmartMode]);
  useEffect(() => { selectedRecordRef.current = selectedRecordForSalida; }, [selectedRecordForSalida]);
  useEffect(() => { savedRecordsRef.current = savedRecords; }, [savedRecords]);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await verifyToken();
        setUser(userData);
        const roleRes = await fetch(`${baseUrl}/roles/${userData.role}`, { credentials: "include" });
        const role = await roleRes.json();
        setRoleData(role);
        if (!role?.control_patios?.read) { navigate("/"); return; }

        let lineas;
        if (role.client_access === "specific" && role.allowed_clients) {
          const promises = role.allowed_clients.map(ac => fetchLineasTransporte(ac.client_name));
          const results = await Promise.all(promises);
          lineas = Array.from(new Set(results.flat().map(l => JSON.stringify(l)))).map(s => JSON.parse(s));
        } else {
          lineas = await fetchLineasTransporte();
        }
        setLineasTransporte(lineas);
      } catch (e) {
        console.log("Error initializing:", e);
        navigate("/login");
      }
    };
    init();
  }, []);

  const loadSavedRecords = useCallback(async () => {
    try {
      const [tractorRes, remolqueRes] = await Promise.all([
        fetch(`${baseUrl}/control-patios`, { credentials: "include" }),
        fetch(`${baseUrl}/remolque-visitas`, { credentials: "include" }),
      ]);
      if (tractorRes.ok) {
        const data = await tractorRes.json();
        if (roleData?.client_access === "specific" && roleData?.allowed_clients) {
          const allowedNames = roleData.allowed_clients.map(ac => ac.client_name);
          setSavedRecords(data.filter(r => !r.cliente || allowedNames.includes(r.cliente)));
        } else {
          setSavedRecords(data);
        }
      }
      if (remolqueRes.ok) {
        const data = await remolqueRes.json();
        setRemolqueRecords(data);
      }
    } catch (e) {
      console.error("Error loading records:", e);
    }
  }, [roleData]);

  useEffect(() => {
    if (user && roleData) loadSavedRecords();
  }, [user, roleData, loadSavedRecords]);

  const remolquesEnPatio = remolqueRecords.filter(r => r.status === "En patio");

  const handleOpenModal = (record = null, mode = "salida") => {
    if (record && record._id) {
      if (mode === "edit") {
        setIsEditMode(true);
        setSelectedRecordForSalida(null);
        setIsSmartMode(false);
        setFormData({ placa: record.placa, placaRemolque: record.placa_remolque_entrada || "", lineaTransporte: record.linea_transporte, hasRemolque: false, cliente: record.cliente, timestamp: record.fecha_hora_inicio, _id: record._id });
      } else {
        setIsEditMode(false);
        setSelectedRecordForSalida(record);
        setIsSmartMode(false);
        setFormData({ placa: "", placaRemolque: "", lineaTransporte: record.linea_transporte, hasRemolque: false, cliente: record.cliente, timestamp: new Date().toISOString() });
      }
    } else {
      setIsEditMode(false);
      setSelectedRecordForSalida(null);
      setIsSmartMode(true);
      setFormData({ placa: "", placaRemolque: "", lineaTransporte: "", hasRemolque: false, cliente: "", timestamp: new Date().toISOString() });
    }
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setOcrResult(null);
    setError("");
    setShowModal(true);
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setOcrResult(null);
    setError("");
    setOcrLoading(true);
    const compressed = await compressImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCapturedDataUrl(ev.target.result);
    reader.readAsDataURL(compressed);
    setCapturedBlob(compressed);
    readPlate(compressed, "tractor");
  };

  const handleRemolqueImageSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setOcrLoading(true);
    const compressed = await compressImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCapturedDataUrl(ev.target.result);
    reader.readAsDataURL(compressed);
    readPlate(compressed, "remolque");
  };

  const readPlate = async (blob, target = "tractor") => {
    if (!blob) { setError("No hay imagen para procesar."); return; }
    setOcrLoading(true);
    if (target === "tractor") { setOcrResult(null); setError(""); }
    try {
      const fd = new FormData();
      fd.append("image", blob, "plate.jpg");
      const response = await fetch(`${baseUrl}/plates/test-scan`, { method: "POST", body: fd, credentials: "include" });
      const data = await response.json();
      if (!response.ok) { setError(data?.message || `Error ${response.status} al leer la placa.`); return; }
      if (!data.success || !data.plate) {
        setError("No se detectó ninguna placa en la imagen.");
        return;
      }
      const detectedPlate = data.plate.toUpperCase();
      if (target === "remolque") {
        setFormData(prev => ({ ...prev, placaRemolque: detectedPlate }));
        return;
      }
      // tractor
      if (target === "tractor") setOcrResult(data);
      if (isSmartModeRef.current) {
        const activeRecord = savedRecordsRef.current.find(r => r.placa.toUpperCase() === detectedPlate && !r.fecha_hora_salida);
        if (activeRecord) {
          setPendingExit(activeRecord);
        } else {
          setSelectedRecordForSalida(null);
          setFormData(prev => ({ ...prev, placa: detectedPlate }));
        }
      } else {
        const sel = selectedRecordRef.current;
        if (sel && detectedPlate !== sel.placa.toUpperCase()) {
          setError(`La placa detectada (${detectedPlate}) no coincide con la registrada (${sel.placa.toUpperCase()}).`);
        } else {
          setFormData(prev => ({ ...prev, placa: detectedPlate }));
        }
      }
    } catch (e) {
      console.error("OCR error:", e);
      setError(e?.message || "Error al contactar el servicio OCR.");
    } finally {
      setOcrLoading(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const [pendingExit, setPendingExit] = useState(null);

  const savePlate = async () => {
    if (!formData.placa || !formData.lineaTransporte) return;
    if (!isSalidaMode && formData.hasRemolque && !formData.placaRemolque) {
      setError("Si incluyes remolque, debes ingresar su placa.");
      return;
    }
    if (!isSalidaMode && formData.hasRemolque && formData.placaRemolque && formData.placa.toUpperCase() === formData.placaRemolque.toUpperCase()) {
      setError("La placa del remolque no puede ser igual a la placa del tracto.");
      return;
    }
    if (isSalidaMode && formData.placa.toUpperCase() !== selectedRecordForSalida.placa.toUpperCase()) {
      setError("La placa debe coincidir exactamente para registrar la salida.");
      return;
    }
    setSaving(true);
    try {
      if (isEditMode && formData._id) {
        const response = await fetch(`${baseUrl}/control-patios/${formData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placa: formData.placa, linea_transporte: formData.lineaTransporte }),
          credentials: "include",
        });
        if (response.ok) { loadSavedRecords(); setShowModal(false); }
        else { const e = await response.json(); setError(e.error || "Error al actualizar el registro."); }
      } else if (isSalidaMode) {
        const response = await fetch(`${baseUrl}/control-patios/${selectedRecordForSalida._id}/salida`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fecha_hora_salida: formData.timestamp }),
          credentials: "include",
        });
        if (!response.ok) { const e = await response.json(); setError(e.error || "Error al registrar la salida."); return; }

        // If checkbox checked, also close the remolque that matches the entered plate
        if (formData.hasRemolque && formData.placaRemolque) {
          const remolqueRecord = remolqueRecords.find(r =>
            r.placa.toUpperCase() === formData.placaRemolque.toUpperCase() && r.status === "En patio"
          );
          if (remolqueRecord) {
            await fetch(`${baseUrl}/remolque-visitas/${remolqueRecord._id}/salida`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fecha_hora_salida: formData.timestamp,
                linea_transporte: formData.lineaTransporte || null,
              }),
              credentials: "include",
            });
          }
        }

        loadSavedRecords(); setShowModal(false);
      } else {
        let clientToSave = "";
        if (roleData?.client_access === "specific" && roleData?.allowed_clients?.length > 0) {
          clientToSave = roleData.allowed_clients[0].client_name;
        }
        const response = await fetch(`${baseUrl}/control-patios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placa: formData.placa,
            placa_remolque: formData.hasRemolque && formData.placaRemolque ? formData.placaRemolque : null,
            remolque_linea_transporte: formData.hasRemolque ? formData.lineaTransporte : null,
            linea_transporte: formData.lineaTransporte,
            cliente: clientToSave,
            fecha_hora_inicio: formData.timestamp,
            confidence: typeof ocrResult?.confidence === "number" ? ocrResult.confidence : null,
          }),
          credentials: "include",
        });
        if (response.ok) { loadSavedRecords(); setShowModal(false); }
        else { const e = await response.json(); setError(e.error || "Error al guardar el registro."); }
      }
    } catch (e) {
      console.error("Error saving record:", e);
      setError("Error de conexión al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = (id, type) => { setIdToDelete({ id, type }); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    if (!idToDelete) return;
    try {
      const endpoint = idToDelete.type === "remolque" ? "remolque-visitas" : "control-patios";
      const response = await fetch(`${baseUrl}/${endpoint}/${idToDelete.id}`, { method: "DELETE", credentials: "include" });
      if (response.ok) { loadSavedRecords(); setShowDeleteModal(false); setIdToDelete(null); }
      else { const e = await response.json(); alert(e.error || "Error al eliminar el registro."); }
    } catch (e) {
      console.error("Error deleting entry:", e);
      alert("Error de conexión al eliminar.");
    }
  };

  const closeModal = () => {
    setCapturedDataUrl(null); setCapturedBlob(null); setOcrResult(null); setError("");
    setIsEditMode(false); setSelectedRecordForSalida(null);
    setShowModal(false);
  };

  if (!user) return <div>Cargando...</div>;

  const canSave = !!formData.placa;

  const isSalidaMode = !!selectedRecordForSalida;
  const modalTitle = isEditMode ? "Editar registro" : isSalidaMode ? "Registrar salida" : "Nuevo registro";
  const submitText = saving ? "Guardando..." : isEditMode ? "Actualizar" : isSalidaMode ? "Registrar salida" : "Registrar ingreso";

  const tractosEnPatio = savedRecords.filter(r => r.status === "En patio").length;
  const tractorRecords = savedRecords;
  const filteredTractores = tractorRecords.filter(r =>
    r.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.linea_transporte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.placa_remolque_entrada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.placa_remolque_salida?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredRemolques = remolqueRecords.filter(r =>
    r.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.tractor_entrada_placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.tractor_salida_placa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tractoColumns = [
    { key: "placa", header: "Placa", className: "fw-bold text-uppercase" },
    { key: "linea_transporte", header: "Línea", render: (row) => row.linea_transporte || <span className="text-muted">—</span> },
    { key: "remolque_entrada", header: "Remolque entrada", render: (row) => row.placa_remolque_entrada || <span className="text-muted">—</span> },
    { key: "remolque_salida", header: "Remolque salida", render: (row) => row.fecha_hora_salida ? (row.placa_remolque_salida || <span className="text-muted">Sin remolque</span>) : <span className="text-muted">—</span> },
    { key: "fecha_hora_inicio", header: "Entrada", render: (row) => formatDate(row.fecha_hora_inicio) },
    {
      key: "fecha_hora_salida",
      header: "Salida",
      render: (row) => row.fecha_hora_salida
        ? formatDate(row.fecha_hora_salida)
        : <button className="btn btn-sm btn-outline-warning" onClick={() => handleOpenModal(row)}>Marcar salida</button>,
    },
    { key: "status", header: "Estado", render: (row) => <span className={`badge ${row.status === "En patio" ? "bg-info" : "bg-success"}`}>{row.status}</span> },
    { key: "swap", header: "Cambio remolque", render: (row) => <SwapBadge record={row} /> },
  ];

  const remolqueColumns = [
    { key: "placa", header: "Placa", className: "fw-bold text-uppercase" },
    { key: "tracto_entrada", header: "Tracto entrada", render: (row) => row.tractor_entrada_placa || <span className="text-muted">—</span> },
    { key: "tracto_salida", header: "Tracto salida", render: (row) => row.fecha_hora_salida ? (row.tractor_salida_placa || <span className="text-muted">—</span>) : <span className="text-muted">—</span> },
    { key: "fecha_hora_entrada", header: "Entrada", render: (row) => formatDate(row.fecha_hora_entrada) },
    { key: "fecha_hora_salida", header: "Salida", render: (row) => row.fecha_hora_salida ? formatDate(row.fecha_hora_salida) : <span className="badge bg-secondary">En patio</span> },
    { key: "status", header: "Estado", render: (row) => <span className={`badge ${row.status === "En patio" ? "bg-info" : "bg-success"}`}>{row.status}</span> },
    { key: "cambio_tracto", header: "Cambio tracto", render: (row) => row.hubo_cambio_tractor === true ? <span className="badge bg-warning text-dark">Sí</span> : row.hubo_cambio_tractor === false ? <span className="badge bg-success">No</span> : <span className="text-muted small">—</span> },
  ];

  const tractoActions = [
    { icon: "fas fa-edit", className: "btn btn-primary", title: "Editar", onClick: (row) => handleOpenModal(row, "edit"), show: roleData?.control_patios?.update },
    { icon: "fas fa-trash", className: "btn btn-danger", title: "Eliminar", onClick: (row) => deleteEntry(row._id, "tractor"), show: roleData?.control_patios?.delete },
  ];
  const remolqueActions = [
    { icon: "fas fa-trash", className: "btn btn-danger", title: "Eliminar", onClick: (row) => deleteEntry(row._id, "remolque"), show: roleData?.control_patios?.delete },
  ];

  return (
    <section id="placaTestPage" className="settings-page">
      <style>{`
        @media (max-width: 768px) {
          .modal-dialog { margin: 0.5rem; }
          .modal-content { border-radius: 12px; }
          .btn { width: 100%; padding: 12px; margin-bottom: 5px; }
        }
        .remolque-choice-btn { border: 2px solid #dee2e6; border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.15s; background: #fff; }
        .remolque-choice-btn.active { border-color: #0d6efd; background: #f0f6ff; }
        .remolque-choice-btn:hover { border-color: #0d6efd; }
        .patio-stat-card {
          display: flex; align-items: center; gap: 8px;
          background: #fff; border-radius: 10px;
          padding: 0 14px;
          height: 38px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border: 1.5px solid #e5e7eb;
          white-space: nowrap;
        }
        .patio-stat-icon {
          width: 22px; height: 22px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; flex-shrink: 0;
        }
        .patio-stat-count { font-size: 0.95rem; font-weight: 700; line-height: 1; }
        .patio-stat-label { font-size: 0.72rem; color: #6c757d; font-weight: 500; }
        .patio-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .patio-search-wrap {
          position: relative; max-width: 380px;
        }
        .patio-search-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: #9ca3af; font-size: 13px; pointer-events: none;
        }
        .patio-search-input {
          width: 100%; height: 38px;
          padding: 0 36px 0 36px;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          background: #fff; font-size: 0.875rem; color: #111827;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .patio-search-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .patio-search-input::placeholder { color: #9ca3af; }
        .patio-search-clear {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #9ca3af; cursor: pointer;
          padding: 2px 4px; font-size: 12px; line-height: 1;
        }
        .patio-search-clear:hover { color: #374151; }
      `}</style>
      <div className="w-100 d-flex h-100 mt-0">
        <div className="sidebar-wrapper"><Sidebar /></div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <PageHeader title="Control de patios" onToggleSidebar={() => setIsMobileSidebarOpen(true)}>
            <button className="new-btn" onClick={() => handleOpenModal()} title="Nuevo registro">
              <i className="fa fa-plus"></i>
            </button>
          </PageHeader>

          <div className="settings-content">
            <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
              <div className="patio-stat-card">
                <div className="patio-stat-icon" style={{ background: "#e8f0fe" }}>
                  <i className="fa fa-truck" style={{ color: "#1a73e8" }}></i>
                </div>
                <span className="patio-stat-count" style={{ color: "#1a73e8" }}>
                  {savedRecords.filter(r => r.status === "En patio").length}
                </span>
                <span className="patio-dot" style={{ background: "#1a73e8" }}></span>
                <span className="patio-stat-label">Tractoes en patio</span>
              </div>

              <div className="patio-stat-card">
                <div className="patio-stat-icon" style={{ background: "#f3e8ff" }}>
                  <i className="fa fa-trailer" style={{ color: "#7c3aed" }}></i>
                </div>
                <span className="patio-stat-count" style={{ color: "#7c3aed" }}>
                  {remolquesEnPatio.length}
                </span>
                <span className="patio-dot" style={{ background: "#7c3aed" }}></span>
                <span className="patio-stat-label">Remolques en patio</span>
              </div>

              <div className="patio-stat-card">
                <div className="patio-stat-icon" style={{ background: "#fef9c3" }}>
                  <i className="fa fa-exchange-alt" style={{ color: "#d97706" }}></i>
                </div>
                <span className="patio-stat-count" style={{ color: "#d97706" }}>
                  {savedRecords.filter(r => r.hubo_cambio_remolque === true).length}
                </span>
                <span className="patio-stat-label">Cambios remolque</span>
              </div>

              <div className="patio-search-wrap ms-auto">
                <i className="fa fa-search patio-search-icon"></i>
                <input
                  type="text"
                  className="patio-search-input"
                  placeholder="Buscar placa tracto, remolque, línea..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="patio-search-clear" onClick={() => setSearchTerm("")} type="button">
                    <i className="fa fa-times"></i>
                  </button>
                )}
              </div>
            </div>
            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "tractos" ? "active" : ""}`}
                  onClick={() => setActiveTab("tractos")}
                >
                  <i className="fa fa-truck me-2"></i>
                  Tractos
                  <span className={`badge ms-2 ${activeTab === "tractos" ? "bg-primary" : "bg-secondary"}`}>
                    {tractosEnPatio} en patio
                  </span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "remolques" ? "active" : ""}`}
                  onClick={() => setActiveTab("remolques")}
                >
                  <i className="fa fa-trailer me-2"></i>
                  Remolques
                  <span className={`badge ms-2 ${activeTab === "remolques" ? "bg-primary" : "bg-secondary"}`}>
                    {remolqueRecords.filter(r => r.status === "En patio").length} en patio
                  </span>
                </button>
              </li>
            </ul>
            {activeTab === "tractos" ? (
              <DataTable
                data={filteredTractores}
                columns={tractoColumns}
                actions={tractoActions}
                maxHeight="calc(100vh - 340px)"
                emptyMessage="No se encontraron tractos."
              />
            ) : (
              <DataTable
                data={filteredRemolques}
                columns={remolqueColumns}
                actions={remolqueActions}
                maxHeight="calc(100vh - 340px)"
                emptyMessage="No se encontraron remolques."
              />
            )}
          </div>
        </div>
      </div>

      {/* Main entry/exit/edit modal */}
      <ModalTemplate
        show={showModal}
        title={modalTitle}
        onClose={closeModal}
        onSubmit={(e) => { e.preventDefault(); savePlate(); }}
        submitText={submitText}
        submitClass={isSalidaMode ? "btn btn-warning" : "btn btn-success"}
        submitDisabled={saving || (!canSave && !isEditMode) || (!isEditMode && !isSalidaMode && !formData.lineaTransporte)}
      >
        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
            <i className="fa fa-exclamation-triangle me-2"></i>
            <div>{error}</div>
          </div>
        )}

        {/* ── TRACTOR / ENTRY / EDIT FORM ── */}
        {true && (
          <div className="d-flex flex-column gap-4">
            {!isEditMode && (
              <div className="d-flex flex-wrap gap-2 justify-content-center border-bottom pb-3">
                <button type="button" className="btn btn-primary px-4" onClick={() => cameraInputRef.current.click()}>
                  <i className="fa fa-camera me-2"></i>{capturedDataUrl ? "Tomar otra foto" : "Tomar foto tracto"}
                </button>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleImageSelected} />
              </div>
            )}

            {capturedDataUrl && !isEditMode && (
              <div className="text-center">
                <img src={capturedDataUrl} alt="Captura" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, border: "2px solid #dee2e6" }} />
              </div>
            )}

            {ocrLoading && (
              <div className="d-flex align-items-center justify-content-center text-primary gap-2">
                <div className="spinner-border spinner-border-sm" role="status"></div>
                <span className="fw-bold">Analizando placa...</span>
              </div>
            )}

            <div className="row g-3">
              {/* 1. Placa tracto */}
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-end mb-2">
                  <label className="form-label fw-bold mb-0">Placa Tracto</label>
                  {ocrResult && <ConfidenceBadge value={ocrResult.confidence} />}
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control text-uppercase fw-bold"
                    placeholder="Ej. ABC-123"
                    value={formData.placa}
                    onChange={(e) => setFormData(prev => ({ ...prev, placa: e.target.value.toUpperCase() }))}
                    readOnly={isSalidaMode}
                  />
                  <span className="input-group-text"><i className="fa fa-truck"></i></span>
                </div>
                {!ocrResult && !ocrLoading && !isEditMode && !isSalidaMode && (
                  <div className="form-text text-muted">Toma una foto o escribe la placa manualmente.</div>
                )}
              </div>

              {/* 2. Línea de transporte (shared for tracto and remolque) */}
              <div className="col-12">
                <label className="form-label fw-bold">Línea de transporte *</label>
                <select
                  className="form-select"
                  value={formData.lineaTransporte}
                  onChange={(e) => setFormData(prev => ({ ...prev, lineaTransporte: e.target.value }))}
                  disabled={!!selectedRecordForSalida}
                  required
                >
                  <option value="">Selecciona una línea...</option>
                  {lineasTransporte.map((l) => (
                    <option key={l._id} value={l.nombre}>{l.nombre}</option>
                  ))}
                </select>
              </div>

              {/* 3. Remolque checkbox + 4. remolque photo/plate (entry and exit) */}
              {!isEditMode && (
                <div className="col-12">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="hasRemolqueCheck"
                      checked={formData.hasRemolque}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasRemolque: e.target.checked, placaRemolque: "" }))}
                    />
                    <label className="form-check-label fw-bold" htmlFor="hasRemolqueCheck">
                      <i className="fa fa-trailer me-2" style={{ color: "#7c3aed" }}></i>
                      {isSalidaMode ? "Registrar salida de remolque también" : "¿Tiene remolque?"}
                    </label>
                  </div>

                  {formData.hasRemolque && (() => {
                    const remolqueEnPatio = isSalidaMode && formData.placaRemolque
                      ? remolqueRecords.find(r => r.placa.toUpperCase() === formData.placaRemolque.toUpperCase() && r.status === "En patio")
                      : null;
                    const tractorDiferente = remolqueEnPatio &&
                      remolqueEnPatio.tractor_entrada_placa &&
                      remolqueEnPatio.tractor_entrada_placa.toUpperCase() !== selectedRecordForSalida?.placa?.toUpperCase();
                    return (
                      <div className="mt-3 p-3 rounded" style={{ background: "#f8f5ff", border: "1.5px solid #ddd6fe" }}>
                        <div className="d-flex justify-content-between align-items-end mb-2">
                          <label className="form-label fw-bold mb-0 small">Placa Remolque *</label>
                          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => remolqueCameraInputRef.current.click()}>
                            <i className="fa fa-camera me-1"></i>Foto remolque
                          </button>
                          <input ref={remolqueCameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleRemolqueImageSelected} />
                        </div>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control text-uppercase"
                            placeholder="Ej. R-456"
                            value={formData.placaRemolque}
                            onChange={(e) => setFormData(prev => ({ ...prev, placaRemolque: e.target.value.toUpperCase() }))}
                          />
                          <span className="input-group-text"><i className="fa fa-trailer"></i></span>
                        </div>
                        {tractorDiferente && (
                          <div className="alert alert-info d-flex align-items-start gap-2 mb-0 mt-3 py-2 px-3" style={{ fontSize: "0.85rem" }}>
                            <i className="fa fa-info-circle mt-1" style={{ flexShrink: 0 }}></i>
                            <span>
                              Este remolque entró con el tracto <strong>{remolqueEnPatio.tractor_entrada_placa}</strong> pero está siendo retirado por <strong>{selectedRecordForSalida?.placa}</strong>. Puedes continuar.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="col-12 border-top pt-2">
                <label className="form-label text-muted small mb-0">Fecha y Hora de registro</label>
                <div className="fw-bold">{formatDate(formData.timestamp)}</div>
              </div>
            </div>
          </div>
        )}

      </ModalTemplate>

      {/* Pending exit modal (smart mode) */}
      {pendingExit && (
        <ModalTemplate
          show={!!pendingExit}
          title="Placa en proceso"
          onClose={() => setPendingExit(null)}
          onSubmit={(e) => {
            e.preventDefault();
            setSelectedRecordForSalida(pendingExit);
            setFormData(prev => ({ ...prev, placa: pendingExit.placa, lineaTransporte: pendingExit.linea_transporte, cliente: pendingExit.cliente }));
            setPendingExit(null);
            setShowModal(true);
          }}
          submitClass="btn btn-primary"
          submitText="Registrar Salida"
        >
          <p>La placa <strong>{pendingExit.placa}</strong> ya se encuentra en proceso. ¿Desea registrar esta foto como salida?</p>
        </ModalTemplate>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <ModalTemplate
          show
          title="Confirmar Eliminación"
          onClose={() => setShowDeleteModal(false)}
          onSubmit={(e) => { e.preventDefault(); handleConfirmDelete(); }}
        >
          <p>¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.</p>
        </ModalTemplate>
      )}
    </section>
  );
};

export default PlacaTestPage;
