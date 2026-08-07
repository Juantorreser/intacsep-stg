import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import jsPDF from "jspdf";
import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
import {useAuth} from "../context/AuthContext";
import {useSidebar} from "../context/SidebarContext";
import {fetchClients, fetchLineasTransporte, fetchOperadores} from "../utils/api";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });

const formatTimeDifference = (current, previous) => {
  if (!previous) return "Primer evento";

  const diffMs = new Date(current).getTime() - new Date(previous).getTime();
  const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min despues`;
  }

  if (minutes === 0) {
    return `${hours} h despues`;
  }

  return `${hours} h ${minutes} min despues`;
};

const formatDeviation = (actual, planned) => {
  const diffMs = new Date(actual).getTime() - new Date(planned).getTime();
  const sign = diffMs >= 0 ? "+" : "−";
  const abs = Math.abs(diffMs);
  const totalMin = Math.round(abs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const t = h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
  return `${sign}${t}`;
};

const ReporteEventosPage = () => {
  const {user, verifyToken, setUser} = useAuth();
  const {isSidebarCollapsed, setIsMobileSidebarOpen} = useSidebar();
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const [roleData, setRoleData] = useState(null);
  const [clients, setClients] = useState([]);
  const [lineasTransporte, setLineasTransporte] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [bitacoras, setBitacoras] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingLineas, setLoadingLineas] = useState(false);
  const [loadingOperadores, setLoadingOperadores] = useState(false);
  const [loadingBitacoras, setLoadingBitacoras] = useState(false);
  const [loadingEventTypes, setLoadingEventTypes] = useState(false);
  const [isTipoEventosOpen, setIsTipoEventosOpen] = useState(false);
  const [filters, setFilters] = useState({
    cliente: "",
    operador: "",
    lineaTransporte: "",
    status: "",
    bitacoraId: "",
    tipoEventos: [],
  });

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken();
        setUser(data);
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        navigate("/login");
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!user?.role) return;

    const fetchRolePermissions = async () => {
      try {
        const response = await fetch(`${baseUrl}/roles/${user.role}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        setRoleData(data);

        if (!data?.reporte_eventos?.read) {
          navigate("/");
        }
      } catch (e) {
        console.log("Error fetching role permissions:", e);
      }
    };

    fetchRolePermissions();
  }, [user]);

  useEffect(() => {
    if (!roleData?.reporte_eventos?.read) return;

    const fetchClientsOnly = async () => {
      setLoadingClients(true);
      try {
        const clientsData = await fetchClients(roleData);
        setClients(clientsData);
      } catch (e) {
        console.log("Error fetching report filter options:", e);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClientsOnly();
  }, [roleData]);

  useEffect(() => {
    if (!roleData?.reporte_eventos?.read || !filters.cliente) {
      setLineasTransporte([]);
      return;
    }

    const fetchFilteredLineas = async () => {
      setLoadingLineas(true);
      try {
        const data = await fetchLineasTransporte(filters.cliente);
        setLineasTransporte(data);
      } finally {
        setLoadingLineas(false);
      }
    };

    fetchFilteredLineas();
  }, [filters.cliente, roleData]);

  useEffect(() => {
    if (!roleData?.reporte_eventos?.read || !filters.cliente) {
      setOperadores([]);
      return;
    }

    const fetchFilteredOperadores = async () => {
      setLoadingOperadores(true);
      try {
        const data = await fetchOperadores(filters.lineaTransporte || null);
        setOperadores(data);
      } finally {
        setLoadingOperadores(false);
      }
    };

    fetchFilteredOperadores();
  }, [filters.lineaTransporte, filters.cliente, roleData]);

  useEffect(() => {
    if (!roleData?.reporte_eventos?.read || !filters.cliente) {
      setEventTypes([]);
      return;
    }

    const fetchEventTypes = async () => {
      setLoadingEventTypes(true);
      try {
        const response = await fetch(`${baseUrl}/event_types`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) setEventTypes(await response.json());
      } catch (e) {
        console.log("Error fetching event types:", e);
        setEventTypes([]);
      } finally {
        setLoadingEventTypes(false);
      }
    };

    fetchEventTypes();
  }, [baseUrl, filters.cliente, roleData]);

  useEffect(() => {
    if (!roleData?.reporte_eventos?.read || !filters.cliente) {
      setBitacoras([]);
      return;
    }

    const fetchBitacoraOptions = async () => {
      setLoadingBitacoras(true);
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "300",
          sortField: "bitacora_id",
          sortOrder: "desc",
        });

        if (filters.cliente) {
          params.append("clienteFilter", filters.cliente);
        }

        if (filters.operador) {
          params.append("operadorFilter", filters.operador);
        }

        if (filters.status) {
          params.append("statusFilter", filters.status);
        }

        if (roleData?.client_access === "specific" && roleData.allowed_clients?.length) {
          const allowedClientNames = roleData.allowed_clients.map((client) => client.client_name);
          params.append("allowed_clients", allowedClientNames.join(","));
        }

        if (roleData?.ver_bitacoras_cerradas === false) {
          params.append("hideCerradas", "true");
        }

        const response = await fetch(`${baseUrl}/bitacoras?${params.toString()}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch bitacoras");
        }

        const data = await response.json();
        const filteredBitacoras = (data.bitacoras || []).filter((bitacora) => {
          if (!filters.lineaTransporte) return true;

          const hasTopLevelLine =
            (bitacora.linea_transporte || "").trim().toLowerCase() ===
            filters.lineaTransporte.trim().toLowerCase();

          const hasTransportLine = (bitacora.transportes || []).some(
            (transporte) =>
              (transporte.lineaTransporte || "").trim().toLowerCase() ===
              filters.lineaTransporte.trim().toLowerCase()
          );

          return hasTopLevelLine || hasTransportLine;
        });

        setBitacoras(filteredBitacoras);
      } catch (e) {
        console.log("Error fetching bitacora options:", e);
        setBitacoras([]);
      } finally {
        setLoadingBitacoras(false);
      }
    };

    fetchBitacoraOptions();
  }, [baseUrl, filters.cliente, filters.lineaTransporte, filters.operador, filters.status, roleData]);

  const tipoEventosRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (tipoEventosRef.current && !tipoEventosRef.current.contains(event.target)) {
        setIsTipoEventosOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleFilterChange = (e) => {
    const {name, value} = e.target;

    setFilters((prev) => {
      const next = {...prev, [name]: value};

      if (name === "cliente") {
        next.lineaTransporte = "";
        next.operador = "";
        next.status = "";
        next.bitacoraId = "";
        next.tipoEventos = [];
      }

      if (name === "lineaTransporte") {
        next.operador = "";
        next.bitacoraId = "";
      }

      if (name === "operador") {
        next.bitacoraId = "";
      }

      if (name === "status") {
        next.bitacoraId = "";
      }

      if (name === "tipoEventos") {
        const selectedValues = Array.from(e.target.selectedOptions, (option) => option.value);
        next.tipoEventos = selectedValues.includes("__ALL__")
          ? eventTypes.map((eventType) => eventType.evento)
          : selectedValues.filter((value) => value !== "__ALL__");
      }

      return next;
    });
  };

  const handleTipoEventoToggle = (value) => {
    setFilters((prev) => {
      const currentValues = prev.tipoEventos;

      if (value === "__ALL__") {
        const nextValues =
          currentValues.length === eventTypes.length ? [] : eventTypes.map((eventType) => eventType.evento);
        return {...prev, tipoEventos: nextValues};
      }

      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {...prev, tipoEventos: nextValues};
    });
  };

  const clientSelected = Boolean(filters.cliente);
  const allEventTypesSelected =
    eventTypes.length > 0 && filters.tipoEventos.length === eventTypes.length;
  const tipoEventosLabel = !clientSelected
    ? "Selecciona un cliente"
    : allEventTypesSelected
      ? "Todos"
      : filters.tipoEventos.length === 0
        ? "Selecciona tipos de evento"
        : filters.tipoEventos.length === 1
          ? filters.tipoEventos[0]
          : `${filters.tipoEventos.length} tipos seleccionados`;
  const selectedBitacora = bitacoras.find((bitacora) => bitacora.bitacora_id === filters.bitacoraId);
  // For "cerrada (e)" (edited) bitácoras, use edited_bitacora.eventos as fallback
  // when the root eventos array is empty.
  const selectedEventos =
    (selectedBitacora?.eventos?.length ? selectedBitacora.eventos : null)
    || selectedBitacora?.edited_bitacora?.eventos
    || [];
  const planDeEmbarqueEvento = selectedEventos.find(
    (e) => ["PLAN DE EMBARQUE", "PRESENCIA EN ORIGEN"].includes(e.nombre?.toUpperCase())
  );
  const filteredEvents = selectedBitacora
    ? [...selectedEventos]
        .filter((evento) => filters.tipoEventos.includes(evento.nombre))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];
  const timelineEvents = planDeEmbarqueEvento
    ? [planDeEmbarqueEvento, ...filteredEvents]
    : filteredEvents;

  const clearFilters = () => {
    setFilters({
      cliente: "",
      operador: "",
      lineaTransporte: "",
      status: "",
      bitacoraId: "",
      tipoEventos: [],
    });
  };

  const handlePrintPDF = async () => {
    if (!selectedBitacora || timelineEvents.length === 0) return;

    // Load logo
    let logoDataUrl = null;
    try {
      const resp = await fetch("/logo1.png");
      const blob = await resp.blob();
      logoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (_) { /* logo is optional */ }

    const doc = new jsPDF({orientation: "portrait", unit: "mm", format: "a4"});
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentW = pageW - margin * 2;
    let y = 0;

    const footerH = 10;
    const usableBottom = pageH - footerH - 6;

    const addPage = () => {
      doc.addPage();
      y = margin;
    };

    const checkPageBreak = (needed = 10) => {
      if (y + needed > usableBottom) addPage();
    };

    // Helper: draw a label+value pair
    const drawField = (label, value, x, fy, labelW = 22) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), x, fy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(String(value || "—"), x + labelW, fy);
    };

    // Helper: section title
    const sectionTitle = (text, yPos) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(text, margin, yPos);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos + 1.5, margin + contentW, yPos + 1.5);
    };

    // ── Header bar ──────────────────────────────────────────────
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageW, 22, "F");
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", margin, 3, 16, 16);
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Eventos", logoDataUrl ? margin + 20 : margin, 14);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generado el ${new Date().toLocaleString("es-MX", {dateStyle: "short", timeStyle: "short"})}`,
      pageW - margin, 14, {align: "right"}
    );
    y = 28;

    // ── Bitácora title ───────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text(`Bitácora #${selectedBitacora.bitacora_id}`, margin, y);
    y += 8;

    // ── General info (2-col grid) ────────────────────────────────
    sectionTitle("Información General", y);
    y += 6;

    const bit = selectedBitacora;
    const col2W = contentW / 2;

    // For "cerrada (e)" (edited) bitácoras, eventos may live in root or edited_bitacora.
    // Use whichever has content as the source of truth.
    const bitEventos = (bit.eventos?.length ? bit.eventos : null)
      || bit.edited_bitacora?.eventos
      || [];

    // Derive plan/presence fields from the source event metadata
    const planEvento = bitEventos.find(
      (e) => ["PLAN DE EMBARQUE", "PRESENCIA EN ORIGEN"].includes(e.nombre?.toUpperCase())
    );
    const citaCarga  = bit.planDeEmbarque?.citaCarga  ?? planEvento?.metadata?.citaCarga;
    const horaSalida = bit.planDeEmbarque?.horaSalida ?? planEvento?.metadata?.horaSalida;

    // Derive inicio/final from evento transportes (same logic as BitacoraDetail)
    const validacionEvento = bitEventos.find(
      (e) => e.nombre?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "validacion"
    );
    const cierreEvento = bitEventos.find(
      (e) => e.nombre?.toLowerCase() === "cierre de servicio"
    );
    const inicioMonitoreo = validacionEvento?.transportes?.[0]?.inicioMonitoreo || bit.inicioMonitoreo;
    const finalMonitoreo  = cierreEvento?.transportes?.[0]?.finalMonitoreo     || bit.finalMonitoreo;

    // For edited bitácoras, origen/destino may be stored as plain name strings rather
    // than ObjectIds, so origen_nombre enrichment can fail → fall back to raw field.
    const origenDisplay  = bit.origen_nombre  || bit.origen  || "";
    const destinoDisplay = bit.destino_nombre || bit.destino || "";

    const generalRows = [
      ["Folio Servicio",   bit.folio_servicio,                              "Estatus",         (bit.status || "").toUpperCase()],
      ["Cliente",          bit.cliente,                                     "Tipo Monitoreo",  bit.monitoreo],
      ["Origen",           origenDisplay,                                   "Destino",         destinoDisplay],
      ["Cita de Carga",    citaCarga  ? formatDateTime(citaCarga)  : null,  "Inicio Monitoreo", inicioMonitoreo ? formatDateTime(inicioMonitoreo) : null],
      ["Hora de Salida",   horaSalida ? formatDateTime(horaSalida) : null,  "Final Monitoreo",  finalMonitoreo  ? formatDateTime(finalMonitoreo)  : null],
    ];

    generalRows.forEach(([l1, v1, l2, v2]) => {
      checkPageBreak(8);
      drawField(l1, v1, margin,           y, 26);
      drawField(l2, v2, margin + col2W,   y, 28);
      y += 8;
    });

    y += 4;

    // ── Timeline ─────────────────────────────────────────────────
    checkPageBreak(16);
    sectionTitle("Timeline de eventos", y);
    y += 5;

    if (timelineEvents.length >= 2) {
      const diffMs =
        new Date(timelineEvents[timelineEvents.length - 1].createdAt) -
        new Date(timelineEvents[0].createdAt);
      const totalMin = Math.max(0, Math.round(diffMs / 60000));
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      const durationLabel = h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(`${durationLabel} en total`, margin, y + 4);
      y += 9;
    } else {
      y += 4;
    }

    const dotX = margin + 3;
    const textX = margin + 10;

    timelineEvents.forEach((evento, index) => {
      const isLast = index === timelineEvents.length - 1;
      const prevTime = index > 0 ? timelineEvents[index - 1].createdAt : null;
      const desc = evento.descripcion || "";
      const descLines = desc ? doc.splitTextToSize(desc, contentW - 14).length : 0;
      const isInicioRecorrido = /inicio de recorrido/i.test(evento.nombre);
      const showDesvio = isInicioRecorrido && !!horaSalida;
      const blockH = 7 + (descLines > 0 ? descLines * 4 + 2 : 0) + (prevTime ? 5 : 0) + (showDesvio ? 5 : 0);
      checkPageBreak(blockH + 4);

      doc.setFillColor(59, 130, 246);
      doc.circle(dotX, y + 1.5, 2, "F");

      if (!isLast) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.line(dotX, y + 4, dotX, y + blockH + 2);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text(evento.nombre, textX, y + 2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(formatDateTime(evento.createdAt), pageW - margin, y + 2, {align: "right"});
      y += 6;

      if (prevTime) {
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "italic");
        doc.text(`+ ${formatTimeDifference(evento.createdAt, prevTime)}`, textX, y);
        y += 5;
      }

      if (showDesvio) {
        doc.setFontSize(7.5);
        doc.setTextColor(180, 130, 0);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Plan: ${formatDateTime(horaSalida)}  ·  Desfase: ${formatDeviation(evento.createdAt, horaSalida)}`,
          textX, y
        );
        y += 5;
      }

      if (desc) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(desc, contentW - 14);
        doc.text(lines, textX, y);
        y += lines.length * 4 + 2;
      }

      y += 3;
    });

    // ── Footer on every page ─────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(241, 245, 249);
      doc.rect(0, pageH - footerH, pageW, footerH, "F");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text("Intacsep — Reporte de Eventos", margin, pageH - 3.5);
      doc.text(`Página ${p} de ${totalPages}`, pageW - margin, pageH - 3.5, {align: "right"});
    }

    doc.save(`reporte-eventos-${bit.bitacora_id}.pdf`);
  };

  return (
    <section id="reporteEventosPage" className="settings-page">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>

        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <PageHeader
            title="Dashboard - Reporte Eventos"
            onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          />

          {roleData?.reporte_eventos?.read && (
            <div className="settings-content">
              <div className="reporte-eventos-panel">
                <div className="reporte-eventos-panel__header">
                  <div>
                    <h5 className="mb-1">Filtros</h5>
                    <p className="text-muted mb-0">
                      Selecciona cliente, operador, linea, bitacora y tipo de evento.
                    </p>
                  </div>

                  <button type="button" className="reporte-clear-btn" onClick={clearFilters}>
                    <i className="fas fa-times"></i>
                    Limpiar
                  </button>
                </div>

                <div className="reporte-eventos-grid reporte-eventos-grid--top">
                  <div className="reporte-field">
                    <label htmlFor="reporte-cliente" className="reporte-field__label">Cliente</label>
                    {loadingClients ? (
                      <div className="reporte-skeleton" />
                    ) : (
                      <select
                        id="reporte-cliente"
                        className="form-select reporte-field__control"
                        name="cliente"
                        value={filters.cliente}
                        onChange={handleFilterChange}>
                        <option value="">Selecciona un cliente</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client.razon_social}>
                            {client.razon_social}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="reporte-field">
                    <label htmlFor="reporte-operador" className="reporte-field__label">Operador</label>
                    {loadingOperadores ? (
                      <div className="reporte-skeleton" />
                    ) : (
                      <select
                        id="reporte-operador"
                        className="form-select reporte-field__control"
                        name="operador"
                        value={filters.operador}
                        onChange={handleFilterChange}
                        disabled={!clientSelected}>
                        <option value="">Todos los operadores</option>
                        {operadores.map((operador) => (
                          <option key={operador._id || operador.nombre} value={operador.nombre}>
                            {operador.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="reporte-field">
                    <label htmlFor="reporte-linea" className="reporte-field__label">Linea de transporte</label>
                    {loadingLineas ? (
                      <div className="reporte-skeleton" />
                    ) : (
                      <select
                        id="reporte-linea"
                        className="form-select reporte-field__control"
                        name="lineaTransporte"
                        value={filters.lineaTransporte}
                        onChange={handleFilterChange}
                        disabled={!clientSelected}>
                        <option value="">Todas las lineas de transporte</option>
                        {lineasTransporte.map((linea) => (
                          <option key={linea._id || linea.nombre} value={linea.nombre}>
                            {linea.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="reporte-field">
                    <label htmlFor="reporte-status" className="reporte-field__label">Estatus de bitácora</label>
                    <select
                      id="reporte-status"
                      className="form-select reporte-field__control"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      disabled={!clientSelected}>
                      <option value="">Todos los estatus</option>
                      <option value="nueva">Nueva</option>
                      <option value="creada">Creada</option>
                      <option value="plan de embarque">Plan de embarque</option>
                      <option value="validada">Validada</option>
                      <option value="iniciada">Iniciada</option>
                      <option value="finalizada">Finalizada</option>
                      <option value="cerrada">Cerrada</option>
                    </select>
                  </div>
                </div>

                <div className="reporte-eventos-grid reporte-eventos-grid--bottom">
                  <div className="reporte-field reporte-field--wide">
                    <label htmlFor="reporte-bitacora" className="reporte-field__label">Bitacora ID</label>
                    {loadingBitacoras ? (
                      <div className="reporte-skeleton" />
                    ) : (
                      <select
                        id="reporte-bitacora"
                        className="form-select reporte-field__control"
                        name="bitacoraId"
                        value={filters.bitacoraId}
                        onChange={handleFilterChange}
                        disabled={!clientSelected}>
                        <option value="">Todas las bitacoras</option>
                        {bitacoras.map((bitacora) => (
                          <option key={bitacora._id} value={bitacora.bitacora_id}>
                            {bitacora.bitacora_id} - {bitacora.cliente}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="reporte-field">
                    <label htmlFor="reporte-tipo-evento" className="reporte-field__label">Tipos de evento</label>
                    {loadingEventTypes ? (
                      <div className="reporte-skeleton" />
                    ) : (
                    <div
                      ref={tipoEventosRef}
                      className={`reporte-multiselect ${!clientSelected ? "is-disabled" : ""} ${
                        isTipoEventosOpen ? "is-open" : ""
                      }`}>
                      <button
                        type="button"
                        id="reporte-tipo-evento"
                        className="reporte-multiselect__trigger"
                        onClick={() => clientSelected && setIsTipoEventosOpen((prev) => !prev)}
                        disabled={!clientSelected}>
                        <span className="reporte-multiselect__label">{tipoEventosLabel}</span>
                        <i className={`fas fa-chevron-${isTipoEventosOpen ? "up" : "down"}`}></i>
                      </button>

                      {isTipoEventosOpen && (
                        <div className="reporte-multiselect__menu">
                          <label className="reporte-multiselect__option">
                            <input
                              type="checkbox"
                              checked={allEventTypesSelected}
                              onChange={() => handleTipoEventoToggle("__ALL__")}
                            />
                            <span>Todos</span>
                          </label>

                          {eventTypes.map((eventType) => (
                            <label key={eventType._id} className="reporte-multiselect__option">
                              <input
                                type="checkbox"
                                checked={filters.tipoEventos.includes(eventType.evento)}
                                onChange={() => handleTipoEventoToggle(eventType.evento)}
                              />
                              <span>{eventType.evento}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                </div>

                {filters.bitacoraId && filters.tipoEventos.length > 0 && (
                  <div className="reporte-eventos-timeline">
                    <div className="reporte-eventos-timeline__header">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3 flex-wrap">
                          <h5 className="mb-0">Timeline de eventos</h5>
                        {timelineEvents.length >= 2 && (() => {
                          const diffMs = new Date(timelineEvents[timelineEvents.length - 1].createdAt) - new Date(timelineEvents[0].createdAt);
                          const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
                          const hours = Math.floor(totalMinutes / 60);
                          const minutes = totalMinutes % 60;
                          const label = hours === 0
                            ? `${minutes} min`
                            : minutes === 0
                              ? `${hours} h`
                              : `${hours} h ${minutes} min`;
                          return (
                            <span className="text-muted" style={{fontSize: "0.8rem"}}>
                              {label} en total
                            </span>
                          );
                        })()}
                        </div>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          title="Exportar PDF"
                          onClick={handlePrintPDF}>
                          <i className="fas fa-file-pdf"></i>
                        </button>
                      </div>
                      <p className="text-muted mb-0 mt-1">
                        Bitacora {filters.bitacoraId} con {timelineEvents.length} evento
                        {timelineEvents.length === 1 ? "" : "s"} filtrado
                        {timelineEvents.length === 1 ? "" : "s"}.
                      </p>
                    </div>

                    {timelineEvents.length > 0 ? (
                      <div className="reporte-timeline">
                        {timelineEvents.map((evento, index) => (
                          <div key={evento._id || `${evento.nombre}-${evento.createdAt}-${index}`} className="reporte-timeline__item">
                            <div className="reporte-timeline__rail">
                              <span className="reporte-timeline__dot"></span>
                              {index !== timelineEvents.length - 1 && <span className="reporte-timeline__line"></span>}
                            </div>

                            <div className="reporte-timeline__content">
                              <div className="reporte-timeline__top">
                                <h6 className="mb-0">{evento.nombre}</h6>
                                <span className="reporte-timeline__date">{formatDateTime(evento.createdAt)}</span>
                              </div>

                              <p className="reporte-timeline__description mb-2">
                                {evento.descripcion || "Sin descripcion"}
                              </p>

                              <span className="reporte-timeline__diff">
                                <i className="fas fa-clock"></i>
                                {formatTimeDifference(
                                  evento.createdAt,
                                  index > 0 ? timelineEvents[index - 1].createdAt : null
                                )}
                              </span>
                              {/inicio de recorrido/i.test(evento.nombre) &&
                                (selectedBitacora.planDeEmbarque?.horaSalida ?? planDeEmbarqueEvento?.metadata?.horaSalida) && (
                                <span className="reporte-timeline__plan-diff">
                                  <i className="fas fa-calendar-check"></i>
                                  Plan: {formatDateTime(selectedBitacora.planDeEmbarque?.horaSalida ?? planDeEmbarqueEvento?.metadata?.horaSalida)}
                                  &nbsp;·&nbsp;
                                  Desfase: {formatDeviation(evento.createdAt, selectedBitacora.planDeEmbarque?.horaSalida ?? planDeEmbarqueEvento?.metadata?.horaSalida)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="reporte-eventos-empty">
                        No hay eventos del tipo seleccionado dentro de esta bitacora.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReporteEventosPage;
