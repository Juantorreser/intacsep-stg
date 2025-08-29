import {useState, useEffect, useMemo, useCallback} from "react";
import {useAuth} from "../context/AuthContext";
import {useSidebar} from "../context/SidebarContext";
import {useNavigate} from "react-router-dom";
import Sidebar from "./Sidebar";
import {getAllowedClients} from "../utils/clientPermissions";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import * as XLSX from "xlsx";

const AnomaliasDashboardPage = () => {
  const {user} = useAuth();
  const {isSidebarCollapsed} = useSidebar();
  const navigate = useNavigate();

  const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3001";

  const [roleData, setRoleData] = useState(null);

  // Fetch role permissions
  useEffect(() => {
    const fetchRolePermissions = async () => {
      try {
        const response = await fetch(`${baseUrl}/roles/${user.role}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        setRoleData(data);
      } catch (e) {
        console.log("Error fetching role permissions:", e);
      }
    };

    if (user?.role) {
      fetchRolePermissions();
    }
  }, [user, baseUrl]);

  const [dashboardStats, setDashboardStats] = useState({
    eventCategoriesStats: [],
    lineasTransporteStats: [],
    operadoresStats: [],
    totalAnomalias: 0,
    totalBitacoras: 0,
    totalBitacorasConAnomalias: 0,
  });
  const [oncEventsData, setOncEventsData] = useState([]);
  const [bitacorasAnomalias, setBitacorasAnomalias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [availableClients, setAvailableClients] = useState([]);
  const [availableLineasTransporte, setAvailableLineasTransporte] = useState([]);
  const [availableOperadores, setAvailableOperadores] = useState([]);
  const [applyFiltersTrigger, setApplyFiltersTrigger] = useState(0);
  const [loadingLineasTransporte, setLoadingLineasTransporte] = useState(false);
  const [loadingOperadores, setLoadingOperadores] = useState(false);

  // Estados para controlar las vistas de las gráficas
  const [lineasViewMode, setLineasViewMode] = useState("pie"); // 'pie' or 'bar'
  const [operadoresViewMode, setOperadoresViewMode] = useState("pie"); // 'pie' or 'bar'

  // Function to fetch transport lines filtered by client
  const fetchLineasTransporte = useCallback(
    async (cliente = "all") => {
      try {
        setLoadingLineasTransporte(true);
        let lineasData = [];

        // Only fetch transport lines if a specific client is selected (not "all")
        if (cliente && cliente !== "all") {
          try {
            const lineasResponse = await fetch(
              `${baseUrl}/lineas-transporte?cliente=${encodeURIComponent(cliente)}`,
              {
                method: "GET",
                credentials: "include",
              }
            );
            if (lineasResponse.ok) {
              const newLineasData = await lineasResponse.json();
              lineasData = newLineasData.map((linea) => ({
                _id: linea._id,
                nombre: linea.nombre,
              }));
            }
          } catch (error) {
            console.warn("New transport lines endpoint not available:", error);
          }
        }

        // Only use data from the LineaTransporte model, not from bitacoras
        // This ensures we only show transport lines that exist in the database

        setAvailableLineasTransporte(lineasData);
      } catch (error) {
        console.error("Error fetching transport lines:", error);
        setAvailableLineasTransporte([]);
      } finally {
        setLoadingLineasTransporte(false);
      }
    },
    [baseUrl]
  );

  // Function to fetch operators filtered by transport line
  const fetchOperadores = useCallback(
    async (lineaTransporte = "all") => {
      try {
        setLoadingOperadores(true);
        let operadoresData = [];

        // Only fetch operators if a specific transport line is selected (not "all")
        if (lineaTransporte && lineaTransporte !== "all") {
          try {
            const operadoresResponse = await fetch(
              `${baseUrl}/operadores?lineaTransporte=${encodeURIComponent(lineaTransporte)}`,
              {
                method: "GET",
                credentials: "include",
              }
            );
            if (operadoresResponse.ok) {
              const newOperadoresData = await operadoresResponse.json();
              operadoresData = newOperadoresData.map((operador) => ({
                _id: operador._id,
                nombre: operador.nombre || operador.name || "",
              }));
            }
          } catch (error) {
            console.warn("New operators endpoint not available:", error);
          }
        }

        // Only use data from the Operador model, not from bitacoras
        // This ensures we only show operators that exist in the database

        setAvailableOperadores(operadoresData);
      } catch (error) {
        console.error("Error fetching operators:", error);
        setAvailableOperadores([]);
      } finally {
        setLoadingOperadores(false);
      }
    },
    [baseUrl]
  );

  // Filtros pendientes
  const [clientFilter, setClientFilter] = useState("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [lineaTransporteFilter, setLineaTransporteFilter] = useState("all");
  const [operadorFilter, setOperadorFilter] = useState("all");

  // Filtros aplicados
  const [appliedClientFilter, setAppliedClientFilter] = useState("all");
  const [appliedFechaDesde, setAppliedFechaDesde] = useState("");
  const [appliedFechaHasta, setAppliedFechaHasta] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [appliedLineaTransporteFilter, setAppliedLineaTransporteFilter] = useState("all");
  const [appliedOperadorFilter, setAppliedOperadorFilter] = useState("all");

  // Pagination for anomalies table
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Function to apply filters when check button is pressed
  const applyFilters = () => {
    setAppliedClientFilter(clientFilter);
    setAppliedFechaDesde(fechaDesde);
    setAppliedFechaHasta(fechaHasta);
    setAppliedLineaTransporteFilter(lineaTransporteFilter);
    setAppliedOperadorFilter(operadorFilter);
    setApplyFiltersTrigger((prev) => prev + 1);
    setPage(0); // Reset pagination
  };

  // Function to reset filters
  const resetFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setClientFilter("all");
    setFechaDesde("");
    setFechaHasta(today);
    setLineaTransporteFilter("all");
    setOperadorFilter("all");
  };

  // Function to handle transport line selection from pie chart
  const handleLineaTransporteClick = (data) => {
    if (data && data.lineaTransporte) {
      setLineaTransporteFilter(data.lineaTransporte);
      setAppliedLineaTransporteFilter(data.lineaTransporte);
      setApplyFiltersTrigger((prev) => prev + 1);
    }
  };

  // Function to handle operator selection from pie chart
  const handleOperadorClick = (data) => {
    if (data && data.operador) {
      setOperadorFilter(data.operador);
      setAppliedOperadorFilter(data.operador);
      setApplyFiltersTrigger((prev) => prev + 1);
    }
  };

  // Helper function to format numbers with thousands separator
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Helper function to get anomaly color (matching dashboard colors)
  const getAnomaliaColor = (categoria) => {
    const colorMap = {
      ENA: "#3b82f6", // Blue (same as dashboard)
      FM: "#10b981", // Green (same as dashboard)
      ONC: "#f59e0b", // Orange (same as dashboard)
      DR: "#ef4444", // Red (same as dashboard)
    };
    return colorMap[categoria] || "#6b7280";
  };

  const downloadBitacorasAnomaliasExcel = (filteredData) => {
    if (!filteredData || filteredData.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const excelData = filteredData.map((bitacora) => ({
      "No. Bitácora": bitacora.bitacora_id || "N/A",
      Cliente: bitacora.cliente || "N/A",
      Anomalías:
        bitacora.categorias && bitacora.categorias.length > 0
          ? bitacora.categorias.join(", ")
          : "N/A",
      "Línea Transporte": bitacora.linea_transporte || "N/A",
      Operador: bitacora.operador || "N/A",
      Origen: bitacora.origen || "N/A",
      Destino: bitacora.destino || "N/A",
      Estado: bitacora.status || "N/A",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      {wch: 15},
      {wch: 20},
      {wch: 30},
      {wch: 20},
      {wch: 20},
      {wch: 25},
      {wch: 25},
      {wch: 12},
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Bitácoras con Anomalías");

    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `Bitacoras_Anomalias_${currentDate}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const fetchDashboardData = useCallback(
    async (isInitialLoad = true) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setFilterLoading(true);
        }

        // Fetch available clients for filter (only on initial load)
        if (isInitialLoad) {
          const clientsResponse = await fetch(`${baseUrl}/clients`, {
            method: "GET",
            credentials: "include",
          });
          if (clientsResponse.ok) {
            const allClientsData = await clientsResponse.json();
            // Apply client permissions filtering
            const allowedClientsData = getAllowedClients(roleData, allClientsData);
            setAvailableClients(allowedClientsData);
          }
        }

        // Fetch dashboard statistics with filters for anomalías
        const statsUrl = `${baseUrl}/dashboard/anomalias-stats?clientFilter=${encodeURIComponent(
          appliedClientFilter
        )}&fechaDesde=${encodeURIComponent(appliedFechaDesde)}&fechaHasta=${encodeURIComponent(
          appliedFechaHasta
        )}&lineaTransporte=${encodeURIComponent(
          appliedLineaTransporteFilter
        )}&operador=${encodeURIComponent(appliedOperadorFilter)}`;

        const statsResponse = await fetch(statsUrl, {
          method: "GET",
          credentials: "include",
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDashboardStats(statsData);
        }

        // Fetch transport lines anomalies statistics
        const lineasTransporteStatsUrl = `${baseUrl}/dashboard/lineas-transporte-stats?clientFilter=${encodeURIComponent(
          appliedClientFilter
        )}&fechaDesde=${encodeURIComponent(appliedFechaDesde)}&fechaHasta=${encodeURIComponent(
          appliedFechaHasta
        )}&lineaTransporte=${encodeURIComponent(
          appliedLineaTransporteFilter
        )}&operador=${encodeURIComponent(appliedOperadorFilter)}`;

        const lineasTransporteStatsResponse = await fetch(lineasTransporteStatsUrl, {
          method: "GET",
          credentials: "include",
        });

        if (lineasTransporteStatsResponse.ok) {
          const lineasTransporteStatsData = await lineasTransporteStatsResponse.json();
          setDashboardStats((prev) => ({
            ...prev,
            lineasTransporteStats: lineasTransporteStatsData,
          }));
        }

        // Fetch operators anomalies statistics
        const operadoresStatsUrl = `${baseUrl}/dashboard/operadores-stats?clientFilter=${encodeURIComponent(
          appliedClientFilter
        )}&fechaDesde=${encodeURIComponent(appliedFechaDesde)}&fechaHasta=${encodeURIComponent(
          appliedFechaHasta
        )}&lineaTransporte=${encodeURIComponent(
          appliedLineaTransporteFilter
        )}&operador=${encodeURIComponent(appliedOperadorFilter)}`;

        const operadoresStatsResponse = await fetch(operadoresStatsUrl, {
          method: "GET",
          credentials: "include",
        });

        if (operadoresStatsResponse.ok) {
          const operadoresStatsData = await operadoresStatsResponse.json();
          setDashboardStats((prev) => ({
            ...prev,
            operadoresStats: operadoresStatsData,
          }));
        }

        // Fetch event categories anomalies statistics
        const eventCategoriesStatsUrl = `${baseUrl}/dashboard/event-categories-stats?clientFilter=${encodeURIComponent(
          appliedClientFilter
        )}&fechaDesde=${encodeURIComponent(appliedFechaDesde)}&fechaHasta=${encodeURIComponent(
          appliedFechaHasta
        )}&lineaTransporte=${encodeURIComponent(
          appliedLineaTransporteFilter
        )}&operador=${encodeURIComponent(appliedOperadorFilter)}`;

        const eventCategoriesStatsResponse = await fetch(eventCategoriesStatsUrl, {
          method: "GET",
          credentials: "include",
        });

        if (eventCategoriesStatsResponse.ok) {
          const eventCategoriesStatsData = await eventCategoriesStatsResponse.json();
          setDashboardStats((prev) => ({
            ...prev,
            eventCategoriesStats: eventCategoriesStatsData,
          }));
        }

        // Fetch ONC events data for bar chart
        const oncResponse = await fetch(
          `${baseUrl}/dashboard/onc-events?clientFilter=${encodeURIComponent(
            appliedClientFilter
          )}&fechaDesde=${encodeURIComponent(appliedFechaDesde)}&fechaHasta=${encodeURIComponent(
            appliedFechaHasta
          )}&lineaTransporte=${encodeURIComponent(
            appliedLineaTransporteFilter
          )}&operador=${encodeURIComponent(appliedOperadorFilter)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (oncResponse.ok) {
          const oncData = await oncResponse.json();
          setOncEventsData(oncData);
        }

        // Fetch bitácoras con anomalías
        const anomaliasResponse = await fetch(
          `${baseUrl}/dashboard/bitacoras-anomalias?clientFilter=${encodeURIComponent(
            appliedClientFilter
          )}&fechaDesde=${encodeURIComponent(appliedFechaDesde)}&fechaHasta=${encodeURIComponent(
            appliedFechaHasta
          )}&lineaTransporte=${encodeURIComponent(
            appliedLineaTransporteFilter
          )}&operador=${encodeURIComponent(appliedOperadorFilter)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (anomaliasResponse.ok) {
          const anomaliasData = await anomaliasResponse.json();
          setBitacorasAnomalias(anomaliasData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        } else {
          setFilterLoading(false);
        }
      }
    },
    [
      baseUrl,
      appliedClientFilter,
      appliedFechaDesde,
      appliedFechaHasta,
      appliedLineaTransporteFilter,
      appliedOperadorFilter,
    ]
  );

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Only fetch dashboard data when roleData is available
    if (roleData) {
      // Initial load
      if (applyFiltersTrigger === 0) {
        fetchDashboardData(true);
      } else {
        // Filter updates
        fetchDashboardData(false);
      }
    }
  }, [user, navigate, fetchDashboardData, applyFiltersTrigger, roleData]);

  // Update transport lines when client filter changes
  useEffect(() => {
    if (user) {
      fetchLineasTransporte(clientFilter);
    }
  }, [user, clientFilter, fetchLineasTransporte]);

  // Update operators when transport line filter changes
  useEffect(() => {
    if (user) {
      fetchOperadores(lineaTransporteFilter);
    }
  }, [user, lineaTransporteFilter, fetchOperadores]);

  // Memoize filtered data calculation
  // Since the backend now applies catalog validation and filtering, we trust the backend data
  // The backend should return only the data that matches the applied filters
  const filteredAnomaliasData = useMemo(() => {
    // The backend should already be filtering based on catalog validation and applied filters
    // We trust the backend data and don't apply additional filtering
    return bitacorasAnomalias;
  }, [
    bitacorasAnomalias,
    appliedClientFilter,
    appliedLineaTransporteFilter,
    appliedOperadorFilter,
  ]);

  // Pagination for filtered data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAnomaliasData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAnomaliasData, page, rowsPerPage]);

  // Custom tooltip for pie charts
  const CustomTooltip = ({active, payload, label}) => {
    if (active && payload && payload.length) {
      const totalAnomalias =
        payload[0].payload?.totalAnomalias ||
        dashboardStats.lineasTransporteStats?.reduce((sum, stat) => sum + stat.anomalias, 0) ||
        0;
      return (
        <div
          style={{
            padding: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #ddd",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}>
          <div className="small text-muted">{label}</div>
          <div className="h6 text-primary">{formatNumber(payload[0].value)} bitácoras</div>
          <div className="small text-muted">
            {totalAnomalias > 0 ? ((payload[0].value / totalAnomalias) * 100).toFixed(1) : 0}% del
            total
          </div>
        </div>
      );
    }
    return null;
  };

  // Render transport lines anomalies pie chart
  const renderLineasTransportePieChart = () => {
    const lineasTransporteStats = dashboardStats.lineasTransporteStats || [];

    // Debug logging
    if (lineasTransporteStats.length > 0) {
      console.log("[DEBUG] Frontend transport lines stats:", {
        appliedClientFilter,
        appliedLineaTransporteFilter,
        lineasTransporteStatsLength: lineasTransporteStats.length,
        lineasTransporteStats: lineasTransporteStats.slice(0, 3),
      });
    } else {
      console.log(
        "[DEBUG] Frontend: No transport lines stats received for client:",
        appliedClientFilter,
        "linea:",
        appliedLineaTransporteFilter
      );
    }

    if (lineasTransporteStats.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fa fa-check-circle fa-3x mb-3" style={{opacity: 0.3}}></i>
          <h6>Sin Anomalías Detectadas</h6>
          <p className="small">
            {appliedLineaTransporteFilter !== "all"
              ? `No se encontraron anomalías para la línea de transporte "${appliedLineaTransporteFilter}"`
              : appliedClientFilter !== "all"
              ? "No se encontraron líneas de transporte con anomalías para el cliente seleccionado"
              : "No se encontraron líneas de transporte con anomalías en el sistema"}
          </p>
        </div>
      );
    }

    // Filter data based on applied filters
    let statsToUse = lineasTransporteStats;

    // If a specific client is selected, filter by client
    if (appliedClientFilter !== "all") {
      statsToUse = statsToUse.filter((stat) => stat.cliente === appliedClientFilter);
    }

    // If a specific transport line is selected, filter by transport line
    if (appliedLineaTransporteFilter !== "all") {
      statsToUse = statsToUse.filter(
        (stat) => stat.lineaTransporte === appliedLineaTransporteFilter
      );
    }

    // Sort by bitacoras count (descending) and limit to top 15 for better visualization
    const sortedStats = statsToUse.sort((a, b) => b.bitacoras - a.bitacoras).slice(0, 15);

    // Group remaining transport lines into "Otros" category if there are more than 15
    let chartData = sortedStats.map((stat) => ({
      name: stat.lineaTransporte,
      value: stat.bitacoras, // Usar bitacoras únicas en lugar de anomalias totales
      color: stat.color,
      lineaTransporte: stat.lineaTransporte,
      totalAnomalias: statsToUse.reduce((sum, s) => sum + s.bitacoras, 0), // Usar bitacoras únicas
    }));

    // Add "Otros" category if there are more than 15 transport lines
    if (statsToUse.length > 15) {
      const othersBitacoras = statsToUse.slice(15).reduce((sum, stat) => sum + stat.bitacoras, 0);

      if (othersBitacoras > 0) {
        chartData.push({
          name: `Otros (${statsToUse.length - 15} líneas)`,
          value: othersBitacoras,
          color: "#94a3b8", // Gray color for "Others"
          lineaTransporte: "otros",
          totalAnomalias: statsToUse.reduce((sum, s) => sum + s.bitacoras, 0),
        });
      }
    }

    return (
      <div>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
                name,
                value,
                index,
              }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                // Only show labels for segments with more than 5% or top 5
                const isTop5 = index < 5;
                const hasSignificantPercentage = percent > 0.05;

                if (isTop5 || hasSignificantPercentage) {
                  const displayText = `${
                    name.length > 15 ? name.substring(0, 15) + "..." : name
                  } (${value})`;
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      fontSize="11px"
                      fontWeight="500">
                      {displayText}
                    </text>
                  );
                }
                return null;
              }}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              onClick={handleLineaTransporteClick}
              style={{cursor: "pointer"}}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Enhanced legend with better formatting */}
        <div className="mt-3">
          <div className="row">
            {chartData.map((entry, index) => (
              <div key={index} className="col-6 col-md-4 mb-2">
                <div className="d-flex align-items-center">
                  <div
                    className="legend-color me-2"
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: entry.color,
                      borderRadius: "2px",
                      flexShrink: 0,
                    }}
                  />
                  <div className="legend-text" style={{fontSize: "11px", lineHeight: "1.2"}}>
                    <div className="fw-semibold">
                      {entry.name.length > 20 ? entry.name.substring(0, 20) + "..." : entry.name}
                    </div>
                    <div className="text-muted" style={{fontSize: "10px"}}>
                      {entry.value} bitácoras
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary information */}
          <div className="mt-3 p-2 bg-light rounded" style={{fontSize: "12px"}}>
            <div className="row text-center">
              <div className="col-4">
                <div className="fw-bold text-primary">{chartData.length}</div>
                <div className="text-muted">Categorías</div>
              </div>
              <div className="col-4">
                <div className="fw-bold text-success">{filteredAnomaliasData.length}</div>
                <div className="text-muted">Total Bitácoras</div>
              </div>
              <div className="col-4">
                <div className="fw-bold text-info">
                  {statsToUse.length > 15 ? statsToUse.length - 15 : 0}
                </div>
                <div className="text-muted">En &quot;Otros&quot;</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render operators anomalies pie chart
  const renderOperadoresPieChart = () => {
    const operadoresStats = dashboardStats.operadoresStats || [];

    if (operadoresStats.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fa fa-check-circle fa-3x mb-3" style={{opacity: 0.3}}></i>
          <h6>Sin Anomalías Detectadas</h6>
          <p className="small">
            {appliedLineaTransporteFilter !== "all"
              ? `No se encontraron operadores con anomalías para la línea de transporte "${appliedLineaTransporteFilter}"`
              : appliedClientFilter !== "all"
              ? "No se encontraron operadores con anomalías para el cliente seleccionado"
              : "No se encontraron operadores con anomalías en el sistema"}
          </p>
        </div>
      );
    }

    // Filter data based on applied filters
    let filteredStats = operadoresStats;

    // If a specific client is selected, filter by client
    if (appliedClientFilter !== "all") {
      filteredStats = filteredStats.filter((stat) => stat.cliente === appliedClientFilter);
    }

    // If a specific transport line is selected, filter by transport line
    if (appliedLineaTransporteFilter !== "all") {
      filteredStats = filteredStats.filter(
        (stat) => stat.lineaTransporte === appliedLineaTransporteFilter
      );
    }

    if (filteredStats.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fa fa-check-circle fa-3x mb-3" style={{opacity: 0.3}}></i>
          <h6>Sin Anomalías Detectadas</h6>
          <p className="small">
            {appliedLineaTransporteFilter !== "all"
              ? `No se encontraron operadores con anomalías para la línea de transporte "${appliedLineaTransporteFilter}"`
              : appliedClientFilter !== "all"
              ? "No se encontraron operadores con anomalías para el cliente seleccionado"
              : "No se encontraron operadores con anomalías en el sistema"}
          </p>
        </div>
      );
    }

    // Transform data for Recharts format
    // If a specific operator is selected, show only that one
    const statsToUse =
      appliedOperadorFilter !== "all"
        ? filteredStats.filter((stat) => stat.operador === appliedOperadorFilter)
        : filteredStats;

    // Sort by bitacoras count (descending) and limit to top 15 for better visualization
    const sortedStats = statsToUse.sort((a, b) => b.bitacoras - a.bitacoras).slice(0, 15);

    // Group remaining operators into "Otros" category if there are more than 15
    let chartData = sortedStats.map((stat) => ({
      name: stat.operador,
      value: stat.bitacoras, // Usar bitacoras únicas en lugar de anomalias totales
      color: stat.color,
      operador: stat.operador,
      totalAnomalias: statsToUse.reduce((sum, s) => sum + s.bitacoras, 0), // Usar bitacoras únicas
    }));

    // Add "Otros" category if there are more than 15 operators
    if (statsToUse.length > 15) {
      const othersBitacoras = statsToUse.slice(15).reduce((sum, stat) => sum + stat.bitacoras, 0);

      if (othersBitacoras > 0) {
        chartData.push({
          name: `Otros (${statsToUse.length - 15} operadores)`,
          value: othersBitacoras,
          color: "#94a3b8", // Gray color for "Others"
          operador: "otros",
          totalAnomalias: statsToUse.reduce((sum, s) => sum + s.bitacoras, 0),
        });
      }
    }

    return (
      <div>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
                name,
                value,
                index,
              }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                // Only show labels for segments with more than 5% or top 5
                const isTop5 = index < 5;
                const hasSignificantPercentage = percent > 0.05;

                if (isTop5 || hasSignificantPercentage) {
                  const displayText = `${
                    name.length > 15 ? name.substring(0, 15) + "..." : name
                  } (${value})`;
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      fontSize="11px"
                      fontWeight="500">
                      {displayText}
                    </text>
                  );
                }
                return null;
              }}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              onClick={handleOperadorClick}
              style={{cursor: "pointer"}}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Enhanced legend with better formatting */}
        <div className="mt-3">
          <div className="row">
            {chartData.map((entry, index) => (
              <div key={index} className="col-6 col-md-4 mb-2">
                <div className="d-flex align-items-center">
                  <div
                    className="legend-color me-2"
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: entry.color,
                      borderRadius: "2px",
                      flexShrink: 0,
                    }}
                  />
                  <div className="legend-text" style={{fontSize: "11px", lineHeight: "1.2"}}>
                    <div className="fw-semibold">
                      {entry.name.length > 20 ? entry.name.substring(0, 20) + "..." : entry.name}
                    </div>
                    <div className="text-muted" style={{fontSize: "10px"}}>
                      {entry.value} bitácoras
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary information */}
          <div className="mt-3 p-2 bg-light rounded" style={{fontSize: "12px"}}>
            <div className="row text-center">
              <div className="col-4">
                <div className="fw-bold text-primary">{chartData.length}</div>
                <div className="text-muted">Categorías</div>
              </div>
              <div className="col-4">
                <div className="fw-bold text-success">{filteredAnomaliasData.length}</div>
                <div className="text-muted">Total Bitácoras</div>
              </div>
              <div className="col-4">
                <div className="fw-bold text-info">
                  {statsToUse.length > 15 ? statsToUse.length - 15 : 0}
                </div>
                <div className="text-muted">En &quot;Otros&quot;</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render transport lines anomalies bar chart
  const renderLineasTransporteBarChart = () => {
    const lineasTransporteStats = dashboardStats.lineasTransporteStats || [];

    if (lineasTransporteStats.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fa fa-check-circle fa-3x mb-3" style={{opacity: 0.3}}></i>
          <h6>Sin Anomalías Detectadas</h6>
          <p className="small">
            {appliedLineaTransporteFilter !== "all"
              ? `No se encontraron anomalías para la línea de transporte "${appliedLineaTransporteFilter}"`
              : appliedClientFilter !== "all"
              ? "No se encontraron líneas de transporte con anomalías para el cliente seleccionado"
              : "No se encontraron líneas de transporte con anomalías en el sistema"}
          </p>
        </div>
      );
    }

    // Filter data based on applied filters
    let statsToUse = lineasTransporteStats;

    // If a specific client is selected, filter by client
    if (appliedClientFilter !== "all") {
      statsToUse = statsToUse.filter((stat) => stat.cliente === appliedClientFilter);
    }

    // If a specific transport line is selected, filter by transport line
    if (appliedLineaTransporteFilter !== "all") {
      statsToUse = statsToUse.filter(
        (stat) => stat.lineaTransporte === appliedLineaTransporteFilter
      );
    }

    // Sort by bitacoras count (descending) and show ALL data for scrollable view
    const chartData = statsToUse.sort((a, b) => b.bitacoras - a.bitacoras);

    const maxBitacoras = Math.max(...chartData.map((item) => item.bitacoras));

    return (
      <div>
        <div
          className="custom-bar-chart"
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            paddingRight: "8px",
          }}>
          {chartData.map((item, index) => {
            const percentage = maxBitacoras > 0 ? (item.bitacoras / maxBitacoras) * 100 : 0;
            return (
              <div
                key={index}
                className="bar-row"
                onClick={() => handleLineaTransporteClick({lineaTransporte: item.lineaTransporte})}
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title={`${item.lineaTransporte}: ${formatNumber(
                  item.bitacoras
                )} bitácoras con anomalías`}>
                <div
                  className="bar-label"
                  style={{
                    fontSize: "11px",
                    fontWeight: "500",
                    color: "#ffffff",
                    marginBottom: "4px",
                  }}>
                  {item.lineaTransporte.length > 25
                    ? item.lineaTransporte.substring(0, 25) + "..."
                    : item.lineaTransporte}
                </div>
                <div className="bar-container" style={{marginBottom: "4px"}}>
                  <div
                    className="bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                      borderRadius: "4px",
                      transition: "width 0.3s ease",
                      height: "20px",
                      minWidth: "4px",
                    }}></div>
                </div>
                <div
                  className="bar-value"
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#ffffff",
                    textAlign: "right",
                  }}>
                  {formatNumber(item.bitacoras)} bitácoras
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary information */}
        <div className="mt-3 p-3 bg-light rounded" style={{fontSize: "12px"}}>
          <div className="row text-center">
            <div className="col-4">
              <div className="fw-bold text-primary">{chartData.length}</div>
              <div className="text-muted">Líneas</div>
            </div>
            <div className="col-4">
              <div className="fw-bold text-success">{filteredAnomaliasData.length}</div>
              <div className="text-muted">Total Bitácoras</div>
            </div>
            <div className="col-4">
              <div className="fw-bold text-info">
                <i className="fa fa-scroll me-1"></i>
                Scroll
              </div>
              <div className="text-muted">Disponible</div>
            </div>
          </div>

          {/* Info about scrollable content */}
          <div className="mt-2 text-center">
            <small className="text-muted">
              <i className="fa fa-info-circle me-1"></i>
              Mostrando todas las {chartData.length} líneas de transporte
            </small>
          </div>
        </div>
      </div>
    );
  };

  // Render operators anomalies bar chart
  const renderOperadoresBarChart = () => {
    const operadoresStats = dashboardStats.operadoresStats || [];

    if (operadoresStats.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fa fa-check-circle fa-3x mb-3" style={{opacity: 0.3}}></i>
          <h6>Sin Anomalías Detectadas</h6>
          <p className="small">
            {appliedLineaTransporteFilter !== "all"
              ? `No se encontraron operadores con anomalías para la línea de transporte "${appliedLineaTransporteFilter}"`
              : appliedClientFilter !== "all"
              ? "No se encontraron operadores con anomalías para el cliente seleccionado"
              : "No se encontraron operadores con anomalías en el sistema"}
          </p>
        </div>
      );
    }

    // Filter data based on applied filters
    let filteredStats = operadoresStats;

    // If a specific client is selected, filter by client
    if (appliedClientFilter !== "all") {
      filteredStats = filteredStats.filter((stat) => stat.cliente === appliedClientFilter);
    }

    // If a specific transport line is selected, filter by transport line
    if (appliedLineaTransporteFilter !== "all") {
      filteredStats = filteredStats.filter(
        (stat) => stat.lineaTransporte === appliedLineaTransporteFilter
      );
    }

    if (filteredStats.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fa fa-check-circle fa-3x mb-3" style={{opacity: 0.3}}></i>
          <h6>Sin Anomalías Detectadas</h6>
          <p className="small">
            {appliedLineaTransporteFilter !== "all"
              ? `No se encontraron operadores con anomalías para la línea de transporte "${appliedLineaTransporteFilter}"`
              : appliedClientFilter !== "all"
              ? "No se encontraron operadores con anomalías para el cliente seleccionado"
              : "No se encontraron operadores con anomalías en el sistema"}
          </p>
        </div>
      );
    }

    // Sort by bitacoras count (descending) and show ALL data for scrollable view
    // If a specific operator is selected, show only that one
    const chartData =
      appliedOperadorFilter !== "all"
        ? filteredStats.filter((stat) => stat.operador === appliedOperadorFilter)
        : filteredStats.sort((a, b) => b.bitacoras - a.bitacoras);

    const maxBitacoras = Math.max(...chartData.map((item) => item.bitacoras));

    return (
      <div>
        <div
          className="custom-bar-chart"
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            paddingRight: "8px",
          }}>
          {chartData.map((item, index) => {
            const percentage = maxBitacoras > 0 ? (item.bitacoras / maxBitacoras) * 100 : 0;
            return (
              <div
                key={index}
                className="bar-row"
                onClick={() => handleOperadorClick({operador: item.operador})}
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title={`${item.operador}: ${formatNumber(item.bitacoras)} bitácoras con anomalías`}>
                <div
                  className="bar-label"
                  style={{
                    fontSize: "11px",
                    fontWeight: "500",
                    color: "#ffffff",
                    marginBottom: "4px",
                  }}>
                  {item.operador.length > 25
                    ? item.operador.substring(0, 25) + "..."
                    : item.operador}
                </div>
                <div className="bar-container" style={{marginBottom: "4px"}}>
                  <div
                    className="bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                      borderRadius: "4px",
                      transition: "width 0.3s ease",
                      height: "20px",
                      minWidth: "4px",
                    }}></div>
                </div>
                <div
                  className="bar-value"
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#ffffff",
                    textAlign: "right",
                  }}>
                  {formatNumber(item.bitacoras)} bitácoras
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary information */}
        <div className="mt-3 p-3 bg-light rounded" style={{fontSize: "12px"}}>
          <div className="row text-center">
            <div className="col-4">
              <div className="fw-bold text-primary">{chartData.length}</div>
              <div className="text-muted">Operadores</div>
            </div>
            <div className="col-4">
              <div className="fw-bold text-success">{filteredAnomaliasData.length}</div>
              <div className="text-muted">Total Bitácoras</div>
            </div>
            <div className="col-4">
              <div className="fw-bold text-info">
                <i className="fa fa-scroll me-1"></i>
                Scroll
              </div>
              <div className="text-muted">Disponible</div>
            </div>
          </div>

          {/* Info about scrollable content */}
          <div className="mt-2 text-center">
            <small className="text-muted">
              <i className="fa fa-info-circle me-1"></i>
              Mostrando todos los {chartData.length} operadores
            </small>
          </div>
        </div>
      </div>
    );
  };

  // Render event categories bar chart
  const renderEventCategoriesBarChart = () => {
    const eventCategoriesStatsData = dashboardStats.eventCategoriesStats || [];

    if (eventCategoriesStatsData.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fa fa-check-circle fa-3x mb-3" style={{opacity: 0.3}}></i>
          <h6>Sin Anomalías Detectadas</h6>
          <p className="small">No se encontraron anomalías en las categorías especificadas</p>
        </div>
      );
    }

    // Sort by count (descending)
    const chartData = eventCategoriesStatsData.sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...chartData.map((item) => item.count));

    return (
      <div className="custom-bar-chart">
        {chartData.map((item, index) => {
          const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const categoryName =
            item.categoria === "ENA"
              ? "Estadia no autorizada"
              : item.categoria === "FM"
              ? "Falla mecánica"
              : item.categoria === "ONC"
              ? "Usuario no responde"
              : item.categoria === "DR"
              ? "Desvío de ruta"
              : item.categoria;

          return (
            <div key={index} className="bar-row" style={{cursor: "default"}}>
              <div className="bar-label">{categoryName}</div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                  }}></div>
              </div>
              <div className="bar-value">{formatNumber(item.count)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render event categories pie chart
  const renderEventCategoriesPieChart = () => {
    const eventCategoriesStatsData = dashboardStats.eventCategoriesStats || [];

    if (eventCategoriesStatsData.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fa fa-check-circle fa-3x mb-3" style={{opacity: 0.3}}></i>
          <h6>Sin Eventos Registrados</h6>
          <p className="small">No hay eventos registrados en las categorías especificadas</p>
        </div>
      );
    }

    const chartData = eventCategoriesStatsData.map((category) => ({
      name:
        category.categoria === "ENA"
          ? "Estadia no autorizada"
          : category.categoria === "FM"
          ? "Falla mecánica"
          : category.categoria === "ONC"
          ? "Usuario no responde"
          : category.categoria === "DR"
          ? "Desvío de ruta"
          : category.categoria,
      value: category.count,
      color: category.color,
    }));

    return (
      <ResponsiveContainer width="100%" height={500}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={180}
            fill="#8884d8"
            dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render ONC events bar chart
  const renderOncBarChart = () => {
    if (oncEventsData.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fa fa-user fa-3x mb-3" style={{opacity: 0.3}}></i>
          <h6>Sin Eventos ONC</h6>
          <p className="small">No hay eventos de &quot;Usuario No Responde&quot; registrados</p>
        </div>
      );
    }

    const chartData = oncEventsData.map((event) => ({
      name: event.initials,
      eventos: event.count,
      color: event.color,
      fullName: event.eventName,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value, name, props) => {
              const data = chartData.find((item) => item.name === props.payload.name);
              return [`${formatNumber(value)} eventos`, data ? data.fullName : "Evento"];
            }}
            labelFormatter={(label) => {
              const data = chartData.find((item) => item.name === label);
              return data ? data.fullName : label;
            }}
          />
          <Bar dataKey="eventos" fill="#8884d8">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render anomalies table
  const renderAnomaliasTable = () => {
    if (bitacorasAnomalias.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fa fa-check-circle fa-3x mb-3" style={{opacity: 0.3}}></i>
          <h6>Sin Anomalías Registradas</h6>
          <p className="small">No hay bitácoras con anomalías en el período seleccionado</p>
        </div>
      );
    }

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case "cerrada":
          return "danger";
        case "nueva":
          return "warning";
        case "iniciada":
          return "primary";
        case "validada":
          return "info";
        case "finalizada":
          return "secondary";
        default:
          return "secondary";
      }
    };

    return (
      <div>
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>No. Bitácora</th>
                <th>Cliente</th>
                <th>Anomalías</th>
                <th>Línea Transporte</th>
                <th>Operador</th>
                <th>Origen</th>
                <th>Destino</th>
                <th className="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((bitacora, index) => (
                <tr key={bitacora._id || index}>
                  <td>
                    <span className="small fw-medium">{bitacora.bitacora_id || "N/A"}</span>
                  </td>
                  <td>
                    <span className="small">{bitacora.cliente || "N/A"}</span>
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {bitacora.categorias && bitacora.categorias.length > 0 ? (
                        bitacora.categorias.map((categoria, catIndex) => (
                          <span
                            key={catIndex}
                            className="badge"
                            style={{
                              backgroundColor: getAnomaliaColor(categoria),
                              color: "white",
                              fontSize: "0.7rem",
                            }}>
                            {categoria}
                          </span>
                        ))
                      ) : (
                        <span className="badge bg-secondary">N/A</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="small">{bitacora.linea_transporte || "N/A"}</span>
                  </td>
                  <td>
                    <span className="small">{bitacora.operador || "N/A"}</span>
                  </td>
                  <td>
                    <span className="small">{bitacora.origen || "N/A"}</span>
                  </td>
                  <td>
                    <span className="small">{bitacora.destino || "N/A"}</span>
                  </td>
                  <td className="text-center">
                    <span className={`badge bg-${getStatusColor(bitacora.status)}`}>
                      {bitacora.status || "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="d-flex align-items-center gap-3">
            <span className="small text-white">Filas por página:</span>
            <select
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              className="form-select form-select-sm"
              style={{width: "auto"}}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="small text-white">
              Total: {filteredAnomaliasData.length} bitácoras
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-white">
              {page * rowsPerPage + 1}-
              {Math.min((page + 1) * rowsPerPage, filteredAnomaliasData.length)} de{" "}
              {filteredAnomaliasData.length}
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}>
                <i className="fa fa-chevron-left"></i>
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * rowsPerPage >= filteredAnomaliasData.length}>
                <i className="fa fa-chevron-right"></i>
              </button>
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
                <p className="text-muted">Cargando dashboard de anomalías...</p>
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
            <h1 className="fs-3 fw-semibold text-black m-0">Dashboard de Anomalías</h1>
          </div>

          <div className="container-fluid px-3 px-md-4">
            {/* Welcome Section */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="welcome-card">
                  <div className="welcome-content">
                    <div className="welcome-icon">
                      <i className="fa fa-exclamation-triangle"></i>
                    </div>
                    <div className="welcome-text">
                      <h4 className="fs-5 fs-md-4">
                        Hola, {user?.firstName} {user?.lastName}
                      </h4>
                      <p className="mb-0 d-none d-md-block">
                        Bienvenido al dashboard de anomalías. Aquí podrás monitorear y analizar
                        todas las anomalías detectadas en el sistema.
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
                      {filterLoading && (
                        <span className="badge bg-warning">
                          <i className="fa fa-spinner fa-spin me-1"></i>
                          Cargando...
                        </span>
                      )}
                      {(appliedFechaDesde ||
                        appliedFechaHasta !== new Date().toISOString().split("T")[0] ||
                        appliedClientFilter !== "all" ||
                        appliedLineaTransporteFilter !== "all" ||
                        appliedOperadorFilter !== "all") && (
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
                            onChange={(e) => {
                              const newClientFilter = e.target.value;
                              setClientFilter(newClientFilter);

                              // Reset transport line filter when client changes
                              if (newClientFilter !== clientFilter) {
                                setLineaTransporteFilter("all");
                                setOperadorFilter("all");
                              }
                            }}
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
                          <label className="form-label small mb-1">
                            Línea Transporte:
                            {loadingLineasTransporte && (
                              <i className="fa fa-spinner fa-spin ms-1"></i>
                            )}
                          </label>
                          <select
                            value={lineaTransporteFilter}
                            onChange={(e) => {
                              const newLineaTransporteFilter = e.target.value;
                              setLineaTransporteFilter(newLineaTransporteFilter);

                              // Reset operator filter when transport line changes
                              if (newLineaTransporteFilter !== lineaTransporteFilter) {
                                setOperadorFilter("all");
                              }
                            }}
                            className="filter-select form-select form-select-sm"
                            disabled={loadingLineasTransporte || clientFilter === "all"}>
                            <option value="all">
                              {clientFilter === "all"
                                ? "Selecciona un cliente primero"
                                : "Todas las líneas"}
                            </option>
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
                          <label className="form-label small mb-1">
                            Operador:
                            {loadingOperadores && <i className="fa fa-spinner fa-spin ms-1"></i>}
                          </label>
                          <select
                            value={operadorFilter}
                            onChange={(e) => setOperadorFilter(e.target.value)}
                            className="filter-select form-select form-select-sm"
                            disabled={loadingOperadores || lineaTransporteFilter === "all"}>
                            <option value="all">
                              {lineaTransporteFilter === "all"
                                ? "Selecciona una línea de transporte primero"
                                : "Todos los operadores"}
                            </option>
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
                            onClick={applyFilters}>
                            <i className="fa fa-check me-1"></i>
                          </button>
                          <button
                            className="filter-btn btn btn-outline-secondary btn-sm"
                            onClick={resetFilters}>
                            <i className="fa fa-refresh me-1"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas principales con totales y porcentajes integrados */}
            <div className="row mb-3 mb-md-4 g-2 g-md-3">
              {(appliedClientFilter !== "all" ||
                appliedLineaTransporteFilter !== "all" ||
                appliedOperadorFilter !== "all" ||
                appliedFechaDesde ||
                appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                <div className="col-12 mb-2">
                  <div className="alert alert-info py-2" style={{fontSize: "12px"}}>
                    <i className="fa fa-info-circle me-2"></i>
                    <strong>Estadísticas filtradas:</strong>{" "}
                    {appliedClientFilter !== "all" && `Cliente: ${appliedClientFilter} | `}
                    {appliedLineaTransporteFilter !== "all" &&
                      `Línea: ${appliedLineaTransporteFilter} | `}
                    {appliedOperadorFilter !== "all" && `Operador: ${appliedOperadorFilter} | `}
                    {appliedFechaDesde && `Desde: ${appliedFechaDesde} | `}
                    {appliedFechaHasta !== new Date().toISOString().split("T")[0] &&
                      `Hasta: ${appliedFechaHasta}`}
                  </div>
                </div>
              )}
              {/* Total Bitácoras */}
              <div className="col-6 col-lg mb-2 mb-lg-0">
                <div className="stat-card h-100">
                  <div
                    className="stat-icon"
                    style={{backgroundColor: "#6b7280 !important", color: "#fff"}}>
                    <i className="fa fa-book"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value fs-4 fs-md-3">
                      {formatNumber(dashboardStats.totalBitacoras || 0)}
                    </div>
                    <div className="stat-label small">Total Bitácoras</div>
                    <div
                      className="stat-percentage small"
                      style={{color: "#6b7280", fontWeight: "600"}}>
                      100%
                    </div>
                  </div>
                </div>
              </div>

              {/* Nuevas */}
              <div className="col-6 col-lg mb-2 mb-lg-0">
                <div className="stat-card h-100">
                  <div className="stat-icon new">
                    <i className="fa fa-plus-circle"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value fs-4 fs-md-3">
                      {formatNumber(dashboardStats.nuevasBitacoras || 0)}
                    </div>
                    <div className="stat-label small">Nuevas</div>
                    <div
                      className="stat-percentage small"
                      style={{color: "#10b981", fontWeight: "600"}}>
                      {dashboardStats.totalBitacoras > 0 &&
                      dashboardStats.nuevasBitacoras !== undefined
                        ? Math.round(
                            (dashboardStats.nuevasBitacoras / dashboardStats.totalBitacoras) * 100
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {/* En Proceso */}
              <div className="col-6 col-lg mb-2 mb-lg-0">
                <div className="stat-card h-100">
                  <div className="stat-icon pending">
                    <i className="fa fa-clock"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value fs-4 fs-md-3">
                      {formatNumber(dashboardStats.enProcesoBitacoras || 0)}
                    </div>
                    <div className="stat-label small">En proceso</div>
                    <div
                      className="stat-percentage small"
                      style={{color: "#3b82f6", fontWeight: "600"}}>
                      {dashboardStats.totalBitacoras > 0 &&
                      dashboardStats.enProcesoBitacoras !== undefined
                        ? Math.round(
                            (dashboardStats.enProcesoBitacoras / dashboardStats.totalBitacoras) *
                              100
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {/* Cerradas */}
              <div className="col-6 col-lg mb-2 mb-lg-0">
                <div className="stat-card h-100">
                  <div className="stat-icon closed">
                    <i className="fa fa-lock"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value fs-4 fs-md-3">
                      {formatNumber(dashboardStats.cerradasBitacoras || 0)}
                    </div>
                    <div className="stat-label small">Cerradas</div>
                    <div
                      className="stat-percentage small"
                      style={{color: "#ef4444", fontWeight: "600"}}>
                      {dashboardStats.totalBitacoras > 0 &&
                      dashboardStats.cerradasBitacoras !== undefined
                        ? Math.round(
                            (dashboardStats.cerradasBitacoras / dashboardStats.totalBitacoras) * 100
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {/* Con Anomalías */}
              <div className="col-6 col-lg mb-2 mb-lg-0">
                <div className="stat-card h-100">
                  <div className="stat-icon anomalia">
                    <i className="fa fa-exclamation-triangle"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value fs-4 fs-md-3">
                      {formatNumber(
                        dashboardStats.eventCategoriesStats &&
                          dashboardStats.eventCategoriesStats.length > 0
                          ? dashboardStats.eventCategoriesStats.reduce(
                              (sum, category) => sum + category.count,
                              0
                            )
                          : 0
                      )}
                    </div>
                    <div className="stat-label small">Con Anomalías</div>
                    <div
                      className="stat-percentage small"
                      style={{color: "#f59e0b", fontWeight: "600"}}>
                      {dashboardStats.totalBitacoras > 0 &&
                      dashboardStats.eventCategoriesStats &&
                      dashboardStats.eventCategoriesStats.length > 0
                        ? Math.round(
                            (dashboardStats.eventCategoriesStats.reduce(
                              (sum, category) => sum + category.count,
                              0
                            ) /
                              dashboardStats.totalBitacoras) *
                              100
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Líneas de Transporte y Operadores - Unificadas en una fila */}
            <div className="row mb-3 mb-md-4">
              {/* Líneas de Transporte - Siempre mostrar */}
              <div className="col-12 col-lg-6">
                <div className="chart-card">
                  <div className="chart-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="mb-0">
                        Anomalías por Línea de Transporte
                        {appliedClientFilter !== "all"
                          ? ` - ${appliedClientFilter}`
                          : " - Todas las líneas"}
                      </h6>
                      {(appliedClientFilter !== "all" ||
                        appliedLineaTransporteFilter !== "all" ||
                        appliedOperadorFilter !== "all" ||
                        appliedFechaDesde ||
                        appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                        <span className="badge bg-info" style={{fontSize: "10px"}}>
                          <i className="fa fa-filter me-1"></i>
                          Filtrado
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {/* Botón de switch para cambiar vista */}
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className={`btn ${
                            lineasViewMode === "pie" ? "btn-primary" : "btn-outline-primary"
                          }`}
                          onClick={() => setLineasViewMode("pie")}
                          title="Vista de gráfico circular">
                          <i className="fa fa-pie-chart"></i>
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            lineasViewMode === "bar" ? "btn-primary" : "btn-outline-primary"
                          }`}
                          onClick={() => setLineasViewMode("bar")}
                          title="Vista de barras">
                          <i className="fa fa-bar-chart"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="chart-body">
                    {(appliedClientFilter !== "all" ||
                      appliedLineaTransporteFilter !== "all" ||
                      appliedOperadorFilter !== "all" ||
                      appliedFechaDesde ||
                      appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                      <div className="alert alert-info py-2 mb-3" style={{fontSize: "12px"}}>
                        <i className="fa fa-info-circle me-2"></i>
                        <strong>Filtros activos:</strong>{" "}
                        {appliedClientFilter !== "all" && `Cliente: ${appliedClientFilter} | `}
                        {appliedLineaTransporteFilter !== "all" &&
                          `Línea: ${appliedLineaTransporteFilter} | `}
                        {appliedOperadorFilter !== "all" && `Operador: ${appliedOperadorFilter} | `}
                        {appliedFechaDesde && `Desde: ${appliedFechaDesde} | `}
                        {appliedFechaHasta !== new Date().toISOString().split("T")[0] &&
                          `Hasta: ${appliedFechaHasta}`}
                      </div>
                    )}
                    <div className="chart-subheader small text-muted mb-3">
                      {lineasViewMode === "pie"
                        ? "Haz clic en un segmento para filtrar por esa línea"
                        : "Vista de barras horizontales"}
                    </div>
                    <div className="overflow-auto">
                      {lineasViewMode === "pie"
                        ? renderLineasTransportePieChart()
                        : renderLineasTransporteBarChart()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Operadores - Siempre mostrar */}
              <div className="col-12 col-lg-6">
                <div className="chart-card">
                  <div className="chart-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="mb-0">
                        Anomalías por Operador
                        {appliedClientFilter !== "all" && appliedLineaTransporteFilter !== "all"
                          ? ` - ${appliedClientFilter} / ${appliedLineaTransporteFilter}`
                          : appliedClientFilter !== "all"
                          ? ` - ${appliedClientFilter}`
                          : " - Todos los operadores"}
                      </h6>
                      {(appliedClientFilter !== "all" ||
                        appliedLineaTransporteFilter !== "all" ||
                        appliedOperadorFilter !== "all" ||
                        appliedFechaDesde ||
                        appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                        <span className="badge bg-info" style={{fontSize: "10px"}}>
                          <i className="fa fa-filter me-1"></i>
                          Filtrado
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {/* Botón de switch para cambiar vista */}
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className={`btn ${
                            operadoresViewMode === "pie" ? "btn-primary" : "btn-outline-primary"
                          }`}
                          onClick={() => setOperadoresViewMode("pie")}
                          title="Vista de gráfico circular">
                          <i className="fa fa-pie-chart"></i>
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            operadoresViewMode === "bar" ? "btn-primary" : "btn-outline-primary"
                          }`}
                          onClick={() => setOperadoresViewMode("bar")}
                          title="Vista de barras">
                          <i className="fa fa-bar-chart"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="chart-body">
                    {(appliedClientFilter !== "all" ||
                      appliedLineaTransporteFilter !== "all" ||
                      appliedOperadorFilter !== "all" ||
                      appliedFechaDesde ||
                      appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                      <div className="alert alert-info py-2 mb-3" style={{fontSize: "12px"}}>
                        <i className="fa fa-info-circle me-2"></i>
                        <strong>Filtros activos:</strong>{" "}
                        {appliedClientFilter !== "all" && `Cliente: ${appliedClientFilter} | `}
                        {appliedLineaTransporteFilter !== "all" &&
                          `Línea: ${appliedLineaTransporteFilter} | `}
                        {appliedOperadorFilter !== "all" && `Operador: ${appliedOperadorFilter} | `}
                        {appliedFechaDesde && `Desde: ${appliedFechaDesde} | `}
                        {appliedFechaHasta !== new Date().toISOString().split("T")[0] &&
                          `Hasta: ${appliedFechaHasta}`}
                      </div>
                    )}
                    <div className="chart-subheader small text-muted mb-3">
                      {operadoresViewMode === "pie"
                        ? "Haz clic en un segmento para filtrar por ese operador"
                        : "Vista de barras horizontales"}
                    </div>
                    <div className="overflow-auto">
                      {operadoresViewMode === "pie"
                        ? renderOperadoresPieChart()
                        : renderOperadoresBarChart()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipos de Anomalías */}
            <div className="row mb-3 mb-md-4">
              {/* Pie Chart - Tipos de Anomalías */}
              <div className="col-12 col-lg-6">
                <div className="chart-card">
                  <div className="chart-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="mb-0">Tipos de Anomalías</h6>
                      {(appliedClientFilter !== "all" ||
                        appliedLineaTransporteFilter !== "all" ||
                        appliedOperadorFilter !== "all" ||
                        appliedFechaDesde ||
                        appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                        <span className="badge bg-info" style={{fontSize: "10px"}}>
                          <i className="fa fa-filter me-1"></i>
                          Filtrado
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <i className="fa fa-pie-chart text-primary"></i>
                    </div>
                  </div>
                  <div className="chart-body">
                    {(appliedClientFilter !== "all" ||
                      appliedLineaTransporteFilter !== "all" ||
                      appliedOperadorFilter !== "all" ||
                      appliedFechaDesde ||
                      appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                      <div className="alert alert-info py-2 mb-3" style={{fontSize: "12px"}}>
                        <i className="fa fa-info-circle me-2"></i>
                        <strong>Filtros activos:</strong>{" "}
                        {appliedClientFilter !== "all" && `Cliente: ${appliedClientFilter} | `}
                        {appliedLineaTransporteFilter !== "all" &&
                          `Línea: ${appliedLineaTransporteFilter} | `}
                        {appliedOperadorFilter !== "all" && `Operador: ${appliedOperadorFilter} | `}
                        {appliedFechaDesde && `Desde: ${appliedFechaDesde} | `}
                        {appliedFechaHasta !== new Date().toISOString().split("T")[0] &&
                          `Hasta: ${appliedFechaHasta}`}
                      </div>
                    )}
                    <div className="chart-subheader small text-muted mb-3">
                      Distribución por categoría de evento
                    </div>
                    <div className="overflow-auto">{renderEventCategoriesPieChart()}</div>
                  </div>
                </div>
              </div>

              {/* Bar Chart - Tipos de Anomalías */}
              <div className="col-12 col-lg-6">
                <div className="chart-card">
                  <div className="chart-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="mb-0">Tipos de Anomalías (Barras)</h6>
                      {(appliedClientFilter !== "all" ||
                        appliedLineaTransporteFilter !== "all" ||
                        appliedOperadorFilter !== "all" ||
                        appliedFechaDesde ||
                        appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                        <span className="badge bg-info" style={{fontSize: "10px"}}>
                          <i className="fa fa-filter me-1"></i>
                          Filtrado
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <i className="fa fa-bar-chart text-primary"></i>
                    </div>
                  </div>
                  <div className="chart-body">
                    <div className="chart-subheader small text-muted mb-3">
                      Vista de barras horizontales
                    </div>
                    <div className="overflow-auto">{renderEventCategoriesBarChart()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ONC Events Section */}
            <div className="row mb-3 mb-md-4">
              {/* Bar Chart - Eventos ONC */}
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="mb-0">Eventos de Usuario No Responde (ONC)</h6>
                      {(appliedClientFilter !== "all" ||
                        appliedLineaTransporteFilter !== "all" ||
                        appliedOperadorFilter !== "all" ||
                        appliedFechaDesde ||
                        appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                        <span className="badge bg-info" style={{fontSize: "10px"}}>
                          <i className="fa fa-filter me-1"></i>
                          Filtrado
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <i className="fa fa-bar-chart text-primary"></i>
                    </div>
                  </div>
                  <div className="chart-body">
                    {(appliedClientFilter !== "all" ||
                      appliedLineaTransporteFilter !== "all" ||
                      appliedOperadorFilter !== "all" ||
                      appliedFechaDesde ||
                      appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                      <div className="alert alert-info py-2 mb-3" style={{fontSize: "12px"}}>
                        <i className="fa fa-info-circle me-2"></i>
                        <strong>Filtros activos:</strong>{" "}
                        {appliedClientFilter !== "all" && `Cliente: ${appliedClientFilter} | `}
                        {appliedLineaTransporteFilter !== "all" &&
                          `Línea: ${appliedLineaTransporteFilter} | `}
                        {appliedOperadorFilter !== "all" && `Operador: ${appliedOperadorFilter} | `}
                        {appliedFechaDesde && `Desde: ${appliedFechaDesde} | `}
                        {appliedFechaHasta !== new Date().toISOString().split("T")[0] &&
                          `Hasta: ${appliedFechaHasta}`}
                      </div>
                    )}
                    <div className="chart-subheader small text-muted mb-3">
                      Vista de barras verticales
                    </div>
                    <div className="overflow-auto">{renderOncBarChart()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Anomalies Table */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="mb-0">Bitácoras con Anomalías</h6>
                      {(appliedClientFilter !== "all" ||
                        appliedLineaTransporteFilter !== "all" ||
                        appliedOperadorFilter !== "all" ||
                        appliedFechaDesde ||
                        appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                        <span className="badge bg-info" style={{fontSize: "10px"}}>
                          <i className="fa fa-filter me-1"></i>
                          Filtrado
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => downloadBitacorasAnomaliasExcel(filteredAnomaliasData)}
                        disabled={filteredAnomaliasData.length === 0}>
                        <i className="fa fa-download me-1"></i>
                        Exportar Excel
                      </button>
                    </div>
                  </div>
                  <div className="chart-body">
                    {(appliedClientFilter !== "all" ||
                      appliedLineaTransporteFilter !== "all" ||
                      appliedOperadorFilter !== "all" ||
                      appliedFechaDesde ||
                      appliedFechaHasta !== new Date().toISOString().split("T")[0]) && (
                      <div className="alert alert-info py-2 mb-3" style={{fontSize: "12px"}}>
                        <i className="fa fa-info-circle me-2"></i>
                        <strong>Filtros activos:</strong>{" "}
                        {appliedClientFilter !== "all" && `Cliente: ${appliedClientFilter} | `}
                        {appliedLineaTransporteFilter !== "all" &&
                          `Línea: ${appliedLineaTransporteFilter} | `}
                        {appliedOperadorFilter !== "all" && `Operador: ${appliedOperadorFilter} | `}
                        {appliedFechaDesde && `Desde: ${appliedFechaDesde} | `}
                        {appliedFechaHasta !== new Date().toISOString().split("T")[0] &&
                          `Hasta: ${appliedFechaHasta}`}
                      </div>
                    )}
                    <div className="chart-subheader small text-white mb-3">
                      Mostrando {filteredAnomaliasData.length} de {bitacorasAnomalias.length}{" "}
                      registros
                    </div>
                    <div className="overflow-auto">{renderAnomaliasTable()}</div>
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

export default AnomaliasDashboardPage;
