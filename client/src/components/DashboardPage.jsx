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
        const clientsResponse = await fetch(`${baseUrl}/clients`, {
          method: "GET",
          credentials: "include",
        });
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setAvailableClients(clientsData);
        }

        // Fetch dashboard statistics with filters
        const statsResponse = await fetch(
          `${baseUrl}/dashboard/stats?timeFilter=${encodeURIComponent(
            timeFilter
          )}&yearFilter=${encodeURIComponent(yearFilter)}&clientFilter=${encodeURIComponent(
            clientFilter
          )}&geoType=${encodeURIComponent(geoType)}`,
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
            <div className="header-cell small">Tipo</div>
            <div className="header-cell small">Cant.</div>
            <div className="header-cell small">%</div>
            <div className="header-cell small">Barra</div>
          </div>
          <div className="table-body">
            {tiposMonitoreo.map((tipo, index) => {
              const percentage = (tipo.count / total) * 100;
              return (
                <div key={index} className="table-row">
                  <div className="cell tipo-name">
                    <span className="small">{tipo.nombre}</span>
                  </div>
                  <div className="cell tipo-count small">{tipo.count}</div>
                  <div className="cell tipo-percentage small">{percentage.toFixed(1)}%</div>
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
    console.log("Current year filter:", yearFilter);

    // Si no hay datos, mostrar mensaje
    if (monthlyData.length === 0) {
      return (
        <div className="text-center text-muted">
          No hay datos disponibles para{" "}
          {yearFilter !== "all" ? yearFilter : "el período seleccionado"}
        </div>
      );
    }

    const maxValue = Math.max(...monthlyData.map((d) => d.value));

    return (
      <div className="trend-chart">
        <div
          className="chart-bars"
          style={{
            height: "250px",
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            padding: "15px 0 35px 0",
            position: "relative",
            minWidth: "600px", // Ensure minimum width for mobile scrolling
          }}>
          {monthlyData.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div
                key={index}
                className="chart-bar-item"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  height: "100%",
                  position: "relative",
                  justifyContent: "flex-end",
                  minWidth: "40px", // Ensure minimum bar width
                }}>
                <div
                  className="bar"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: "#3b82f6",
                    minHeight: item.value > 0 ? "4px" : "0px",
                    width: "100%",
                    maxWidth: "35px",
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.3s ease",
                    marginBottom: "40px",
                  }}></div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "-35px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                    width: "100%",
                  }}>
                  <span
                    className="bar-label"
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#6b7280",
                      display: "block",
                    }}>
                    {item.month}
                  </span>
                  <span
                    className="bar-value"
                    style={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: "#3b82f6",
                      display: "block",
                      marginTop: "2px",
                    }}>
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-summary">
          <div className="summary-item">
            <span className="summary-label">
              Total {yearFilter !== "all" ? `del ${yearFilter}` : "del período"}:
            </span>
            <span className="summary-value">
              {monthlyData.reduce((sum, item) => sum + item.value, 0)} bitácoras
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Promedio mensual:</span>
            <span className="summary-value">
              {Math.round(
                monthlyData.reduce((sum, item) => sum + item.value, 0) /
                  Math.max(monthlyData.length, 1)
              )}{" "}
              bitácoras
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
            <span
              className="badge"
              style={{
                backgroundColor: geoType === "origen" ? "#10b981" : "#f59e0b",
                color: "#fff",
                fontSize: "0.75rem",
                marginLeft: 8,
              }}>
              {geoType === "origen" ? "Origen" : "Destino"}
            </span>
          </div>
          <select
            value={geoType}
            onChange={(e) => setGeoType(e.target.value)}
            className={`filter-select geo-type-select ${geoType} form-select form-select-sm`}
            style={{
              width: 120,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: geoType === "origen" ? "#10b981" : "#f59e0b",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(16,24,40,0.06)",
              padding: "6px 12px",
              outline: "none",
              transition: "border-color 0.2s",
              fontSize: "0.8rem",
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
                <div className="geo-name small">{location.name}</div>
                <div className="geo-count small">{location.count} bitácoras</div>
              </div>
              <div className="geo-percentage small">
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
              <div className="timeline-title small">{activity.description}</div>
              <div className="timeline-time small">
                {new Date(activity.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center text-muted small">No hay actividad reciente</div>
        )}
      </div>
    );
  };

  const renderProgressCircle = (percentage, label, color = "primary") => {
    // Handle NaN, undefined, or invalid percentage values
    const validPercentage =
      isNaN(percentage) || percentage === undefined || percentage === null
        ? 0
        : Math.max(0, Math.min(100, percentage));

    const radius = 35; // Smaller radius for mobile
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (validPercentage / 100) * circumference;

    return (
      <div className="progress-circle">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#1e293b" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={`var(--bs-${color})`}
            strokeWidth="6"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div className="progress-text">
          <div className="progress-percentage small">{validPercentage}%</div>
          <div className="progress-label small">{label}</div>
        </div>
      </div>
    );
  };

  // --- NUEVAS FUNCIONES DE RENDER ---
  const renderTopClients = () => {
    const {topClients} = dashboardStats;
    return (
      <div className="top-performers">
        {topClients && topClients.length > 0 ? (
          topClients.slice(0, 5).map((client, index) => (
            <div key={index} className="performer-item">
              <div className="performer-rank small">#{index + 1}</div>
              <div className="performer-info">
                <div className="performer-name small">{client.nombre}</div>
                <div className="performer-stats small">{client.count} bitácoras</div>
              </div>
              <div className="performer-score small">{client.count}</div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted small">No hay datos disponibles</div>
        )}
      </div>
    );
  };

  const renderTopOperadores = () => {
    const {topOperadores} = dashboardStats;
    return (
      <div className="top-performers">
        {topOperadores && topOperadores.length > 0 ? (
          topOperadores.slice(0, 5).map((operador, index) => (
            <div key={index} className="performer-item">
              <div className="performer-rank small">#{index + 1}</div>
              <div className="performer-info">
                <div className="performer-name small">{operador.name}</div>
                <div className="performer-stats small">{operador.count} bitácoras</div>
              </div>
              <div className="performer-score small">{operador.count}</div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted small">No hay datos disponibles</div>
        )}
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
            <h1 className="fs-3 fw-semibold text-black m-0">Dashboard</h1>
          </div>

          <div className="container-fluid px-3 px-md-4">
            {/* Welcome Section */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="welcome-card">
                  <div className="welcome-content">
                    <div className="welcome-icon">
                      <i className="fa fa-tachometer-alt"></i>
                    </div>
                    <div className="welcome-text">
                      <h4 className="fs-5 fs-md-4">
                        Bienvenido, {user?.firstName} {user?.lastName}
                      </h4>
                      <p className="mb-0 d-none d-md-block">
                        Panel de control del sistema de monitoreo Intacsep
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Card */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="filter-card">
                  <div className="filter-content">
                    <div className="row g-2 g-md-3 align-items-end">
                      <div className="col-12 col-sm-6 col-lg-3">
                        <div className="filter-section">
                          <label className="form-label small mb-1">Período de Tiempo:</label>
                          <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="filter-select form-select form-select-sm">
                            <option value="all">Todos los períodos</option>
                            <option value="today">Hoy</option>
                            <option value="week">Esta semana</option>
                            <option value="month">Este mes</option>
                            <option value="quarter">Este trimestre</option>
                            <option value="year">Este año</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-3">
                        <div className="filter-section">
                          <label className="form-label small mb-1">Año:</label>
                          <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="filter-select form-select form-select-sm">
                            <option value="all">Todos los años</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-3">
                        <div className="filter-section">
                          <label className="form-label small mb-1">Cliente:</label>
                          <select
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                            className="filter-select form-select form-select-sm">
                            <option value="all">Todos los clientes</option>
                            {availableClients
                              .sort((a, b) => a.razon_social.localeCompare(b.razon_social))
                              .map((client) => (
                                <option key={client._id} value={client.razon_social}>
                                  {client.razon_social}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-3">
                        <div className="filter-actions d-flex justify-content-end">
                          <button
                            className="filter-btn btn btn-outline-secondary btn-sm"
                            onClick={() => {
                              setTimeFilter("all");
                              setYearFilter("all");
                              setClientFilter("all");
                            }}>
                            <i className="fa fa-refresh me-1"></i>
                            Resetear
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-3 mb-md-4 g-2 g-md-3">
              <div className="col-6 col-md-3 mb-2 mb-md-0">
                <div className="stat-card h-100">
                  <div className="stat-icon">
                    <i className="fa fa-book"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value fs-4 fs-md-3">{dashboardStats.totalBitacoras}</div>
                    <div className="stat-label small">Total Bitácoras</div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-3 mb-2 mb-md-0">
                <div className="stat-card h-100">
                  <div className="stat-icon active">
                    <i className="fa fa-plus-circle"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value fs-4 fs-md-3">{dashboardStats.nuevasBitacoras}</div>
                    <div className="stat-label small">Nuevas</div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-3 mb-2 mb-md-0">
                <div className="stat-card h-100">
                  <div className="stat-icon pending">
                    <i className="fa fa-clock"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value fs-4 fs-md-3">
                      {dashboardStats.enProcesoBitacoras}
                    </div>
                    <div className="stat-label small">En proceso</div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-3 mb-2 mb-md-0">
                <div className="stat-card h-100">
                  <div className="stat-icon completed">
                    <i className="fa fa-lock"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value fs-4 fs-md-3">
                      {dashboardStats.cerradasBitacoras}
                    </div>
                    <div className="stat-label small">Cerradas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Charts Section */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6 className="mb-0">
                      Tendencia Mensual {yearFilter !== "all" ? `- ${yearFilter}` : ""}
                    </h6>
                  </div>
                  <div className="chart-body">
                    <div className="overflow-auto">{renderMonthlyTrendChart()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Circles */}
            <div className="row mb-3 mb-md-4 g-2 g-md-3">
              <div className="col-6 col-md-3 mb-2 mb-md-0">
                <div className="progress-card h-100">
                  <div className="progress-content">
                    {renderProgressCircle(
                      dashboardStats.totalBitacoras > 0 &&
                        dashboardStats.nuevasBitacoras !== undefined
                        ? Math.round(
                            (dashboardStats.nuevasBitacoras / dashboardStats.totalBitacoras) * 100
                          )
                        : 0,
                      "Nuevas",
                      "success"
                    )}
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-3 mb-2 mb-md-0">
                <div className="progress-card h-100">
                  <div className="progress-content">
                    {renderProgressCircle(
                      dashboardStats.totalBitacoras > 0 &&
                        dashboardStats.enProcesoBitacoras !== undefined
                        ? Math.round(
                            (dashboardStats.enProcesoBitacoras / dashboardStats.totalBitacoras) *
                              100
                          )
                        : 0,
                      "En Proceso",
                      "info"
                    )}
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-3 mb-2 mb-md-0">
                <div className="progress-card h-100">
                  <div className="progress-content">
                    {renderProgressCircle(
                      dashboardStats.totalBitacoras > 0 &&
                        dashboardStats.cerradasBitacoras !== undefined
                        ? Math.round(
                            (dashboardStats.cerradasBitacoras / dashboardStats.totalBitacoras) * 100
                          )
                        : 0,
                      "Cerradas",
                      "warning"
                    )}
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-3 mb-2 mb-md-0">
                <div className="progress-card h-100">
                  <div className="progress-content">
                    {renderProgressCircle(
                      dashboardStats.totalBitacoras > 0 && dashboardStats.totalUsers > 0
                        ? Math.round(dashboardStats.totalBitacoras / dashboardStats.totalUsers)
                        : 0,
                      "Por Usuario",
                      "primary"
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fila: Tipos de Monitoreo, Top Clientes, Top Operadores */}
            <div className="row mb-3 mb-md-4 g-2 g-md-3">
              <div className="col-12 col-lg-4 mb-2 mb-lg-0">
                <div className="chart-card mini-card h-100">
                  <div className="chart-header">
                    <h6 className="mb-0">Tipos de Monitoreo</h6>
                  </div>
                  <div className="chart-body fixed-height-card-body">
                    <div className="overflow-auto">{renderTiposMonitoreoChart()}</div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-4 mb-2 mb-lg-0">
                <div className="chart-card mini-card h-100">
                  <div className="chart-header">
                    <h6 className="mb-0">Top Clientes</h6>
                  </div>
                  <div className="chart-body fixed-height-card-body">
                    <div className="overflow-auto">{renderTopClients()}</div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-4 mb-2 mb-lg-0">
                <div className="chart-card mini-card h-100">
                  <div className="chart-header">
                    <h6 className="mb-0">Top Operadores</h6>
                  </div>
                  <div className="chart-body fixed-height-card-body">
                    <div className="overflow-auto">{renderTopOperadores()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fila: Análisis Geográfico y Actividad Reciente */}
            <div className="row mb-3 mb-md-4 g-2 g-md-3">
              <div className="col-12 col-lg-6 mb-2 mb-lg-0">
                <div className="chart-card mini-card h-100">
                  <div className="chart-header">
                    <h6 className="mb-0">Análisis Geográfico</h6>
                  </div>
                  <div className="chart-body fixed-height-card-body">
                    <div className="overflow-auto">{renderGeographicChart()}</div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-6 mb-2 mb-lg-0">
                <div className="chart-card mini-card h-100">
                  <div className="chart-header">
                    <h6 className="mb-0">Actividad Reciente</h6>
                  </div>
                  <div className="chart-body fixed-height-card-body">
                    <div className="overflow-auto">{renderActivityTimeline()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6 className="mb-0">Acciones Rápidas</h6>
                  </div>
                  <div className="chart-body">
                    <div className="row g-2 g-md-3">
                      {roleData?.bitacoras?.create && (
                        <div className="col-6 col-md-3 mb-2 mb-md-0">
                          <button
                            className="action-btn primary btn w-100"
                            onClick={() => navigate("/bitacoras")}>
                            <i className="fa fa-plus me-1 me-md-2"></i>
                            <span className="d-none d-sm-inline">Nueva Bitácora</span>
                            <span className="d-sm-none">Nueva</span>
                          </button>
                        </div>
                      )}

                      {roleData?.bitacoras?.read && (
                        <div className="col-6 col-md-3 mb-2 mb-md-0">
                          <button
                            className="action-btn info btn w-100"
                            onClick={() => navigate("/bitacoras")}>
                            <i className="fa fa-list me-1 me-md-2"></i>
                            <span className="d-none d-sm-inline">Ver Bitácoras</span>
                            <span className="d-sm-none">Ver</span>
                          </button>
                        </div>
                      )}

                      {roleData?.clientes?.read && (
                        <div className="col-6 col-md-3 mb-2 mb-md-0">
                          <button
                            className="action-btn success btn w-100"
                            onClick={() => navigate("/clientes")}>
                            <i className="fa fa-building me-1 me-md-2"></i>
                            <span className="d-none d-sm-inline">Gestionar Clientes</span>
                            <span className="d-sm-none">Clientes</span>
                          </button>
                        </div>
                      )}

                      {roleData?.usuarios?.read && (
                        <div className="col-6 col-md-3 mb-2 mb-md-0">
                          <button
                            className="action-btn warning btn w-100"
                            onClick={() => navigate("/usuarios")}>
                            <i className="fa fa-users me-1 me-md-2"></i>
                            <span className="d-none d-sm-inline">Gestionar Usuarios</span>
                            <span className="d-sm-none">Usuarios</span>
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
