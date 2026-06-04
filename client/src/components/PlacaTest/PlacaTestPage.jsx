import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import DataTable from "../DataTable";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { fetchLineasTransporte } from "../../utils/api";

const baseUrl = import.meta.env.VITE_BASE_URL;

const MAX_PX = 1600;
const compressImage = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const ConfidenceBadge = ({ value }) => {
  if (value == null) return <span className="badge bg-secondary">N/A</span>;
  let cls = "bg-danger";
  let label = "Baja";
  if (value >= 85) { cls = "bg-success"; label = "Alta"; }
  else if (value >= 60) { cls = "bg-warning text-dark"; label = "Media"; }
  return <span className={`badge ${cls}`}>{label} ({value.toFixed(1)}%)</span>;
};


const PlacaTestPage = () => {
  const { user, verifyToken, setUser } = useAuth();
  const { isSidebarCollapsed } = useSidebar();
  const navigate = useNavigate();

  const cameraInputRef = useRef(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState("");
  const [savedRecords, setSavedRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [selectedRecordForSalida, setSelectedRecordForSalida] = useState(null);
  const [isSmartMode, setIsSmartMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [lineasTransporte, setLineasTransporte] = useState([]);
  const [clients, setClients] = useState([]);
  const [roleData, setRoleData] = useState(null);
  const [formData, setFormData] = useState({
    placa: "",
    lineaTransporte: "",
    cliente: "",
    timestamp: "",
  });

  // Keep a ref for isSmartMode / selectedRecordForSalida to use inside callbacks
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

        const clientsData = await fetch(`${baseUrl}/clients`, { credentials: "include" }).then(r => r.json());
        setClients(clientsData);
      } catch (e) {
        console.log("Error verifying token or catalogs:", e);
        navigate("/login");
      }
    };
    init();
  }, []);

  const loadSavedRecords = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/control-patios`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        if (roleData?.client_access === "specific" && roleData?.allowed_clients) {
          const allowedNames = roleData.allowed_clients.map(ac => ac.client_name);
          setSavedRecords(data.filter(r => !r.cliente || allowedNames.includes(r.cliente)));
        } else {
          setSavedRecords(data);
        }
      }
    } catch (e) {
      console.error("Error loading records:", e);
    }
  }, [roleData]);

  useEffect(() => {
    if (user && roleData) loadSavedRecords();
  }, [user, roleData, loadSavedRecords]);

  const handleOpenModal = (record = null, mode = "salida") => {
    if (record && record._id) {
      if (mode === "edit") {
        setIsEditMode(true);
        setSelectedRecordForSalida(null);
        setIsSmartMode(false);
        setFormData({ placa: record.placa, lineaTransporte: record.linea_transporte, cliente: record.cliente, timestamp: record.fecha_hora_inicio, _id: record._id });
      } else {
        setIsEditMode(false);
        setSelectedRecordForSalida(record);
        setIsSmartMode(false);
        setFormData({ placa: "", lineaTransporte: record.linea_transporte, cliente: record.cliente, timestamp: new Date().toISOString() });
      }
    } else {
      setIsEditMode(false);
      setSelectedRecordForSalida(null);
      setIsSmartMode(true);
      setFormData({ placa: "", lineaTransporte: "", cliente: "", timestamp: new Date().toISOString() });
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

    readPlate(compressed);
  };

  const readPlate = async (blob) => {
    if (!blob) { setError("No hay imagen para procesar."); return; }
    setOcrLoading(true);
    setError("");
    setOcrResult(null);
    try {
      const fd = new FormData();
      fd.append("image", blob, "plate.jpg");
      const response = await fetch(`${baseUrl}/plates/test-scan`, { method: "POST", body: fd, credentials: "include" });
      const data = await response.json();
      if (!response.ok) { setError(data?.message || `Error ${response.status} al leer la placa.`); setOcrResult(data); return; }
      setOcrResult(data);
      if (!data.success) {
        setError(data.message || "OCR no disponible.");
      } else if (!data.plate) {
        setError("No se detectó ninguna placa en la imagen.");
      } else {
        const detectedPlate = data.plate.toUpperCase();
        if (isSmartModeRef.current) {
          const activeRecord = savedRecordsRef.current.find(r => r.placa.toUpperCase() === detectedPlate && !r.fecha_hora_salida);
          if (activeRecord) {
            setSelectedRecordForSalida(activeRecord);
            setFormData(prev => ({ ...prev, placa: detectedPlate, lineaTransporte: activeRecord.linea_transporte, cliente: activeRecord.cliente }));
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
      }
    } catch (e) {
      console.error("OCR error:", e);
      setError(e?.message || "Error al contactar el servicio OCR.");
    } finally {
      setOcrLoading(false);
    }
  };

  const savePlate = async () => {
    if (!formData.placa || !formData.lineaTransporte) return;
    if (selectedRecordForSalida && formData.placa.toUpperCase() !== selectedRecordForSalida.placa.toUpperCase()) {
      setError("La placa debe coincidir exactamente para registrar la salida.");
      return;
    }
    try {
      if (isEditMode && formData._id) {
        const response = await fetch(`${baseUrl}/control-patios/${formData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placa: formData.placa, linea_transporte: formData.lineaTransporte }),
          credentials: "include",
        });
        if (response.ok) { loadSavedRecords(); }
        else { const e = await response.json(); setError(e.error || "Error al actualizar el registro."); }
      } else if (selectedRecordForSalida) {
        const response = await fetch(`${baseUrl}/control-patios/${selectedRecordForSalida._id}/salida`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fecha_hora_salida: formData.timestamp }),
          credentials: "include",
        });
        if (response.ok) { loadSavedRecords(); }
        else { const e = await response.json(); setError(e.error || "Error al registrar la salida."); }
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
            linea_transporte: formData.lineaTransporte,
            cliente: clientToSave,
            fecha_hora_inicio: formData.timestamp,
            confidence: typeof ocrResult?.confidence === "number" ? ocrResult.confidence : null,
          }),
          credentials: "include",
        });
        if (response.ok) { loadSavedRecords(); }
        else { const e = await response.json(); setError(e.error || "Error al guardar el registro."); }
      }
    } catch (e) {
      console.error("Error saving record:", e);
      setError("Error de conexión al guardar.");
    }
  };

  const deleteEntry = (id) => { setIdToDelete(id); setShowDeleteModal(true); };

  const savePlateAndClose = async () => {
    await savePlate();
    if (!error) closeModal();
  };

  const handleConfirmDelete = async () => {
    if (!idToDelete) return;
    try {
      const response = await fetch(`${baseUrl}/control-patios/${idToDelete}`, { method: "DELETE", credentials: "include" });
      if (response.ok) { loadSavedRecords(); setShowDeleteModal(false); setIdToDelete(null); }
      else { const e = await response.json(); alert(e.error || "Error al eliminar el registro."); }
    } catch (e) {
      console.error("Error deleting entry:", e);
      alert("Error de conexión al eliminar.");
    }
  };

  const closeModal = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setOcrResult(null);
    setError("");
    setIsEditMode(false);
    setSelectedRecordForSalida(null);
    setShowModal(false);
  };

  if (!user) return <div>Cargando...</div>;

  const canSave = !!ocrResult?.success && !!ocrResult?.plate;

  const filteredRecords = savedRecords.filter(p =>
    p.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.linea_transporte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "placa", header: "Placa", className: "fw-bold text-uppercase" },
    { key: "linea_transporte", header: "Línea" },
    { key: "fecha_hora_inicio", header: "Entrada", render: (row) => formatDate(row.fecha_hora_inicio) },
    {
      key: "fecha_hora_salida",
      header: "Salida",
      render: (row) => row.fecha_hora_salida ? formatDate(row.fecha_hora_salida) : (
        <button className="btn btn-sm btn-outline-warning" onClick={() => handleOpenModal(row)}>Marcar salida</button>
      )
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => (
        <span className={`badge ${row.status === "En patio" ? "bg-info" : "bg-success"}`}>{row.status}</span>
      )
    },
  ];

  const actions = [
    { icon: "fas fa-edit", className: "btn btn-primary", title: "Editar", onClick: (row) => handleOpenModal(row, "edit"), show: roleData?.control_patios?.update },
    { icon: "fas fa-trash", className: "btn btn-danger", title: "Eliminar", onClick: (row) => deleteEntry(row._id), show: roleData?.control_patios?.delete },
  ];

  return (
    <section id="placaTestPage" className="settings-page">
      <style>{`
        @media (max-width: 768px) {
          .modal-dialog { margin: 0.5rem; }
          .modal-content { border-radius: 12px; }
          .btn { width: 100%; padding: 12px; margin-bottom: 5px; }
          .page-header { flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>
      <div className="w-100 d-flex h-100 mt-0">
        <div className="sidebar-wrapper"><Sidebar /></div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <div className="header-left">
              <h1>Control de patios</h1>
            </div>
            <div className="header-right">
              <button className="new-btn" onClick={() => handleOpenModal()} title="Nuevo registro">
                <i className="fa fa-plus"></i>
              </button>
            </div>
          </div>

          <div className="settings-content">
            <div className="d-flex mb-3">
              <div className="input-group input-group-sm shadow-sm" style={{ maxWidth: "400px" }}>
                <span className="input-group-text bg-white border-end-0">
                  <i className="fa fa-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Buscar por placa, línea o estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <DataTable
              data={filteredRecords}
              columns={columns}
              actions={actions}
              maxHeight="calc(100vh - 300px)"
              emptyMessage="No se encontraron registros en el patio."
            />
          </div>
        </div>
      </div>

      <ModalTemplate
        show={showModal}
        title={isEditMode ? "Editar registro" : "Nuevo registro"}
        onClose={closeModal}
        onSubmit={(e) => { e.preventDefault(); savePlateAndClose(); }}
        submitText={isEditMode ? "Actualizar registro" : "Guardar registro"}
        submitDisabled={(!canSave && !isEditMode) || !formData.lineaTransporte}
      >
        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
            <i className="fa fa-exclamation-triangle me-2"></i>
            <div>{error}</div>
          </div>
        )}

        <div className="d-flex flex-column gap-4">
          {!isEditMode && (
            <div className="d-flex flex-wrap gap-2 justify-content-center border-bottom pb-3">
              {/* capture="environment" opens the native camera app directly on mobile */}
              <label className="btn btn-primary px-4">
                <i className="fa fa-camera me-2"></i>{capturedDataUrl ? "Tomar otra foto" : "Tomar foto"}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleImageSelected} />
              </label>
            </div>
          )}

          {/* Captured image preview */}
          {capturedDataUrl && !isEditMode && (
            <div className="text-center">
              <img
                src={capturedDataUrl}
                alt="Captura"
                style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, border: "2px solid #dee2e6" }}
              />
            </div>
          )}

          {ocrLoading && (
            <div className="d-flex align-items-center justify-content-center text-primary gap-2">
              <div className="spinner-border spinner-border-sm" role="status"></div>
              <span className="fw-bold">Analizando placa...</span>
            </div>
          )}

          <div className="row g-3">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-end mb-2">
                <label className="form-label fw-bold mb-0">Placa</label>
                {ocrResult && <ConfidenceBadge value={ocrResult.confidence} />}
              </div>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control text-uppercase fw-bold bg-light"
                  value={formData.placa}
                  readOnly={!isEditMode}
                  onChange={isEditMode ? (e) => setFormData(prev => ({ ...prev, placa: e.target.value })) : undefined}
                />
                <span className="input-group-text bg-light">
                  <i className="fa fa-id-card"></i>
                </span>
              </div>
            </div>

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

            <div className="col-12 border-top pt-2">
              <label className="form-label text-muted small mb-0">Fecha y Hora de registro</label>
              <div className="fw-bold">{formatDate(formData.timestamp)}</div>
            </div>
          </div>
        </div>
      </ModalTemplate>

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
