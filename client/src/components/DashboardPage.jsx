import {useState, useEffect} from "react";
import {useAuth} from "../context/AuthContext";
import {useSidebar} from "../context/SidebarContext";
import {useNavigate} from "react-router-dom";
import Sidebar from "./Sidebar";

const DashboardPage = () => {
  const {user} = useAuth();
  const {isSidebarCollapsed} = useSidebar();
  const navigate = useNavigate();
  const [roleData, setRoleData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalBitacoras: 0,
    activeBitacoras: 0,
    completedBitacoras: 0,
    pendingBitacoras: 0,
    totalUsers: 0,
    totalClients: 0,
    recentActivity: [],
    monthlyData: [],
    statusDistribution: [],
    topClients: [],
    topOperadores: [],
    statusTrends: [],
    eventDistribution: [],
    geographicData: [],
    operatorEfficiency: [],
    clientPerformance: [],
    tiposMonitoreo: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [availableClients, setAvailableClients] = useState([]);
  const [geoType, setGeoType] = useState("origen");
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch role permissions
        const roleResponse = await fetch(`${baseUrl}/roles/${user.role}`, {
          method: "GET",
          credentials: "include",
        });
        const roleData = await roleResponse.json();
        setRoleData(roleData);

        // Fetch available clients for filter
        const clientsResponse = await fetch(`${baseUrl}/clientes`, {
          method: "GET",
          credentials: "include",
        });
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setAvailableClients(clientsData);
        }

        // Fetch dashboard statistics with filters
        const statsResponse = await fetch(
          `${baseUrl}/dashboard/stats?timeFilter=${timeFilter}&yearFilter=${yearFilter}&clientFilter=${clientFilter}&geoType=${geoType}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log("Dashboard stats received:", statsData);
          setDashboardStats(statsData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate, baseUrl, timeFilter, yearFilter, clientFilter, geoType]);

  // Chart rendering functions
  const renderTiposMonitoreoChart = () => {
    const tiposMonitoreo = dashboardStats.tiposMonitoreo || [];

    if (tiposMonitoreo.length === 0) {
      return <div className="text-center text-muted">No hay datos disponibles</div>;
    }

    const total = tiposMonitoreo.reduce((sum, tipo) => sum + tipo.count, 0);

    return (
      <div className="tipos-monitoreo-chart">
        <div className="tipos-table">
          <div className="table-header">
            <div className="header-cell">Tipo de Monitoreo</div>
            <div className="header-cell">Cantidad</div>
            <div className="header-cell">Porcentaje</div>
            <div className="header-cell">Barra</div>
          </div>
          <div className="table-body">
            {tiposMonitoreo.map((tipo, index) => {
              const percentage = (tipo.count / total) * 100;
              return (
                <div key={index} className="table-row">
                  <div className="cell tipo-name">
                    <div className="tipo-icon">
                      <i className="fa fa-chart-line"></i>
                    </div>
                    <span>{tipo.nombre}</span>
                  </div>
                  <div className="cell tipo-count">{tipo.count}</div>
                  <div className="cell tipo-percentage">{percentage.toFixed(1)}%</div>
                  <div className="cell tipo-bar">
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: tipo.color || "#3b82f6",
                        }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyTrendChart = () => {
    const monthlyData = dashboardStats.monthlyData || [];

    console.log("Monthly data in frontend:", monthlyData);

    // Si no hay datos, mostrar mensaje
    if (monthlyData.length === 0) {
      return <div className="text-center text-muted">No hay datos disponibles</div>;
    }

    const maxValue = Math.max(...monthlyData.map((d) => d.value));

    // Determinar el mes actual por nombre
    const now = new Date();
    const currentMonthName = monthlyData[now.getMonth()]?.month;

    return (
      <div className="trend-chart">
        <div className="chart-bars">
          {monthlyData.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const isCurrent = item.month === currentMonthName;
            return (
              <div key={index} className="chart-bar-item">
                <div
                  className="bar"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: isCurrent ? "#3b82f6" : "#1e293b",
                    minHeight: item.value > 0 ? "20px" : "0px",
                  }}></div>
                <span className="bar-label">{item.month}</span>
                <span className="bar-value">{item.value}</span>
              </div>
            );
          })}
        </div>
        <div className="chart-summary">
          <div className="summary-item">
            <span className="summary-label">Total del año:</span>
            <span className="summary-value">
              {monthlyData.reduce((sum, item) => sum + item.value, 0)} bitácoras
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Promedio mensual:</span>
            <span className="summary-value">
              {Math.round(monthlyData.reduce((sum, item) => sum + item.value, 0) / 12)} bitácoras
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderGeographicChart = () => {
    const geographicData = dashboardStats.geographicData || [];

    if (geographicData.length === 0) {
      return <div className="text-center text-muted">No hay datos disponibles</div>;
    }

    return (
      <div className="geographic-chart">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            {/* <h6 className="mb-0">Análisis Geográfico</h6> */}
            <span
              className="badge"
              style={{
                backgroundColor: geoType === "origen" ? "#10b981" : "#f59e0b",
                color: "#fff",
                fontSize: "0.8rem",
                marginLeft: 8,
              }}>
              {geoType === "origen" ? "Origen" : "Destino"}
            </span>
          </div>
          <select
            value={geoType}
            onChange={(e) => setGeoType(e.target.value)}
            className={`filter-select geo-type-select ${geoType}`}
            style={{
              width: 140,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: geoType === "origen" ? "#10b981" : "#f59e0b",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(16,24,40,0.06)",
              padding: "8px 16px",
              outline: "none",
              transition: "border-color 0.2s",
            }}>
            <option value="origen">Por Origen</option>
            <option value="destino">Por Destino</option>
          </select>
        </div>
        <div className="geo-items">
          {geographicData.map((location, index) => (
            <div key={index} className="geo-item">
              <div
                className="geo-icon"
                style={{background: geoType === "origen" ? "#10b981" : "#f59e0b"}}>
                <i className="fa fa-map-marker-alt" style={{color: "#fff"}}></i>
              </div>
              <div className="geo-info">
                <div className="geo-name">{location.name}</div>
                <div className="geo-count">{location.count} bitácoras</div>
              </div>
              <div className="geo-percentage">
                {Math.round(
                  (location.count / geographicData.reduce((sum, loc) => sum + loc.count, 0)) * 100
                )}
                %
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderActivityTimeline = () => {
    const activities = dashboardStats.recentActivity || [];

    return (
      <div className="activity-timeline">
        {activities.slice(0, 5).map((activity, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-icon">
              <i className={`fa ${activity.icon} text-${activity.color}`}></i>
            </div>
            <div className="timeline-content">
              <div className="timeline-title">{activity.description}</div>
              <div className="timeline-time">{new Date(activity.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center text-muted">No hay actividad reciente</div>
        )}
      </div>
    );
  };

  const renderProgressCircle = (percentage, label, color = "primary") => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="progress-circle">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={`var(--bs-${color})`}
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="progress-text">
          <div className="progress-percentage">{percentage}%</div>
          <div className="progress-label">{label}</div>
        </div>
      </div>
    );
  };

  const renderTopPerformers = () => {
    const {topClients, topOperadores} = dashboardStats;

    return (
      <div className="row">
        <div className="col-md-6">
          <div className="chart-card">
            <div className="chart-header">
              <h6>Top Clientes</h6>
            </div>
            <div className="chart-body">
              {topClients && topClients.length > 0 ? (
                <div className="top-performers">
                  {topClients.slice(0, 5).map((client, index) => (
                    <div key={index} className="performer-item">
                      <div className="performer-rank">#{index + 1}</div>
                      <div className="performer-info">
                        <div className="performer-name">{client.nombre}</div>
                        <div className="performer-stats">{client.count} bitácoras</div>
                      </div>
                      <div className="performer-score">{client.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted">No hay datos disponibles</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="chart-card">
            <div className="chart-header">
              <h6>Top Operadores</h6>
            </div>
            <div className="chart-body">
              {topOperadores && topOperadores.length > 0 ? (
                <div className="top-performers">
                  {topOperadores.slice(0, 5).map((operador, index) => (
                    <div key={index} className="performer-item">
                      <div className="performer-rank">#{index + 1}</div>
                      <div className="performer-info">
                        <div className="performer-name">{operador.name}</div>
                        <div className="performer-stats">{operador.count} bitácoras</div>
                      </div>
                      <div className="performer-score">{operador.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted">No hay datos disponibles</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section id="dashboard">
        <div className="w-100 d-flex h-100 mt-0">
          <div className="sidebar-wrapper">
            <Sidebar />
          </div>
          <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
            <div
              className="d-flex justify-content-center align-items-center"
              style={{height: "100vh"}}>
              <div className="text-center">
                <i className="fa fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                <p className="text-muted">Cargando dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="dashboard">
      <div className="w-100 d-flex h-100 mt-0">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <h1>Dashboard</h1>
          </div>

          <div className="container-fluid">
            {/* Welcome Section */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="welcome-card">
                  <div className="welcome-content">
                    <div className="welcome-icon">
                      <i className="fa fa-tachometer-alt"></i>
                    </div>
                    <div className="welcome-text">
                      <h4>
                        Bienvenido, {user?.firstName} {user?.lastName}
                      </h4>
                      <p>Panel de control del sistema de monitoreo Intacsep</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Card */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="filter-card">
                  <div className="filter-content">
                    <div className="filter-section">
                      <label>Período de Tiempo:</label>
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="filter-select">
                        <option value="all">Todos los períodos</option>
                        <option value="today">Hoy</option>
                        <option value="week">Esta semana</option>
                        <option value="month">Este mes</option>
                        <option value="quarter">Este trimestre</option>
                        <option value="year">Este año</option>
                      </select>
                    </div>
                    <div className="filter-section">
                      <label>Año:</label>
                      <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="filter-select">
                        <option value="all">Todos los años</option>
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(
                          (year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="filter-section">
                      <label>Cliente:</label>
                      <select
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        className="filter-select">
                        <option value="all">Todos los clientes</option>
                        {availableClients.map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-actions">
                      <button
                        className="filter-btn"
                        onClick={() => {
                          setTimeFilter("all");
                          setYearFilter(new Date().getFullYear());
                          setClientFilter("all");
                        }}>
                        <i className="fa fa-refresh"></i>
                        Resetear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-4">
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fa fa-book"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{dashboardStats.totalBitacoras}</div>
                    <div className="stat-label">Total Bitácoras</div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-md-6 mb-4">
                <div className="stat-card">
                  <div className="stat-icon active">
                    <i className="fa fa-plus-circle"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{dashboardStats.nuevasBitacoras}</div>
                    <div className="stat-label">Bitácoras nuevas</div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-md-6 mb-4">
                <div className="stat-card">
                  <div className="stat-icon pending">
                    <i className="fa fa-check-circle"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{dashboardStats.enProcesoBitacoras}</div>
                    <div className="stat-label">Bitácoras en proceso</div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-md-6 mb-4">
                <div className="stat-card">
                  <div className="stat-icon completed">
                    <i className="fa fa-lock"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{dashboardStats.cerradasBitacoras}</div>
                    <div className="stat-label">Bitácoras cerradas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Charts Section */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6>Tendencia Mensual</h6>
                  </div>
                  <div className="chart-body">{renderMonthlyTrendChart()}</div>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-xl-6 col-lg-6">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6>Análisis Geográfico</h6>
                  </div>
                  <div className="chart-body">{renderGeographicChart()}</div>
                </div>
              </div>

              <div className="col-6">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6>Tipos de Monitoreo</h6>
                  </div>
                  <div className="chart-body">{renderTiposMonitoreoChart()}</div>
                </div>
              </div>
            </div>

            {/* Progress Circles */}
            <div className="row mb-4">
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="progress-card">
                  <div className="progress-content">
                    {renderProgressCircle(
                      dashboardStats.totalBitacoras > 0
                        ? Math.round(
                            (dashboardStats.activeBitacoras / dashboardStats.totalBitacoras) * 100
                          )
                        : 0,
                      "Activas",
                      "success"
                    )}
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-md-6 mb-4">
                <div className="progress-card">
                  <div className="progress-content">
                    {renderProgressCircle(
                      dashboardStats.totalBitacoras > 0
                        ? Math.round(
                            (dashboardStats.completedBitacoras / dashboardStats.totalBitacoras) *
                              100
                          )
                        : 0,
                      "Completadas",
                      "info"
                    )}
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-md-6 mb-4">
                <div className="progress-card">
                  <div className="progress-content">
                    {renderProgressCircle(
                      dashboardStats.totalBitacoras > 0
                        ? Math.round(
                            (dashboardStats.pendingBitacoras / dashboardStats.totalBitacoras) * 100
                          )
                        : 0,
                      "Pendientes",
                      "warning"
                    )}
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-md-6 mb-4">
                <div className="progress-card">
                  <div className="progress-content">
                    {renderProgressCircle(
                      dashboardStats.totalUsers > 0
                        ? Math.round(
                            (dashboardStats.activeBitacoras / dashboardStats.totalUsers) * 100
                          )
                        : 0,
                      "Eficiencia",
                      "primary"
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="row mb-4">{renderTopPerformers()}</div>

            {/* Activity Timeline */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6>Actividad Reciente</h6>
                  </div>
                  <div className="chart-body">{renderActivityTimeline()}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6>Acciones Rápidas</h6>
                  </div>
                  <div className="chart-body">
                    <div className="row">
                      {roleData?.bitacoras?.create && (
                        <div className="col-lg-3 col-md-6 mb-3">
                          <button
                            className="action-btn primary"
                            onClick={() => navigate("/bitacoras")}>
                            <i className="fa fa-plus me-2"></i>
                            Nueva Bitácora
                          </button>
                        </div>
                      )}

                      {roleData?.bitacoras?.read && (
                        <div className="col-lg-3 col-md-6 mb-3">
                          <button
                            className="action-btn info"
                            onClick={() => navigate("/bitacoras")}>
                            <i className="fa fa-list me-2"></i>
                            Ver Bitácoras
                          </button>
                        </div>
                      )}

                      {roleData?.clientes?.read && (
                        <div className="col-lg-3 col-md-6 mb-3">
                          <button
                            className="action-btn success"
                            onClick={() => navigate("/clientes")}>
                            <i className="fa fa-building me-2"></i>
                            Gestionar Clientes
                          </button>
                        </div>
                      )}

                      {roleData?.usuarios?.read && (
                        <div className="col-lg-3 col-md-6 mb-3">
                          <button
                            className="action-btn warning"
                            onClick={() => navigate("/usuarios")}>
                            <i className="fa fa-users me-2"></i>
                            Gestionar Usuarios
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
