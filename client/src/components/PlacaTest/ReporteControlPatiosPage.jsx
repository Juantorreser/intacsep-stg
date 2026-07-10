import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Sidebar from "../Sidebar";
import PageHeader from "../PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { fetchLineasTransporte } from "../../utils/api";

const baseUrl = import.meta.env.VITE_BASE_URL;

const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
};

const formatDuration = (ms) => {
  if (ms == null || ms < 0) return "—";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
};

const calcDuration = (entrada, salida) => {
  if (!entrada || !salida) return null;
  return new Date(salida).getTime() - new Date(entrada).getTime();
};

const SwapBadge = ({ record }) => {
  if (record.hubo_cambio_remolque === true)
    return <span className="badge bg-warning text-dark">Cambio remolque</span>;
  if (record.hubo_cambio_remolque === false)
    return <span className="badge bg-success">Salió igual</span>;
  if (record.placa_remolque_entrada && !record.fecha_hora_salida)
    return <span className="badge bg-secondary">En patio</span>;
  return <span className="text-muted small">—</span>;
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="col-6 col-md-3">
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
          style={{ width: 48, height: 48, background: color, flexShrink: 0 }}>
          <i className={`fa ${icon}`}></i>
        </div>
        <div>
          <div className="fs-4 fw-bold lh-1">{value}</div>
          <div className="text-muted small">{label}</div>
        </div>
      </div>
    </div>
  </div>
);

