import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";

const STORAGE_KEY = "placa-test-results";
const baseUrl = import.meta.env.VITE_BASE_URL;

/**
 * Read all saved plates from localStorage. Returns [] when missing or corrupt.
 */
const readSavedPlates = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Corrupt placa-test-results in localStorage, resetting.", e);
    return [];
  }
};

const writeSavedPlates = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const formatDate = (iso) => {
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
  if (value >= 85) {
    cls = "bg-success";
    label = "Alta";
  } else if (value >= 60) {
    cls = "bg-warning text-dark";
    label = "Media";
  }
  return (
    <span className={`badge ${cls}`}>
      {label} ({value.toFixed(1)}%)
    </span>
  );
};

const PlacaTestPage = () => {
  const { user, verifyToken, setUser } = useAuth();
  const { isSidebarCollapsed } = useSidebar();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState("");
  const [savedPlates, setSavedPlates] = useState([]);
  const [showRaw, setShowRaw] = useState(false);

  // Auth gate (matches the pattern used by other pages)
  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken();
        setUser(data);
      } catch (e) {
        console.log("Error verifying token:", e);
        navigate("/login");
      }
    };
    init();
  }, []);

  useEffect(() => {
    setSavedPlates(readSavedPlates());
  }, []);

  // Stop the camera stream when leaving the page
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  }, []);

  const openCamera = async () => {
    setError("");
    setOcrResult(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Tu navegador no soporta acceso a cámara.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOpen(true);
    } catch (e) {
      console.error("Camera error:", e);
      if (e?.name === "NotAllowedError") {
        setError("Permiso de cámara denegado. Habilítalo en el navegador.");
      } else if (e?.name === "NotFoundError") {
        setError("No se encontró ninguna cámara en este dispositivo.");
      } else {
        setError(e?.message || "No fue posible abrir la cámara.");
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => setCapturedDataUrl(event.target.result);
    reader.readAsDataURL(file);
    
    // Set blob
    setCapturedBlob(file);
    setOcrResult(null);
    setError("");
    stopCamera(); // Stop camera if running
  };

  const takePhoto = () => {
    setError("");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setError("La cámara aún no está lista, intenta otra vez.");
      return;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedDataUrl(dataUrl);
    setOcrResult(null);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("No fue posible capturar la imagen.");
          return;
        }
        setCapturedBlob(blob);
      },
      "image/jpeg",
      0.9
    );
    stopCamera();
  };

  const retake = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setOcrResult(null);
    setError("");
    openCamera();
  };

  const buildThumbnail = (sourceDataUrl) =>
    new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          const max = 200;
          const ratio = Math.min(max / img.width, max / img.height, 1);
          const tw = Math.round(img.width * ratio);
          const th = Math.round(img.height * ratio);
          const c = document.createElement("canvas");
          c.width = tw;
          c.height = th;
          const cx = c.getContext("2d");
          cx.drawImage(img, 0, 0, tw, th);
          resolve(c.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = () => resolve(null);
        img.src = sourceDataUrl;
      } catch {
        resolve(null);
      }
    });

  const readPlate = async () => {
    if (!capturedBlob) {
      setError("Primero toma una foto.");
      return;
    }
    setOcrLoading(true);
    setError("");
    setOcrResult(null);
    try {
      const fd = new FormData();
      fd.append("image", capturedBlob, "plate.jpg");
      const response = await fetch(`${baseUrl}/plates/test-scan`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.message || `Error ${response.status} al leer la placa.`);
        setOcrResult(data);
        return;
      }
      setOcrResult(data);
      if (!data.success) {
        setError(data.message || "OCR no disponible.");
      } else if (!data.plate) {
        setError("No se detectó ninguna placa en la imagen.");
      }
    } catch (e) {
      console.error("OCR error:", e);
      setError(e?.message || "Error al contactar el servicio OCR.");
    } finally {
      setOcrLoading(false);
    }
  };

  const savePlate = async () => {
    if (!ocrResult?.success || !ocrResult?.plate) return;
    const thumb = capturedDataUrl ? await buildThumbnail(capturedDataUrl) : null;
    const entry = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      plate: ocrResult.plate,
      confidence:
        typeof ocrResult.confidence === "number" ? ocrResult.confidence : null,
      createdAt: new Date().toISOString(),
      imagePreview: thumb,
    };
    const next = [entry, ...savedPlates];
    setSavedPlates(next);
    writeSavedPlates(next);
  };

  const deleteEntry = (id) => {
    const next = savedPlates.filter((p) => p.id !== id);
    setSavedPlates(next);
    writeSavedPlates(next);
  };

  const clearAll = () => {
    if (!savedPlates.length) return;
    if (!window.confirm("¿Borrar todas las placas guardadas?")) return;
    setSavedPlates([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!user) return <div>Cargando...</div>;

  const canTake = cameraOpen;
  const canRead = !!capturedBlob && !ocrLoading;
  const canSave = !!ocrResult?.success && !!ocrResult?.plate;

  return (
    <section id="placaTestPage" className="settings-page">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <div className="text-center w-100">
              <h1 className="fs-3 fw-semibold text-black m-0">Placa Test</h1>
              <small className="text-muted">
                Captura una foto, detecta la placa y guarda resultados localmente
              </small>
            </div>
          </div>

          <div className="container-fluid py-3">
            {error && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="fa fa-exclamation-triangle me-2"></i>
                <div>{error}</div>
              </div>
            )}

            <div className="row g-3">
              {/* Camera section */}
              <div className="col-12 col-lg-6">
                <div className="card h-100">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <span>
                      <i className="fa fa-camera me-2"></i>Cámara
                    </span>
                    <small className="text-muted">
                      {cameraOpen ? "En vivo" : capturedDataUrl ? "Foto capturada" : "Inactiva"}
                    </small>
                  </div>
                  <div className="card-body d-flex flex-column gap-2">
                    <div
                      className="bg-dark rounded d-flex align-items-center justify-content-center"
                      style={{ minHeight: 240, position: "relative" }}>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        style={{
                          width: "100%",
                          maxHeight: 360,
                          display: cameraOpen ? "block" : "none",
                          borderRadius: 6,
                        }}
                      />
                      {!cameraOpen && capturedDataUrl && (
                        <img
                          src={capturedDataUrl}
                          alt="Captura"
                          style={{ width: "100%", maxHeight: 360, borderRadius: 6 }}
                        />
                      )}
                      {!cameraOpen && !capturedDataUrl && (
                        <span className="text-light">
                          <i className="fa fa-video-slash me-2"></i>
                          Cámara cerrada
                        </span>
                      )}
                    </div>
                    <canvas ref={canvasRef} style={{ display: "none" }} />

                    <div className="d-flex flex-wrap gap-2">
                      {!cameraOpen && !capturedDataUrl && (
                        <>
                          <button className="btn btn-primary" onClick={openCamera}>
                            <i className="fa fa-video me-2"></i>Open Camera
                          </button>
                          <label className="btn btn-outline-primary">
                            <i className="fa fa-upload me-2"></i>Upload Image
                            <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
                          </label>
                        </>
                      )}
                      {cameraOpen && (
                        <>
                          <button
                            className="btn btn-success"
                            onClick={takePhoto}
                            disabled={!canTake}>
                            <i className="fa fa-camera me-2"></i>Take Photo
                          </button>
                          <button className="btn btn-outline-secondary" onClick={stopCamera}>
                            <i className="fa fa-stop me-2"></i>Cerrar
                          </button>
                        </>
                      )}
                      {!cameraOpen && capturedDataUrl && (
                        <button className="btn btn-outline-primary" onClick={retake}>
                          <i className="fa fa-redo me-2"></i>Retake
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* OCR / save section */}
              <div className="col-12 col-lg-6">
                <div className="card h-100">
                  <div className="card-header">
                    <i className="fa fa-magnifying-glass me-2"></i>Lectura OCR
                  </div>
                  <div className="card-body d-flex flex-column gap-3">
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-primary"
                        onClick={readPlate}
                        disabled={!canRead}>
                        {ocrLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"></span>
                            Leyendo...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-eye me-2"></i>Read Plate
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={savePlate}
                        disabled={!canSave}>
                        <i className="fa fa-floppy-disk me-2"></i>Save Plate
                      </button>
                    </div>

                    {ocrResult && (
                      <div className="border rounded p-3 bg-light">
                        {ocrResult.success && ocrResult.plate ? (
                          <>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="text-muted">Placa detectada:</span>
                              <span className="fs-4 fw-bold text-uppercase">
                                {ocrResult.plate}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted me-2">Confianza:</span>
                              <ConfidenceBadge value={ocrResult.confidence} />
                            </div>
                          </>
                        ) : (
                          <div className="text-muted">
                            <i className="fa fa-circle-info me-2"></i>
                            {ocrResult.message ||
                              (ocrResult.success ? "Sin placas detectadas" : "OCR no disponible")}
                          </div>
                        )}

                        <button
                          className="btn btn-link btn-sm p-0 mt-2"
                          onClick={() => setShowRaw((v) => !v)}>
                          {showRaw ? "Ocultar" : "Ver"} respuesta cruda
                        </button>
                        {showRaw && (
                          <pre
                            className="mt-2 mb-0 small"
                            style={{
                              maxHeight: 240,
                              overflow: "auto",
                              background: "#fff",
                              padding: 8,
                              borderRadius: 4,
                            }}>
                            {JSON.stringify(ocrResult, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}

                    {!ocrResult && !ocrLoading && (
                      <div className="text-muted small">
                        <i className="fa fa-circle-info me-2"></i>
                        Toma una foto y luego presiona <strong>Read Plate</strong>.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Saved list */}
            <div className="card mt-3">
              <div className="card-header d-flex align-items-center justify-content-between">
                <span>
                  <i className="fa fa-list me-2"></i>
                  Placas guardadas ({savedPlates.length})
                </span>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={clearAll}
                  disabled={!savedPlates.length}>
                  <i className="fa fa-trash me-2"></i>Clear saved plates
                </button>
              </div>
              <div className="card-body p-0">
                {savedPlates.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="fa fa-inbox fa-2x d-block mb-2"></i>
                    Aún no has guardado ninguna placa.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped mb-0 align-middle">
                      <thead>
                        <tr>
                          <th style={{ width: 90 }}>Foto</th>
                          <th>Placa</th>
                          <th>Confianza</th>
                          <th>Fecha</th>
                          <th className="text-end" style={{ width: 100 }}>
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedPlates.map((p) => (
                          <tr key={p.id}>
                            <td>
                              {p.imagePreview ? (
                                <img
                                  src={p.imagePreview}
                                  alt={p.plate}
                                  style={{
                                    width: 70,
                                    height: 50,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                  }}
                                />
                              ) : (
                                <span className="text-muted small">—</span>
                              )}
                            </td>
                            <td className="fw-bold text-uppercase">{p.plate}</td>
                            <td>
                              <ConfidenceBadge value={p.confidence} />
                            </td>
                            <td>{formatDate(p.createdAt)}</td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                title="Eliminar"
                                onClick={() => deleteEntry(p.id)}>
                                <i className="fa fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlacaTestPage;
