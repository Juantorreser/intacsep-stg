import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
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

const StatCard = ({ label, value, icon, color }) => (
  <div className="col-6 col-md-3">
    <div className={`card border-0 shadow-sm h-100`}>
      <div className="card-body d-flex align-items-center gap-3">
        <div className={`rounded-circle d-flex align-items-center justify-content-center text-white`}
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
  const [lineas, setLineas] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = useState({
    desde: toLocalDateStr(firstOfMonth),
    hasta: toLocalDateStr(today),
    cliente: "",
    linea: "",
    status: "",
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
      const res = await fetch(`${baseUrl}/control-patios`, { credentials: "include" });
      if (!res.ok) throw new Error("Error fetching records");
      let data = await res.json();

      // Client-side filtering by allowed clients
      if (roleData.client_access === "specific" && roleData.allowed_clients) {
        const allowed = roleData.allowed_clients.map(ac => ac.client_name);
        data = data.filter(r => !r.cliente || allowed.includes(r.cliente));
      }

      // Date range filter
      if (filters.desde) {
        const from = new Date(filters.desde + "T00:00:00");
        data = data.filter(r => new Date(r.fecha_hora_inicio) >= from);
      }
      if (filters.hasta) {
        const to = new Date(filters.hasta + "T23:59:59");
        data = data.filter(r => new Date(r.fecha_hora_inicio) <= to);
      }

      if (filters.cliente) data = data.filter(r => r.cliente === filters.cliente);
      if (filters.linea) data = data.filter(r => r.linea_transporte === filters.linea);
      if (filters.status) data = data.filter(r => r.status === filters.status);

      setRecords(data);
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

  // Stats
  const total = records.length;
  const enPatio = records.filter(r => r.status === "En patio").length;
  const finalizados = records.filter(r => r.status === "Finalizado").length;
  const duraciones = records
    .map(r => calcDuration(r.fecha_hora_inicio, r.fecha_hora_salida))
    .filter(d => d != null && d > 0);
  const avgDuration = duraciones.length > 0
    ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length)
    : null;

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Reporte Control de Patios", 14, 15);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString("es-MX")}  |  Período: ${filters.desde} → ${filters.hasta}`, 14, 22);

    doc.autoTable({
      startY: 28,
      head: [["Placa", "Línea", "Cliente", "Entrada", "Salida", "Duración", "Estado", "Confianza"]],
      body: records.map(r => {
        const dur = calcDuration(r.fecha_hora_inicio, r.fecha_hora_salida);
        return [
          r.placa,
          r.linea_transporte,
          r.cliente || "—",
          formatDate(r.fecha_hora_inicio),
          formatDate(r.fecha_hora_salida),
          formatDuration(dur),
          r.status,
          r.confidence != null ? `${r.confidence.toFixed(1)}%` : "N/A",
        ];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 37, 41] },
    });

    doc.save(`reporte-control-patios-${filters.desde}-${filters.hasta}.pdf`);
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
                  <div className="row g-3 align-items-end">
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-bold mb-1">Desde</label>
                      <input type="date" className="form-control form-control-sm"
                        value={filters.desde} onChange={e => setFilter("desde", e.target.value)} />
                    </div>
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-bold mb-1">Hasta</label>
                      <input type="date" className="form-control form-control-sm"
                        value={filters.hasta} onChange={e => setFilter("hasta", e.target.value)} />
                    </div>
                    {roleData?.client_access !== "specific" && (
                      <div className="col-6 col-md-2">
                        <label className="form-label small fw-bold mb-1">Cliente</label>
                        <select className="form-select form-select-sm" value={filters.cliente} onChange={e => setFilter("cliente", e.target.value)}>
                          <option value="">Todos</option>
                          {visibleClients.map(c => <option key={c._id} value={c.nombre}>{c.nombre}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-bold mb-1">Línea</label>
                      <select className="form-select form-select-sm" value={filters.linea} onChange={e => setFilter("linea", e.target.value)}>
                        <option value="">Todas</option>
                        {lineas.map(l => <option key={l._id} value={l.nombre}>{l.nombre}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-bold mb-1">Estado</label>
                      <select className="form-select form-select-sm" value={filters.status} onChange={e => setFilter("status", e.target.value)}>
                        <option value="">Todos</option>
                        <option value="En patio">En patio</option>
                        <option value="Finalizado">Finalizado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <button className="btn btn-danger btn-sm px-3" onClick={exportPDF} disabled={records.length === 0}>
              <i className="fa fa-file-pdf me-2"></i>Exportar PDF
            </button>
          </PageHeader>

          <div className="settings-content mt-4">

            {/* Stat cards */}
            <div className="row g-3 mb-4">
              <StatCard label="Total registros" value={total} icon="fa-list" color="#0d6efd" />
              <StatCard label="En patio" value={enPatio} icon="fa-truck" color="#0dcaf0" />
              <StatCard label="Finalizados" value={finalizados} icon="fa-check-circle" color="#198754" />
              <StatCard label="Tiempo promedio" value={formatDuration(avgDuration)} icon="fa-clock" color="#6f42c1" />
            </div>

            {/* Table */}
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="fa fa-inbox fa-2x mb-2 d-block"></i>
                No se encontraron registros con los filtros seleccionados.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Placa</th>
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
                          <td>{r.linea_transporte}</td>
                          <td>{r.cliente || "—"}</td>
                          <td>{formatDate(r.fecha_hora_inicio)}</td>
                          <td>{formatDate(r.fecha_hora_salida)}</td>
                          <td>{formatDuration(dur)}</td>
                          <td>
                            <span className={`badge ${r.status === "En patio" ? "bg-info" : "bg-success"}`}>
                              {r.status}
                            </span>
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
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReporteControlPatiosPage;