const ReporteControlPatiosPage = () => {
  const { user, verifyToken, setUser } = useAuth();
  const { isSidebarCollapsed, setIsMobileSidebarOpen } = useSidebar();
  const navigate = useNavigate();

  const [roleData, setRoleData] = useState(null);
  const [records, setRecords] = useState([]);
  const [remolqueRecords, setRemolqueRecords] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("camiones"); // "camiones" | "remolques"

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = useState({
    desde: toLocalDateStr(firstOfMonth),
    hasta: toLocalDateStr(today),
    cliente: "",
    linea: "",
    status: "",
    cambio: "", // "" | "true" | "false"
    placa: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await verifyToken();
        setUser(userData);
        const roleRes = await fetch(`${baseUrl}/roles/${userData.role}`, { credentials: "include" });
        const role = await roleRes.json();
        setRoleData(role);
        if (!role?.reporte_control_patios?.read) { navigate("/"); return; }

        let lineasData;
        if (role.client_access === "specific" && role.allowed_clients) {
          const results = await Promise.all(role.allowed_clients.map(ac => fetchLineasTransporte(ac.client_name)));
          lineasData = Array.from(new Set(results.flat().map(l => JSON.stringify(l)))).map(s => JSON.parse(s));
        } else {
          lineasData = await fetchLineasTransporte();
        }
        setLineas(lineasData);
        const clientsData = await fetch(`${baseUrl}/clients`, { credentials: "include" }).then(r => r.json());
        setClients(clientsData);
      } catch (e) {
        console.error(e);
        navigate("/login");
      }
    };
    init();
  }, []);

  const fetchRecords = useCallback(async () => {
    if (!roleData) return;
    setLoading(true);
    try {
      const [tractorRes, remolqueRes] = await Promise.all([
        fetch(`${baseUrl}/control-patios`, { credentials: "include" }),
        fetch(`${baseUrl}/remolque-visitas`, { credentials: "include" }),
      ]);

      let data = tractorRes.ok ? await tractorRes.json() : [];
      let remolqueData = remolqueRes.ok ? await remolqueRes.json() : [];

      // Client access filter
      if (roleData.client_access === "specific" && roleData.allowed_clients) {
        const allowed = roleData.allowed_clients.map(ac => ac.client_name);
        data = data.filter(r => !r.cliente || allowed.includes(r.cliente));
        remolqueData = remolqueData.filter(r => !r.cliente || allowed.includes(r.cliente));
      }

      // Date range
      const from = filters.desde ? new Date(filters.desde + "T00:00:00") : null;
      const to = filters.hasta ? new Date(filters.hasta + "T23:59:59") : null;
      if (from) {
        data = data.filter(r => new Date(r.fecha_hora_inicio) >= from);
        remolqueData = remolqueData.filter(r => new Date(r.fecha_hora_entrada) >= from);
      }
      if (to) {
        data = data.filter(r => new Date(r.fecha_hora_inicio) <= to);
        remolqueData = remolqueData.filter(r => new Date(r.fecha_hora_entrada) <= to);
      }

      if (filters.cliente) {
        data = data.filter(r => r.cliente === filters.cliente);
        remolqueData = remolqueData.filter(r => r.cliente === filters.cliente);
      }
      if (filters.linea) {
        data = data.filter(r => r.linea_transporte === filters.linea);
        remolqueData = remolqueData.filter(r => r.linea_transporte === filters.linea);
      }
      if (filters.status) {
        data = data.filter(r => r.status === filters.status);
        remolqueData = remolqueData.filter(r => r.status === filters.status);
      }
      if (filters.cambio !== "") {
        const val = filters.cambio === "true";
        data = data.filter(r => r.hubo_cambio_remolque === val);
      }
      if (filters.placa) {
        const term = filters.placa.toLowerCase();
        data = data.filter(r =>
          r.placa?.toLowerCase().includes(term) ||
          r.placa_remolque_entrada?.toLowerCase().includes(term) ||
          r.placa_remolque_salida?.toLowerCase().includes(term)
        );
        remolqueData = remolqueData.filter(r =>
          r.placa?.toLowerCase().includes(term) ||
          r.tractor_entrada_placa?.toLowerCase().includes(term) ||
          r.tractor_salida_placa?.toLowerCase().includes(term)
        );
      }

      setRecords(data);
      setRemolqueRecords(remolqueData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [roleData, filters]);

  useEffect(() => {
    if (roleData) fetchRecords();
  }, [roleData, fetchRecords]);

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  // Tractor stats
  const total = records.length;
  const enPatio = records.filter(r => r.status === "En patio").length;
  const finalizados = records.filter(r => r.status === "Finalizado").length;
  const conCambio = records.filter(r => r.hubo_cambio_remolque === true).length;
  const sinCambio = records.filter(r => r.hubo_cambio_remolque === false).length;
  const duraciones = records.map(r => calcDuration(r.fecha_hora_inicio, r.fecha_hora_salida)).filter(d => d != null && d > 0);
  const avgDuration = duraciones.length > 0 ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length) : null;

  // Remolque stats
  const remolqueTotal = remolqueRecords.length;
  const remolquesEnPatio = remolqueRecords.filter(r => r.status === "En patio").length;
  const conCambioTractor = remolqueRecords.filter(r => r.hubo_cambio_tractor === true).length;

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Reporte Control de Patios", 14, 15);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString("es-MX")}  |  Período: ${filters.desde} → ${filters.hasta}`, 14, 22);

    if (activeTab === "camiones") {
      doc.autoTable({
        startY: 28,
        head: [["Placa Camión", "Rem. Entrada", "Rem. Salida", "Cambio", "Línea", "Cliente", "Entrada", "Salida", "Duración", "Estado"]],
        body: records.map(r => {
          const dur = calcDuration(r.fecha_hora_inicio, r.fecha_hora_salida);
          return [
            r.placa,
            r.placa_remolque_entrada || "—",
            r.placa_remolque_salida || (r.fecha_hora_salida ? "Sin remolque" : "—"),
            r.hubo_cambio_remolque === true ? "Sí" : r.hubo_cambio_remolque === false ? "No" : "—",
            r.linea_transporte,
            r.cliente || "—",
            formatDate(r.fecha_hora_inicio),
            formatDate(r.fecha_hora_salida),
            formatDuration(dur),
            r.status,
          ];
        }),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [33, 37, 41] },
      });
    } else {
      doc.autoTable({
        startY: 28,
        head: [["Placa Remolque", "Camión entrada", "Camión salida", "Cambio camión", "Línea", "Entrada", "Salida", "Duración", "Estado"]],
        body: remolqueRecords.map(r => {
          const dur = calcDuration(r.fecha_hora_entrada, r.fecha_hora_salida);
          return [
            r.placa,
            r.tractor_entrada_placa || "—",
            r.tractor_salida_placa || (r.fecha_hora_salida ? "—" : "En patio"),
            r.hubo_cambio_tractor === true ? "Sí" : r.hubo_cambio_tractor === false ? "No" : "—",
            r.linea_transporte || "—",
            formatDate(r.fecha_hora_entrada),
            formatDate(r.fecha_hora_salida),
            formatDuration(dur),
            r.status,
          ];
        }),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [33, 37, 41] },
      });
    }

    doc.save(`reporte-control-patios-${filters.desde}-${filters.hasta}.pdf`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const tractorSheet = XLSX.utils.json_to_sheet(records.map(r => ({
      "Placa Camión": r.placa,
      "Remolque Entrada": r.placa_remolque_entrada || "—",
      "Remolque Salida": r.placa_remolque_salida || (r.fecha_hora_salida ? "Sin remolque" : "—"),
      "Cambio Remolque": r.hubo_cambio_remolque === true ? "Sí" : r.hubo_cambio_remolque === false ? "No" : "—",
      "Línea": r.linea_transporte,
      "Cliente": r.cliente || "—",
      "Entrada": formatDate(r.fecha_hora_inicio),
      "Salida": formatDate(r.fecha_hora_salida),
      "Duración": formatDuration(calcDuration(r.fecha_hora_inicio, r.fecha_hora_salida)),
      "Estado": r.status,
      "Confianza OCR": r.confidence != null ? `${r.confidence.toFixed(1)}%` : "N/A",
    })));
    XLSX.utils.book_append_sheet(wb, tractorSheet, "Camiones");

    const remolqueSheet = XLSX.utils.json_to_sheet(remolqueRecords.map(r => ({
      "Placa Remolque": r.placa,
      "Camión Entrada": r.tractor_entrada_placa || "—",
      "Camión Salida": r.tractor_salida_placa || "—",
      "Cambio Camión": r.hubo_cambio_tractor === true ? "Sí" : r.hubo_cambio_tractor === false ? "No" : "—",
      "Línea": r.linea_transporte || "—",
      "Cliente": r.cliente || "—",
      "Entrada": formatDate(r.fecha_hora_entrada),
      "Salida": formatDate(r.fecha_hora_salida),
      "Duración": formatDuration(calcDuration(r.fecha_hora_entrada, r.fecha_hora_salida)),
      "Estado": r.status,
    })));
    XLSX.utils.book_append_sheet(wb, remolqueSheet, "Remolques");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: "application/octet-stream" }), `reporte-patios-${filters.desde}-${filters.hasta}.xlsx`);
  };

  if (!user) return <div>Cargando...</div>;

  const visibleClients = roleData?.client_access === "specific" && roleData?.allowed_clients
    ? clients.filter(c => roleData.allowed_clients.some(ac => ac.client_name === c.nombre))
    : clients;

  return (
    <section className="settings-page">
      <div className="w-100 d-flex h-100 mt-0">
        <div className="sidebar-wrapper"><Sidebar /></div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <PageHeader
            title="Reporte Control de Patios"
            onToggleSidebar={() => setIsMobileSidebarOpen(true)}
            filters={
              <div className="card border-0 shadow-sm mb-0">
                <div className="card-body p-2">
                  <div className="row g-2 align-items-end">
                    <div className="col-6 col-md-auto">
                      <label className="form-label small fw-bold mb-1">Desde</label>
                      <input type="date" className="form-control form-control-sm"
                        value={filters.desde} onChange={e => setFilter("desde", e.target.value)} />
                    </div>
                    <div className="col-6 col-md-auto">
                      <label className="form-label small fw-bold mb-1">Hasta</label>
                      <input type="date" className="form-control form-control-sm"
                        value={filters.hasta} onChange={e => setFilter("hasta", e.target.value)} />
                    </div>
                    <div className="col-6 col-md-auto">
                      <label className="form-label small fw-bold mb-1">Placa</label>
                      <input type="text" className="form-control form-control-sm"
                        placeholder="Camión o remolque"
                        value={filters.placa}
                        onChange={e => setFilter("placa", e.target.value.toUpperCase())} />
                    </div>
                    {roleData?.client_access !== "specific" && (
                      <div className="col-6 col-md-auto">
                        <label className="form-label small fw-bold mb-1">Cliente</label>
                        <select className="form-select form-select-sm" value={filters.cliente} onChange={e => setFilter("cliente", e.target.value)}>
                          <option value="">Todos</option>
                          {visibleClients.map(c => <option key={c._id} value={c.nombre}>{c.nombre}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="col-6 col-md-auto">
                      <label className="form-label small fw-bold mb-1">Línea</label>
                      <select className="form-select form-select-sm" value={filters.linea} onChange={e => setFilter("linea", e.target.value)}>
                        <option value="">Todas</option>
                        {lineas.map(l => <option key={l._id} value={l.nombre}>{l.nombre}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-md-auto">
                      <label className="form-label small fw-bold mb-1">Estado</label>
                      <select className="form-select form-select-sm" value={filters.status} onChange={e => setFilter("status", e.target.value)}>
                        <option value="">Todos</option>
                        <option value="En patio">En patio</option>
                        <option value="Finalizado">Finalizado</option>
                      </select>
                    </div>
                    <div className="col-6 col-md-auto">
                      <label className="form-label small fw-bold mb-1">Cambio remolque</label>
                      <select className="form-select form-select-sm" value={filters.cambio} onChange={e => setFilter("cambio", e.target.value)}>
                        <option value="">Todos</option>
                        <option value="true">Con cambio</option>
                        <option value="false">Sin cambio</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <div className="d-flex gap-2">
              <button className="btn btn-outline-success btn-sm px-3" onClick={exportExcel} disabled={records.length === 0 && remolqueRecords.length === 0}>
                <i className="fa fa-file-excel me-2"></i>Excel
              </button>
              <button className="btn btn-danger btn-sm px-3" onClick={exportPDF} disabled={records.length === 0 && remolqueRecords.length === 0}>
                <i className="fa fa-file-pdf me-2"></i>PDF
              </button>
            </div>
          </PageHeader>

          <div className="settings-content mt-4">
            {/* Stat cards */}
            <div className="row g-3 mb-4">
              <StatCard label="Total camiones" value={total} icon="fa-truck" color="#0d6efd" />
              <StatCard label="Camiones en patio" value={enPatio} icon="fa-parking" color="#0dcaf0" />
              <StatCard label="Con cambio remolque" value={conCambio} icon="fa-exchange-alt" color="#fd7e14" />
              <StatCard label="Sin cambio remolque" value={sinCambio} icon="fa-check-circle" color="#198754" />
              <StatCard label="Total remolques" value={remolqueTotal} icon="fa-trailer" color="#6f42c1" />
              <StatCard label="Remolques en patio" value={remolquesEnPatio} icon="fa-map-marker" color="#0dcaf0" />
              <StatCard label="Remolques cambiaron camión" value={conCambioTractor} icon="fa-random" color="#dc3545" />
              <StatCard label="Tiempo promedio camión" value={formatDuration(avgDuration)} icon="fa-clock" color="#6c757d" />
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button className={`nav-link ${activeTab === "camiones" ? "active" : ""}`} onClick={() => setActiveTab("camiones")}>
                  <i className="fa fa-truck me-2"></i>Camiones ({total})
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === "remolques" ? "active" : ""}`} onClick={() => setActiveTab("remolques")}>
                  <i className="fa fa-trailer me-2"></i>Remolques ({remolqueTotal})
                </button>
              </li>
            </ul>

            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : activeTab === "camiones" ? (
              records.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="fa fa-inbox fa-2x mb-2 d-block"></i>
                  No se encontraron registros con los filtros seleccionados.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>Placa Camión</th>
                        <th>Remolque entrada</th>
                        <th>Remolque salida</th>
                        <th>Cambio</th>
                        <th>Línea</th>
                        <th>Cliente</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Duración</th>
                        <th>Estado</th>
                        <th>Confianza</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => {
                        const dur = calcDuration(r.fecha_hora_inicio, r.fecha_hora_salida);
                        return (
                          <tr key={r._id}>
                            <td className="fw-bold text-uppercase">{r.placa}</td>
                            <td>{r.placa_remolque_entrada || <span className="text-muted">—</span>}</td>
                            <td>{r.placa_remolque_salida || (r.fecha_hora_salida ? <span className="text-muted small">Sin remolque</span> : <span className="text-muted">—</span>)}</td>
                            <td><SwapBadge record={r} /></td>
                            <td>{r.linea_transporte}</td>
                            <td>{r.cliente || "—"}</td>
                            <td>{formatDate(r.fecha_hora_inicio)}</td>
                            <td>{formatDate(r.fecha_hora_salida)}</td>
                            <td>{formatDuration(dur)}</td>
                            <td>
                              <span className={`badge ${r.status === "En patio" ? "bg-info" : "bg-success"}`}>{r.status}</span>
                            </td>
                            <td>
                              {r.confidence != null
                                ? <span className={`badge ${r.confidence >= 85 ? "bg-success" : r.confidence >= 60 ? "bg-warning text-dark" : "bg-danger"}`}>
                                    {r.confidence.toFixed(1)}%
                                  </span>
                                : <span className="badge bg-secondary">N/A</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              remolqueRecords.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="fa fa-inbox fa-2x mb-2 d-block"></i>
                  No se encontraron remolques con los filtros seleccionados.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>Placa Remolque</th>
                        <th>Camión entrada</th>
                        <th>Camión salida</th>
                        <th>Cambio camión</th>
                        <th>Línea</th>
                        <th>Cliente</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Duración</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {remolqueRecords.map(r => {
                        const dur = calcDuration(r.fecha_hora_entrada, r.fecha_hora_salida);
                        return (
                          <tr key={r._id}>
                            <td className="fw-bold text-uppercase">{r.placa}</td>
                            <td>{r.tractor_entrada_placa || <span className="text-muted">—</span>}</td>
                            <td>{r.tractor_salida_placa || <span className="text-muted">—</span>}</td>
                            <td>
                              {r.hubo_cambio_tractor === true
                                ? <span className="badge bg-warning text-dark">Cambió camión</span>
                                : r.hubo_cambio_tractor === false
                                  ? <span className="badge bg-success">Mismo camión</span>
                                  : <span className="text-muted small">—</span>}
                            </td>
                            <td>{r.linea_transporte || "—"}</td>
                            <td>{r.cliente || "—"}</td>
                            <td>{formatDate(r.fecha_hora_entrada)}</td>
                            <td>{formatDate(r.fecha_hora_salida)}</td>
                            <td>{formatDuration(dur)}</td>
                            <td>
                              <span className={`badge ${r.status === "En patio" ? "bg-info" : "bg-success"}`}>{r.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReporteControlPatiosPage;
