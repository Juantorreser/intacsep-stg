import {useState, useEffect, useCallback, useMemo} from "react";
import {useAuth} from "../context/AuthContext";
import {useSidebar} from "../context/SidebarContext";
import {useNavigate} from "react-router-dom";
import Sidebar from "./Sidebar";
import {Chart as ChartJS, ArcElement, Tooltip, Legend} from "chart.js";
import {Doughnut} from "react-chartjs-2";
import * as XLSX from "xlsx";

ChartJS.register(ArcElement, Tooltip, Legend);

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
    eventCategoriesStats: [],
    geographicData: [],
    operatorEfficiency: [],
    clientPerformance: [],
    tiposMonitoreo: [],
  });
  const [oncEventsData, setOncEventsData] = useState([]);
  const [bitacorasAnomalias, setBitacorasAnomalias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState("all");
  const [availableClients, setAvailableClients] = useState([]);
  const [geoType, setGeoType] = useState("origen");

  // Nuevos filtros para anomalías
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [lineaTransporteFilter, setLineaTransporteFilter] = useState("all");
  const [operadorFilter, setOperadorFilter] = useState("all");
  const [availableLineasTransporte, setAvailableLineasTransporte] = useState([]);
  const [availableOperadores, setAvailableOperadores] = useState([]);
  const [applyFiltersTrigger, setApplyFiltersTrigger] = useState(0);

  // Cache para evitar llamadas duplicadas
  const [dataCache, setDataCache] = useState({
    roleData: null,
    clients: null,
    lineasTransporte: null,
    operadores: null,
    lastFetch: null,
  });

  // Debounce para filtros
  const [debouncedFilters, setDebouncedFilters] = useState({
    clientFilter: "all",
    geoType: "origen",
    fechaDesde: "",
    fechaHasta: "",
    lineaTransporteFilter: "all",
    operadorFilter: "all",
  });

  const baseUrl = import.meta.env.VITE_BASE_URL;

  // Memoizar los filtros para evitar llamadas innecesarias
  const currentFilters = useMemo(
    () => ({
      clientFilter,
      geoType,
      fechaDesde,
      fechaHasta,
      lineaTransporteFilter,
      operadorFilter,
    }),
    [clientFilter, geoType, fechaDesde, fechaHasta, lineaTransporteFilter, operadorFilter]
  );

  // Memoizar datos procesados para evitar re-renders innecesarios
  const processedDashboardStats = useMemo(() => {
    if (!dashboardStats) return null;

    return {
      ...dashboardStats,
      // Procesar datos adicionales si es necesario
      processedMonthlyData:
        dashboardStats.monthlyData?.map((item) => ({
          ...item,
          displayValue: item.value.toLocaleString(),
        })) || [],
    };
  }, [dashboardStats]);

  const processedOncEvents = useMemo(() => {
    if (!oncEventsData) return [];

    return oncEventsData.map((event) => ({
      ...event,
      displayCount: event.count.toLocaleString(),
    }));
  }, [oncEventsData]);

  // Debounce effect para filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(currentFilters);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [currentFilters]);

  // Función para obtener datos estáticos (solo una vez)
  const fetchStaticData = useCallback(async () => {
    try {
      // Verificar que el usuario esté autenticado
      if (!user || !user.role) {
        console.log("User not authenticated, skipping static data fetch");
        return;
      }

      // Solo obtener datos estáticos si no están en cache o han pasado más de 5 minutos
      const now = Date.now();
      const cacheExpiry = 5 * 60 * 1000; // 5 minutos

      if (!dataCache.lastFetch || now - dataCache.lastFetch > cacheExpiry) {
        console.log("Fetching static data...");

        // Fetch role permissions
        if (!dataCache.roleData) {
          const roleResponse = await fetch(`${baseUrl}/roles/${user.role}`, {
            method: "GET",
            credentials: "include",
          });
          const roleData = await roleResponse.json();
          setRoleData(roleData);
          setDataCache((prev) => ({...prev, roleData}));
        } else {
          setRoleData(dataCache.roleData);
        }

        // Fetch available clients for filter
        if (!dataCache.clients) {
          const clientsResponse = await fetch(`${baseUrl}/clients`, {
            method: "GET",
            credentials: "include",
          });
          if (clientsResponse.ok) {
            const clientsData = await clientsResponse.json();
            setAvailableClients(clientsData);
            setDataCache((prev) => ({...prev, clients: clientsData}));
          }
        } else {
          setAvailableClients(dataCache.clients);
        }

        // Fetch available transport lines for filter from bitacoras
        if (!dataCache.lineasTransporte) {
          const lineasResponse = await fetch(`${baseUrl}/lineas-transporte-bitacoras`, {
            method: "GET",
            credentials: "include",
          });
          if (lineasResponse.ok) {
            const lineasData = await lineasResponse.json();
            setAvailableLineasTransporte(lineasData);
            setDataCache((prev) => ({...prev, lineasTransporte: lineasData}));
          } else {
            console.warn("Transport lines endpoint not available:", lineasResponse.status);
            setAvailableLineasTransporte([]);
            setDataCache((prev) => ({...prev, lineasTransporte: []}));
          }
        } else {
          setAvailableLineasTransporte(dataCache.lineasTransporte);
        }

        // Fetch available operators for filter from bitacoras
        if (!dataCache.operadores) {
          const operadoresResponse = await fetch(`${baseUrl}/operadores-bitacoras`, {
            method: "GET",
            credentials: "include",
          });
          if (operadoresResponse.ok) {
            const operadoresData = await operadoresResponse.json();
            setAvailableOperadores(operadoresData);
            setDataCache((prev) => ({...prev, operadores: operadoresData}));
          } else {
            console.warn("Operators endpoint not available:", operadoresResponse.status);
            setAvailableOperadores([]);
            setDataCache((prev) => ({...prev, operadores: []}));
          }
        } else {
          setAvailableOperadores(dataCache.operadores);
        }

        setDataCache((prev) => ({...prev, lastFetch: now}));
      } else {
        // Usar datos del cache
        console.log("Using cached static data");
        if (dataCache.roleData) setRoleData(dataCache.roleData);
        if (dataCache.clients) setAvailableClients(dataCache.clients);
        if (dataCache.lineasTransporte) setAvailableLineasTransporte(dataCache.lineasTransporte);
        if (dataCache.operadores) setAvailableOperadores(dataCache.operadores);
      }
    } catch (error) {
      console.error("Error fetching static data:", error);
    }
  }, [baseUrl, user?.role, dataCache]);

  // Función para obtener datos dinámicos del dashboard
  const fetchDashboardData = useCallback(async () => {
    try {
      // Verificar que el usuario esté autenticado
      if (!user || !user.role) {
        console.log("User not authenticated, skipping dashboard data fetch");
        return;
      }

      setLoading(true);
      console.log("Fetching dashboard data with filters:", debouncedFilters);

      // Crear un solo endpoint que devuelva todos los datos del dashboard
      const queryParams = new URLSearchParams({
        clientFilter: debouncedFilters.clientFilter,
        geoType: debouncedFilters.geoType,
        fechaDesde: debouncedFilters.fechaDesde,
        fechaHasta: debouncedFilters.fechaHasta,
        lineaTransporte: debouncedFilters.lineaTransporteFilter,
        operador: debouncedFilters.operadorFilter,
      });

      const dashboardResponse = await fetch(
        `${baseUrl}/dashboard/all-data?${queryParams.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log("Dashboard data received:", dashboardData);

        // Actualizar todos los estados con los datos recibidos
        setDashboardStats(dashboardData.stats || {});
        setOncEventsData(dashboardData.oncEvents || []);
        setBitacorasAnomalias(dashboardData.bitacorasAnomalias || []);
      } else {
        console.error("Failed to fetch dashboard data:", dashboardResponse.status);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, debouncedFilters]);

  // Effect para datos estáticos (solo una vez al montar)
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user && user.role) {
      fetchStaticData();
    }
  }, [user, navigate, fetchStaticData]);

  // Effect para datos dinámicos (cuando cambian los filtros)
  useEffect(() => {
    if (user && user.role && debouncedFilters) {
      fetchDashboardData();
    }
  }, [user, debouncedFilters, fetchDashboardData]);

  // Effect para aplicar filtros manualmente
  useEffect(() => {
    if (applyFiltersTrigger > 0) {
      fetchDashboardData();
    }
  }, [applyFiltersTrigger, fetchDashboardData]);

  const downloadBitacorasAnomaliasExcel = () => {
    if (bitacorasAnomalias.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    // Prepare data for Excel
    const excelData = bitacorasAnomalias.map((bitacora) => ({
      Cliente: bitacora.cliente || "N/A",
      "No. Bitácora": bitacora.bitacora_id || "N/A",
      "Línea Transporte": bitacora.linea_transporte || "N/A",
      Operador: bitacora.operador || "N/A",
      Origen: bitacora.origen || "N/A",
      Destino: bitacora.destino || "N/A",
      Estado: bitacora.status || "N/A",
      Anomalías:
        bitacora.categorias && bitacora.categorias.length > 0
          ? bitacora.categorias.join(", ")
          : "N/A",
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      {wch: 20}, // Cliente
      {wch: 15}, // No. Bitácora
      {wch: 20}, // Línea Transporte
      {wch: 20}, // Operador
      {wch: 25}, // Origen
      {wch: 25}, // Destino
      {wch: 12}, // Estado
      {wch: 30}, // Anomalías
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bitácoras con Anomalías");

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `Bitacoras_Anomalias_${currentDate}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);
  };

  // Chart rendering functions
  const renderTiposMonitoreoChart = () => {
    const tiposMonitoreo = processedDashboardStats?.tiposMonitoreo || [];

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
    const monthlyData = processedDashboardStats?.monthlyData || [];

    console.log("Monthly data in frontend:", monthlyData);

    // Si no hay datos, mostrar mensaje
    if (monthlyData.length === 0) {
      return (
        <div className="text-center text-muted">
          No hay datos disponibles para el período seleccionado
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
            <span className="summary-label">Total del período:</span>
            <span className="summary-value">{dashboardStats.totalBitacoras} bitácoras</span>
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
  const renderAnomaliasPieChart = () => {
    const eventCategoriesStats = dashboardStats.eventCategoriesStats || [];

    if (eventCategoriesStats.length === 0) {
      return <div className="text-center text-muted">No hay datos de anomalías disponibles</div>;
    }

    // Calculate total for percentages
    const total = eventCategoriesStats.reduce((sum, category) => sum + category.count, 0);

    if (total === 0) {
      return (
        <div className="text-center text-muted">
          No hay eventos registrados en las categorías especificadas
        </div>
      );
    }

    // Prepare data for Chart.js
    const chartData = {
      labels: eventCategoriesStats.map((category) => category.categoria),
      datasets: [
        {
          data: eventCategoriesStats.map((category) => category.count),
          backgroundColor: eventCategoriesStats.map((category) => category.color),
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverBorderWidth: 3,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // We'll create our own legend
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      cutout: "60%", // This makes it a donut chart
    };

    return (
      <div
        className="pie-chart-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}>
        <div
          className="pie-chart"
          style={{
            position: "relative",
            width: "200px",
            height: "200px",
          }}>
          <Doughnut data={chartData} options={chartOptions} />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#374151",
              }}>
              {total}
            </span>
          </div>
        </div>
        <div
          className="pie-legend"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
          {eventCategoriesStats.map((category, index) => {
            const percentage = total > 0 ? ((category.count / total) * 100).toFixed(1) : 0;
            return (
              <div
                key={index}
                className="legend-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                <span
                  className="legend-color"
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "2px",
                    background: category.color,
                  }}></span>
                <span
                  className="legend-text"
                  style={{
                    fontSize: "12px",
                    color: "#ffffff",
                  }}>
                  {category.categoria} - {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOncBarChart = () => {
    if (processedOncEvents.length === 0) {
      return <div className="text-center text-muted">No hay datos de eventos ONC disponibles</div>;
    }

    const maxCount = Math.max(...processedOncEvents.map((event) => event.count));
    const maxHeight = 200; // Altura máxima de las barras en píxeles

    return (
      <div className="bar-chart-container">
        <div
          className="bar-chart"
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            height: "250px",
            padding: "15px 0 35px 0",
          }}>
          {processedOncEvents.map((event, index) => {
            const barHeight = maxCount > 0 ? (event.count / maxCount) * maxHeight : 0;
            return (
              <div
                key={index}
                className="bar-item"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  height: "100%",
                  position: "relative",
                  justifyContent: "flex-end",
                }}>
                <div
                  className="bar"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: event.color,
                    minHeight: event.count > 0 ? "4px" : "0px",
                    width: "100%",
                    maxWidth: "35px",
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.3s ease",
                    marginBottom: "40px",
                    position: "relative",
                  }}>
                  <span
                    className="bar-value"
                    style={{
                      position: "absolute",
                      top: "-25px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: event.color,
                      whiteSpace: "nowrap",
                    }}>
                    {event.count}
                  </span>
                </div>
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
                      cursor: "help",
                      position: "relative",
                    }}
                    title={event.eventName}>
                    {event.initials}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="chart-summary"
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
          }}>
          <div
            className="summary-item"
            style={{display: "flex", justifyContent: "space-between", marginBottom: "5px"}}>
            <span className="summary-label" style={{fontSize: "12px", color: "#6b7280"}}>
              Total eventos ONC:
            </span>
            <span
              className="summary-value"
              style={{fontSize: "12px", fontWeight: "bold", color: "#374151"}}>
              {processedOncEvents.reduce((sum, event) => sum + event.count, 0)} eventos
            </span>
          </div>
          <div className="summary-item" style={{display: "flex", justifyContent: "space-between"}}>
            <span className="summary-label" style={{fontSize: "12px", color: "#6b7280"}}>
              Tipos de eventos:
            </span>
            <span
              className="summary-value"
              style={{fontSize: "12px", fontWeight: "bold", color: "#374151"}}>
              {processedOncEvents.length} tipos
            </span>
          </div>
        </div>
      </div>
    );
  };

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

  const renderBitacorasAnomalias = () => {
    if (bitacorasAnomalias.length === 0) {
      return (
        <div className="text-center text-muted">
          No hay bitácoras con anomalías en el período seleccionado
        </div>
      );
    }

    const getBadgeColor = (categoria) => {
      const colorMap = {
        ENA: "bg-warning",
        ONC: "bg-info",
        FM: "bg-danger",
        DR: "bg-success",
      };
      return colorMap[categoria] || "bg-secondary";
    };

    return (
      <div>
        <div className="table-responsive" style={{maxHeight: "400px", overflowY: "auto"}}>
          <table className="table table-hover table-sm">
            <thead className="sticky-top" style={{backgroundColor: "#f8f9fa"}}>
              <tr>
                <th className="small">Cliente</th>
                <th className="small">No. Bitácora</th>
                <th className="small">Línea Transporte</th>
                <th className="small">Operador</th>
                <th className="small">Origen</th>
                <th className="small">Destino</th>
                <th className="small">Estado</th>
                <th className="small">Anomalías</th>
              </tr>
            </thead>
            <tbody>
              {bitacorasAnomalias.map((bitacora, index) => (
                <tr key={bitacora._id || index}>
                  <td className="small">{bitacora.cliente || "N/A"}</td>
                  <td className="small">{bitacora.bitacora_id || "N/A"}</td>
                  <td className="small">{bitacora.linea_transporte || "N/A"}</td>
                  <td className="small">{bitacora.operador || "N/A"}</td>
                  <td className="small">{bitacora.origen || "N/A"}</td>
                  <td className="small">{bitacora.destino || "N/A"}</td>
                  <td className="small">
                    <span
                      className={`badge ${
                        bitacora.status === "cerrada"
                          ? "bg-success"
                          : bitacora.status === "nueva"
                          ? "bg-warning"
                          : "bg-info"
                      }`}>
                      {bitacora.status || "N/A"}
                    </span>
                  </td>
                  <td className="small">
                    <div className="d-flex flex-wrap gap-1">
                      {bitacora.categorias && bitacora.categorias.length > 0 ? (
                        bitacora.categorias.map((categoria, catIndex) => (
                          <span key={catIndex} className={`badge ${getBadgeColor(categoria)}`}>
                            {categoria}
                          </span>
                        ))
                      ) : (
                        <span className="badge bg-secondary">N/A</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Verificar autenticación antes de renderizar
  if (!user || !user.role) {
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
                <p className="text-muted">Verificando autenticación...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

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
          {/* Título */}
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

            {/* Filtros */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="filter-card">
                  <div className="filter-header d-flex justify-content-end align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      {loading && (
                        <span className="badge bg-warning">
                          <i className="fa fa-spinner fa-spin me-1"></i>
                          Cargando...
                        </span>
                      )}
                      {(fechaDesde ||
                        fechaHasta ||
                        clientFilter !== "all" ||
                        lineaTransporteFilter !== "all" ||
                        operadorFilter !== "all") && (
                        <span className="badge bg-primary">
                          <i className="fa fa-filter me-1"></i>
                          Filtros Activos
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="filter-content">
                    <div className="row g-2 g-md-3 align-items-end">
                      {/* Filtros de fecha primero */}
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="filter-section">
                          <label className="form-label small mb-1">Fecha Desde:</label>
                          <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="filter-select form-control form-control-sm"
                          />
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="filter-section">
                          <label className="form-label small mb-1">Fecha Hasta:</label>
                          <input
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="filter-select form-control form-control-sm"
                          />
                        </div>
                      </div>

                      {/* Filtro de cliente después */}
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="filter-section">
                          <label className="form-label small mb-1">Cliente:</label>
                          <select
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                            className="filter-select form-select form-select-sm">
                            <option value="all">Todos los clientes</option>
                            {availableClients && availableClients.length > 0
                              ? availableClients
                                  .filter((client) => client && client.razon_social)
                                  .sort((a, b) => a.razon_social.localeCompare(b.razon_social))
                                  .map((client) => (
                                    <option key={client._id} value={client.razon_social}>
                                      {client.razon_social}
                                    </option>
                                  ))
                              : null}
                          </select>
                        </div>
                      </div>

                      {/* Filtros de línea de transporte y operador */}
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="filter-section">
                          <label className="form-label small mb-1">Línea Transporte:</label>
                          <select
                            value={lineaTransporteFilter}
                            onChange={(e) => setLineaTransporteFilter(e.target.value)}
                            className="filter-select form-select form-select-sm">
                            <option value="all">Todas las líneas</option>
                            {availableLineasTransporte && availableLineasTransporte.length > 0
                              ? availableLineasTransporte
                                  .filter((linea) => linea && linea.nombre)
                                  .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                  .map((linea) => (
                                    <option key={linea._id} value={linea.nombre}>
                                      {linea.nombre}
                                    </option>
                                  ))
                              : null}
                          </select>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="filter-section">
                          <label className="form-label small mb-1">Operador:</label>
                          <select
                            value={operadorFilter}
                            onChange={(e) => setOperadorFilter(e.target.value)}
                            className="filter-select form-select form-select-sm">
                            <option value="all">Todos los operadores</option>
                            {availableOperadores && availableOperadores.length > 0
                              ? availableOperadores
                                  .filter((operador) => operador && operador.nombre)
                                  .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                  .map((operador) => (
                                    <option key={operador._id} value={operador.nombre}>
                                      {operador.nombre}
                                    </option>
                                  ))
                              : null}
                          </select>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-lg-2">
                        <div className="filter-actions d-flex justify-content-end gap-2">
                          <button
                            className="filter-btn btn btn-outline-primary btn-sm"
                            onClick={() => setApplyFiltersTrigger((prev) => prev + 1)}>
                            <i className="fa fa-check me-1"></i>
                          </button>
                          <button
                            className="filter-btn btn btn-outline-secondary btn-sm"
                            onClick={() => {
                              setClientFilter("all");
                              setFechaDesde("");
                              setFechaHasta("");
                              setLineaTransporteFilter("all");
                              setOperadorFilter("all");
                            }}>
                            <i className="fa fa-refresh me-1"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Totales */}
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

            {/* Tendencia mensual */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6 className="mb-0">Tendencia Mensual</h6>
                  </div>
                  <div className="chart-body">
                    <div className="overflow-auto">{renderMonthlyTrendChart()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* % */}
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
                      "Con Anomalias",
                      "primary"
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Análisis de anomalías */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6 className="mb-0">Análisis de Anomalías</h6>
                  </div>
                  <div className="chart-body">
                    <div className="row g-3">
                      {/* Anomalías Aceptadas - Gráfico de Pie */}
                      <div className="col-12 col-lg-6">
                        <div className="chart-card">
                          <div className="chart-header">
                            <h6 className="mb-0">Anomalías Aceptadas</h6>
                          </div>
                          <div className="chart-body">{renderAnomaliasPieChart()}</div>
                        </div>
                      </div>

                      {/* Operador No Responde - Gráfico de Barras */}
                      <div className="col-12 col-lg-6">
                        <div className="chart-card">
                          <div className="chart-header">
                            <h6 className="mb-0">Operador No Responde</h6>
                          </div>
                          <div className="chart-body">{renderOncBarChart()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de bitácoras con anomalías */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Lista de Bitácoras con Anomalías</h6>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={downloadBitacorasAnomaliasExcel}
                      disabled={bitacorasAnomalias.length === 0}>
                      <i className="fa fa-file-excel me-1"></i>
                      Excel
                    </button>
                  </div>
                  <div className="chart-body">{renderBitacorasAnomalias()}</div>
                </div>
              </div>
            </div>

            {/* Tipos de monitoreo */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6 className="mb-0">Tipos de Monitoreo</h6>
                  </div>
                  <div className="chart-body">
                    <div className="overflow-auto">{renderTiposMonitoreoChart()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista descendente de clientes */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6 className="mb-0">Lista Descendente de Clientes</h6>
                  </div>
                  <div className="chart-body">
                    <div className="overflow-auto">{renderTopClients()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Operadores */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6 className="mb-0">Top Operadores</h6>
                  </div>
                  <div className="chart-body">
                    <div className="overflow-auto">{renderTopOperadores()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Análisis geográfico */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6 className="mb-0">Análisis Geográfico</h6>
                  </div>
                  <div className="chart-body">
                    <div className="overflow-auto">{renderGeographicChart()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actividad reciente */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header">
                    <h6 className="mb-0">Actividad Reciente</h6>
                  </div>
                  <div className="chart-body">
                    <div className="overflow-auto">{renderActivityTimeline()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
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
