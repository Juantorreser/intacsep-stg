import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import Sidebar from "../Sidebar";
import FilterBar from "../FilterBar";
import DataTable from "../DataTable";
import DateTimeRangePicker from "../DateTimeRangePicker";
import MultiSelect from "../MultiSelect";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";

const baseUrl = import.meta.env.VITE_BASE_URL;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const formatDuration = (seconds) => {
  if (seconds == null || seconds < 0) return "—";
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (parts.length === 0 || (d === 0 && h === 0 && m < 5)) {
    if (s > 0) parts.push(`${s}s`);
  }

  return parts.length > 0 ? parts.join(" ") : "0s";
};

const formatTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
};

const formatAxisDuration = (seconds) => {
  if (seconds === 0) return "0";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const toDateTimeLocal = (date) => {
  const pad = (num) => num.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const ControlPatiosDashboard = () => {
  const { user, verifyToken, setUser } = useAuth();
  const { isSidebarCollapsed } = useSidebar();
  const navigate = useNavigate();

  const [roleData, setRoleData] = useState(null);
  const [data, setData] = useState({
    totalRecords: 0,
    anomaliesCount: 0,
    anomaliesList: [],
    longestStay: null,
    shortestStay: null,
    movements: [],
    entryEvents: [],
    exitEvents: [],
    distinctPlates: []
  });
  
  const [selectedPlates, setSelectedPlates] = useState([]);
  const [selectedLineas, setSelectedLineas] = useState([]);
  const [periodRange, setPeriodRange] = useState(() => {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    return { start: toDateTimeLocal(oneMonthAgo), end: toDateTimeLocal(now) };
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      let url = `${baseUrl}/control-patios/dashboard-summary?`;
      if (periodRange.start) url += `&start=${periodRange.start}`;
      if (periodRange.end) url += `&end=${periodRange.end}`;
      if (selectedPlates.length > 0) url += `&plate=${selectedPlates.join(',')}`;
      if (selectedLineas.length > 0) url += `&linea=${selectedLineas.join(',')}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    }
  }, [periodRange, selectedPlates, selectedLineas]);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await verifyToken();
        setUser(userData);
        const roleRes = await fetch(`${baseUrl}/roles/${userData.role}`, { credentials: "include" });
        const role = await roleRes.json();
        setRoleData(role);
        if (!role?.reporte_control_patios?.read) { navigate("/"); }
      } catch (e) {
        navigate("/login");
      }
    };
    init();
  }, [navigate, setUser, verifyToken, baseUrl]);

  useEffect(() => {
    if (roleData) fetchDashboardData();
  }, [roleData, fetchDashboardData]);

  const handleClearFilters = () => {
    setSelectedPlates([]);
    setSelectedLineas([]);
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    setPeriodRange({ start: toDateTimeLocal(oneMonthAgo), end: toDateTimeLocal(now) });
  };

  const filteredMovements = useMemo(() => {
    let list = data.movements;
    if (selectedPlates.length > 0) {
      list = list.filter(m => selectedPlates.includes(m.placa));
    }
    if (selectedLineas.length > 0) {
      list = list.filter(m => selectedLineas.includes(m.linea_transporte));
    }
    
    if (periodRange.start || periodRange.end) {
      list = list.filter(m => {
        if (!m.fecha_hora_inicio) return false;
        const entryTime = new Date(m.fecha_hora_inicio).getTime();
        const start = periodRange.start ? new Date(periodRange.start).getTime() : 0;
        const end = periodRange.end ? new Date(periodRange.end).getTime() : Infinity;
        return entryTime >= start && entryTime <= end;
      });
    }
    return list;
  }, [data.movements, selectedPlates, selectedLineas, periodRange]);

  const barChartData = useMemo(() => {
    return filteredMovements
      .filter(m => m.stay_seconds != null)
      .slice(0, 10)
      .map(m => ({
        plate: m.placa,
        seconds: m.stay_seconds,
        duration: formatDuration(m.stay_seconds)
      }));
  }, [filteredMovements]);

  const pieChartData = useMemo(() => {
    const top5 = filteredMovements
      .filter(m => m.stay_seconds != null)
      .sort((a, b) => b.stay_seconds - a.stay_seconds)
      .slice(0, 5);
    
    return top5.map(m => ({
      name: m.placa,
      value: m.stay_seconds
    }));
  }, [filteredMovements]);

  const handleResolveAnomaly = async (id) => {
    try {
      const res = await fetch(`${baseUrl}/patio-anomalies/${id}/resolve`, {
        method: "PATCH",
        credentials: "include"
      });
      if (res.ok) fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { key: "placa", header: "Placa", className: "fw-bold" },
    { key: "fecha_hora_inicio", header: "Entrada", render: (row) => `${formatDate(row.fecha_hora_inicio)} ${formatTime(row.fecha_hora_inicio)}` },
    { key: "fecha_hora_salida", header: "Salida", render: (row) => row.fecha_hora_salida ? `${formatDate(row.fecha_hora_salida)} ${formatTime(row.fecha_hora_salida)}` : <span className="badge bg-info">En patio</span> },
    { key: "stay_seconds", header: "Duración", render: (row) => formatDuration(row.stay_seconds) },
    { key: "status", header: "Estado", render: (row) => <span className={`badge bg-${row.status === "En patio" ? "info" : "success"}`}>{row.status}</span> },
  ];

  if (!user || !roleData) return <div className="p-4">Cargando dashboard...</div>;

  return (
    <div className="d-flex h-100 bg-light" style={{ minHeight: "100vh" }}>
      <div className="sidebar-wrapper"><Sidebar /></div>
      
      <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        
        <div className="page-header">
          <div className="header-left">
            <h1>Control de Patios Dashboard</h1>
          </div>
        </div>

        <FilterBar onClear={handleClearFilters}>
          <MultiSelect 
            label="Placas"
            options={data.distinctPlates || []}
            value={selectedPlates}
            onChange={setSelectedPlates}
          />
          
          <MultiSelect 
            label="Líneas"
            options={data.distinctLineas || []}
            value={selectedLineas}
            onChange={setSelectedLineas}
          />

          <DateTimeRangePicker 
            label="Periodo"
            startValue={periodRange.start}
            endValue={periodRange.end}
            onStartChange={(val) => setPeriodRange(prev => ({ ...prev, start: val }))}
            onEndChange={(val) => setPeriodRange(prev => ({ ...prev, end: val }))}
          />
        </FilterBar>

        <div className="px-3">
          <div className="row g-3 mb-4 text-center">
            <div className="col-md-3">
              <div className="card kpi-card border-0 shadow-sm">
                <div className="kpi-label">Registros Totales</div>
                <div className="kpi-value fw-bold text-primary">{filteredMovements.length}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card kpi-card border-0 shadow-sm">
                <div className="kpi-label">Anomalías Activas</div>
                <div className="kpi-value fw-bold text-danger">{data.anomaliesCount}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card kpi-card border-0 shadow-sm">
                <div className="kpi-label">Mayor Tiempo</div>
                <div className="kpi-value fw-bold text-info" style={{ fontSize: "0.9rem" }}>
                  {data.longestStay ? `${data.longestStay.plate}: ${formatDuration(data.longestStay.seconds)}` : "—"}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card kpi-card border-0 shadow-sm">
                <div className="kpi-label">Menor Tiempo</div>
                <div className="kpi-value fw-bold text-success" style={{ fontSize: "0.9rem" }}>
                  {data.shortestStay ? `${data.shortestStay.plate}: ${formatDuration(data.shortestStay.seconds)}` : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <h6 className="mb-0 fw-bold">Movimientos Recientes</h6>
                </div>
                <div className="card-body p-0">
                  <DataTable
                    data={filteredMovements}
                    columns={columns}
                    maxHeight="400px"
                    emptyMessage="No hay movimientos en el periodo seleccionado."
                  />
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <h6 className="mb-0 fw-bold text-danger">Anomalías Recientes</h6>
                </div>
                <div className="card-body p-0 overflow-auto" style={{ maxHeight: "450px" }}>
                  <ul className="list-group list-group-flush">
                    {data.anomaliesList.map(a => (
                      <li key={a._id} className="list-group-item py-3">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <span className="fw-bold text-primary">{a.plate}</span>
                          <span className={`badge bg-${a.severity === "high" ? "danger" : a.severity === "medium" ? "warning" : "info"} x-small`}>{a.severity}</span>
                        </div>
                        <div className="text-muted small mb-2">{a.description || a.anomaly_type.replace(/_/g, " ")}</div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="x-small text-muted">{new Date(a.createdAt).toLocaleString()}</span>
                          <button 
                            className="btn btn-outline-primary btn-sm x-small px-2 py-1" 
                            onClick={() => handleResolveAnomaly(a._id)}
                          >
                            Resolver
                          </button>
                        </div>
                      </li>
                    ))}
                    {data.anomaliesList.length === 0 && (
                      <li className="list-group-item text-center py-4 text-muted">No hay anomalías pendientes.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <h6 className="mb-0 fw-bold">Tiempo de estadía por placa (Top 10)</h6>
                </div>
                <div className="card-body" style={{ height: "350px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} layout="vertical" margin={{ left: 10, right: 30, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis 
                        type="number" 
                        tickFormatter={formatAxisDuration}
                        tick={{ fontSize: 10, fill: "#6c757d" }}
                        axisLine={{ stroke: "#e5e7eb" }}
                      />
                      <YAxis dataKey="plate" type="category" width={100} tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }} />
                      <ReTooltip 
                        formatter={(value) => formatDuration(value)}
                        labelStyle={{ color: "#333", fontWeight: "bold" }}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      />
                      <Bar dataKey="seconds" name="tiempo" fill="#4ca6f6" radius={[0, 4, 4, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <h6 className="mb-0 fw-bold">Distribución de Estadía (Top 5)</h6>
                </div>
                <div className="card-body" style={{ height: "350px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip 
                        formatter={(value, name) => [formatDuration(value), "tiempo"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .kpi-card {
          height: 70px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-radius: 10px;
          background: #fff;
          transition: transform 0.2s;
        }
        .kpi-card:hover { transform: translateY(-2px); }
        .kpi-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #6c757d;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .kpi-value {
          font-size: 1.15rem;
          line-height: 1;
        }
        @media (max-width: 768px) {
          .kpi-card { height: 60px; }
          .kpi-value { font-size: 1rem; }
          .filter-bar__inputs { flex-direction: column; gap: 10px; }
          .page-header h1 { font-size: 1.25rem; }
        }
      `}</style>
    </div>
  );
};

export default ControlPatiosDashboard;
