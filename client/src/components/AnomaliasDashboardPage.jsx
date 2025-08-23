import {useState, useEffect, useMemo, useCallback} from "react";
import {useAuth} from "../context/AuthContext";
import {useSidebar} from "../context/SidebarContext";
import {useNavigate} from "react-router-dom";
import Sidebar from "./Sidebar";
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
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Tooltip as MuiTooltip,
} from "@mui/material";
import {
  FilterList,
  Refresh,
  Download,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  List as ListIcon,
  Warning,
  CheckCircle,
  Person,
} from "@mui/icons-material";
import * as XLSX from "xlsx";

const AnomaliasDashboardPage = () => {
  const {user} = useAuth();
  const {isSidebarCollapsed} = useSidebar();
  const navigate = useNavigate();

  const [dashboardStats, setDashboardStats] = useState({
    eventCategoriesStats: [],
    clientAnomaliasStats: [],
    totalAnomalias: 0,
    totalBitacoras: 0,
  });
  const [oncEventsData, setOncEventsData] = useState([]);
  const [bitacorasAnomalias, setBitacorasAnomalias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [availableClients, setAvailableClients] = useState([]);
  const [availableLineasTransporte, setAvailableLineasTransporte] = useState([]);
  const [availableOperadores, setAvailableOperadores] = useState([]);
  const [oncViewMode, setOncViewMode] = useState("chart");
  const [applyFiltersTrigger, setApplyFiltersTrigger] = useState(0);

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

  // Filtros para la tabla de anomalías
  const [anomaliasFilters, setAnomaliasFilters] = useState({
    bitacora_id: "",
    cliente: "",
    anomalias: [],
    linea_transporte: "",
    operador: "",
    origen: "",
    destino: "",
    status: "",
  });

  // Pagination for anomalies table
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const baseUrl = import.meta.env.VITE_BASE_URL;

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

  // Function to handle client selection from pie chart
  const handleClientClick = (data) => {
    if (data && data.cliente) {
      setClientFilter(data.cliente);
      setAppliedClientFilter(data.cliente);
      setApplyFiltersTrigger((prev) => prev + 1);
    }
  };

  // Helper function to format numbers with thousands separator
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Helper function to render loading overlay for stat cards
  const renderLoadingOverlay = () => {
    if (!filterLoading) return null;
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.1)",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}>
        <CircularProgress size={20} sx={{color: "white"}} />
      </div>
    );
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
            const clientsData = await clientsResponse.json();
            setAvailableClients(clientsData);
          }

          // Fetch available transport lines for filter from bitacoras
          const lineasResponse = await fetch(`${baseUrl}/lineas-transporte-bitacoras`, {
            method: "GET",
            credentials: "include",
          });
          if (lineasResponse.ok) {
            const lineasData = await lineasResponse.json();
            setAvailableLineasTransporte(lineasData);
          } else {
            console.warn("Transport lines endpoint not available:", lineasResponse.status);
            setAvailableLineasTransporte([]);
          }

          // Fetch available operators for filter from bitacoras
          const operadoresResponse = await fetch(`${baseUrl}/operadores-bitacoras`, {
            method: "GET",
            credentials: "include",
          });
          if (operadoresResponse.ok) {
            const operadoresData = await operadoresResponse.json();
            setAvailableOperadores(operadoresData);
          } else {
            console.warn("Operators endpoint not available:", operadoresResponse.status);
            setAvailableOperadores([]);
          }
        }

        // Fetch dashboard statistics with filters for anomalías
        const statsUrl = `${baseUrl}/dashboard/stats?clientFilter=${encodeURIComponent(
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

        // Fetch client anomalies statistics
        const clientStatsUrl = `${baseUrl}/dashboard/client-anomalias-stats?clientFilter=${encodeURIComponent(
          appliedClientFilter
        )}&fechaDesde=${encodeURIComponent(appliedFechaDesde)}&fechaHasta=${encodeURIComponent(
          appliedFechaHasta
        )}&lineaTransporte=${encodeURIComponent(
          appliedLineaTransporteFilter
        )}&operador=${encodeURIComponent(appliedOperadorFilter)}`;

        const clientStatsResponse = await fetch(clientStatsUrl, {
          method: "GET",
          credentials: "include",
        });

        if (clientStatsResponse.ok) {
          const clientStatsData = await clientStatsResponse.json();
          setDashboardStats((prev) => ({
            ...prev,
            clientAnomaliasStats: clientStatsData,
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
    // Initial load
    if (applyFiltersTrigger === 0) {
      fetchDashboardData(true);
    } else {
      // Filter updates
      fetchDashboardData(false);
    }
  }, [user, navigate, fetchDashboardData, applyFiltersTrigger]);

  // Memoize filtered data calculation
  const filteredAnomaliasData = useMemo(() => {
    if (bitacorasAnomalias.length === 0) {
      return [];
    }

    return bitacorasAnomalias.filter((bitacora) => {
      // First, check if the bitacora matches the applied client filter
      const matchesAppliedClientFilter =
        appliedClientFilter === "all" ||
        (bitacora.cliente && bitacora.cliente === appliedClientFilter);

      if (!matchesAppliedClientFilter) {
        return false;
      }

      const matchesBitacoraId =
        !anomaliasFilters.bitacora_id ||
        (bitacora.bitacora_id || "")
          .toLowerCase()
          .includes(anomaliasFilters.bitacora_id.toLowerCase());

      const matchesCliente =
        !anomaliasFilters.cliente ||
        (bitacora.cliente || "").toLowerCase().includes(anomaliasFilters.cliente.toLowerCase());

      const matchesAnomalias =
        anomaliasFilters.anomalias.length === 0 ||
        (bitacora.categorias &&
          bitacora.categorias.some((cat) => anomaliasFilters.anomalias.includes(cat)));

      const matchesLineaTransporte =
        !anomaliasFilters.linea_transporte ||
        (bitacora.linea_transporte || "")
          .toLowerCase()
          .includes(anomaliasFilters.linea_transporte.toLowerCase());

      const matchesUsuario =
        !anomaliasFilters.operador ||
        (bitacora.operador || "").toLowerCase().includes(anomaliasFilters.operador.toLowerCase());

      const matchesOrigen =
        !anomaliasFilters.origen ||
        (bitacora.origen || "").toLowerCase().includes(anomaliasFilters.origen.toLowerCase());

      const matchesDestino =
        !anomaliasFilters.destino ||
        (bitacora.destino || "").toLowerCase().includes(anomaliasFilters.destino.toLowerCase());

      const matchesStatus =
        !anomaliasFilters.status ||
        (bitacora.status || "").toLowerCase().includes(anomaliasFilters.status.toLowerCase());

      return (
        matchesBitacoraId &&
        matchesCliente &&
        matchesAnomalias &&
        matchesLineaTransporte &&
        matchesUsuario &&
        matchesOrigen &&
        matchesDestino &&
        matchesStatus
      );
    });
  }, [bitacorasAnomalias, anomaliasFilters, appliedClientFilter]);

  // Pagination for filtered data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAnomaliasData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAnomaliasData, page, rowsPerPage]);

  // Custom tooltip for pie charts
  const CustomTooltip = ({active, payload, label}) => {
    if (active && payload && payload.length) {
      const totalAnomalias =
        dashboardStats.clientAnomaliasStats?.reduce((sum, stat) => sum + stat.anomalias, 0) || 0;
      return (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #ddd",
          }}>
          <Typography variant="body2" color="textSecondary">
            {label}
          </Typography>
          <Typography variant="h6" color="primary">
            {formatNumber(payload[0].value)} anomalías
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {totalAnomalias > 0 ? ((payload[0].value / totalAnomalias) * 100).toFixed(1) : 0}% del
            total
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Render client anomalies pie chart
  const renderClientAnomaliasPieChart = () => {
    const clientStats = dashboardStats.clientAnomaliasStats || [];

    if (clientStats.length === 0) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height={300}
          color="white">
          <CheckCircle sx={{fontSize: 60, mb: 2, opacity: 0.3}} />
          <Typography variant="h6" gutterBottom>
            Sin Anomalías Detectadas
          </Typography>
          <Typography variant="body2" textAlign="center">
            No se encontraron bitácoras con anomalías en el período seleccionado
          </Typography>
        </Box>
      );
    }

    // Transform data for Recharts format
    const chartData = clientStats.map((stat) => ({
      name: stat.cliente,
      value: stat.anomalias,
      color: stat.color,
      cliente: stat.cliente, // Keep original data for click handler
    }));

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            onClick={handleClientClick}
            style={{cursor: "pointer"}}>
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

  // Render event categories pie chart
  const renderEventCategoriesPieChart = () => {
    const eventCategoriesStats = dashboardStats.eventCategoriesStats || [];

    if (eventCategoriesStats.length === 0) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height={300}
          color="white">
          <CheckCircle sx={{fontSize: 60, mb: 2, opacity: 0.3}} />
          <Typography variant="h6" gutterBottom>
            Sin Eventos Registrados
          </Typography>
          <Typography variant="body2" textAlign="center">
            No hay eventos registrados en las categorías especificadas
          </Typography>
        </Box>
      );
    }

    const chartData = eventCategoriesStats.map((category) => ({
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
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
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
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height={300}
          color="white">
          <Person sx={{fontSize: 60, mb: 2, opacity: 0.3}} />
          <Typography variant="h6" gutterBottom>
            Sin Eventos ONC
          </Typography>
          <Typography variant="body2" textAlign="center">
            No hay eventos de &quot;Usuario No Responde&quot; registrados
          </Typography>
        </Box>
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

  // Render ONC events list view
  const renderOncListView = () => {
    if (oncEventsData.length === 0) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height={300}
          color="white">
          <Person sx={{fontSize: 60, mb: 2, opacity: 0.3}} />
          <Typography variant="h6" gutterBottom>
            Sin Eventos ONC
          </Typography>
          <Typography variant="body2" textAlign="center">
            No hay eventos de &quot;Usuario No Responde&quot; registrados
          </Typography>
        </Box>
      );
    }

    const totalEvents = oncEventsData.reduce((sum, event) => sum + event.count, 0);

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Evento</TableCell>
              <TableCell align="center">Cantidad</TableCell>
              <TableCell align="center">Porcentaje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {oncEventsData.map((event, index) => {
              const percentage =
                totalEvents > 0 ? ((event.count / totalEvents) * 100).toFixed(1) : 0;
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        width={12}
                        height={12}
                        borderRadius="50%"
                        sx={{backgroundColor: event.color}}
                      />
                      {event.eventName}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {formatNumber(event.count)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{percentage}%</Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render anomalies table
  const renderAnomaliasTable = () => {
    if (bitacorasAnomalias.length === 0) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height={400}
          color="white">
          <CheckCircle sx={{fontSize: 60, mb: 2, opacity: 0.3}} />
          <Typography variant="h6" gutterBottom>
            Sin Anomalías Registradas
          </Typography>
          <Typography variant="body2" textAlign="center">
            No hay bitácoras con anomalías en el período seleccionado
          </Typography>
        </Box>
      );
    }

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case "cerrada":
          return "error";
        case "nueva":
          return "warning";
        case "iniciada":
          return "primary";
        case "validada":
          return "info";
        case "finalizada":
          return "default";
        default:
          return "default";
      }
    };

    return (
      <Box>
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>No. Bitácora</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Anomalías</TableCell>
                <TableCell>Línea Transporte</TableCell>
                <TableCell>Operador</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell align="center">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((bitacora, index) => (
                <TableRow key={bitacora._id || index} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {bitacora.bitacora_id || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{bitacora.cliente || "N/A"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {bitacora.categorias && bitacora.categorias.length > 0 ? (
                        bitacora.categorias.map((categoria, catIndex) => (
                          <Chip
                            key={catIndex}
                            label={categoria}
                            size="small"
                            sx={{
                              backgroundColor: getAnomaliaColor(categoria),
                              color: "white",
                              fontSize: "0.7rem",
                              height: 20,
                            }}
                          />
                        ))
                      ) : (
                        <Chip label="N/A" size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{bitacora.linea_transporte || "N/A"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{bitacora.operador || "N/A"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{bitacora.origen || "N/A"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{bitacora.destino || "N/A"}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={bitacora.status || "N/A"}
                      size="small"
                      color={getStatusColor(bitacora.status)}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredAnomaliasData.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({from, to, count}) => `${from}-${to} de ${count}`}
          sx={{
            color: "white",
            "& .MuiTablePagination-selectLabel": {
              color: "white",
            },
            "& .MuiTablePagination-displayedRows": {
              color: "white",
            },
            "& .MuiTablePagination-select": {
              color: "white",
            },
            "& .MuiTablePagination-actions": {
              color: "white",
            },
            "& .MuiIconButton-root": {
              color: "white",
            },
          }}
        />
      </Box>
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
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100vh"
              flexDirection="column">
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{mt: 2}}>
                Cargando dashboard de anomalías...
              </Typography>
            </Box>
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
          {/* Header */}
          <Box
            sx={{
              p: 3,
              backgroundColor: "background.paper",
              borderBottom: 1,
              borderColor: "divider",
            }}>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Dashboard de Anomalías
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tablero de control de anomalías del sistema de monitoreo Intacsep
            </Typography>
          </Box>

          <Box sx={{p: 3}}>
            {/* Welcome Card */}
            <Card
              sx={{
                mb: 3,
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                color: "white",
                border: "1px solid rgba(148, 163, 184, 0.1)",
              }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <Warning sx={{fontSize: 30}} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Hola, {user?.firstName} {user?.lastName}
                    </Typography>
                    <Typography variant="body1" sx={{opacity: 0.9}}>
                      Bienvenido al dashboard de anomalías. Aquí podrás monitorear y analizar todas
                      las anomalías detectadas en el sistema.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Filters Card */}
            <Card
              sx={{
                mb: 3,
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                color: "white",
                border: "1px solid rgba(148, 163, 184, 0.1)",
              }}>
              <CardHeader
                title="Filtros de Búsqueda"
                titleTypographyProps={{color: "white"}}
                action={
                  <Box display="flex" gap={1}>
                    {filterLoading && (
                      <Chip
                        icon={<CircularProgress size={16} />}
                        label="Actualizando..."
                        color="info"
                        size="small"
                      />
                    )}
                    {(appliedFechaDesde ||
                      appliedFechaHasta !== new Date().toISOString().split("T")[0] ||
                      appliedClientFilter !== "all" ||
                      appliedLineaTransporteFilter !== "all" ||
                      appliedOperadorFilter !== "all") && (
                      <Chip
                        icon={<FilterList />}
                        label="Filtros Activos"
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                }
                sx={{
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <CardContent>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="Fecha Desde"
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{shrink: true}}
                      sx={{
                        "& .MuiInputLabel-root": {
                          color: "rgba(255,255,255,0.7)",
                        },
                        "& .MuiInputBase-root": {
                          color: "white",
                          "& fieldset": {
                            borderColor: "rgba(255,255,255,0.3)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(255,255,255,0.5)",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="Fecha Hasta"
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{shrink: true}}
                      sx={{
                        "& .MuiInputLabel-root": {
                          color: "rgba(255,255,255,0.7)",
                        },
                        "& .MuiInputBase-root": {
                          color: "white",
                          "& fieldset": {
                            borderColor: "rgba(255,255,255,0.3)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(255,255,255,0.5)",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{color: "rgba(255,255,255,0.7)"}}>Cliente</InputLabel>
                      <Select
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        label="Cliente"
                        sx={{
                          color: "white",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.3)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.5)",
                          },
                          "& .MuiSvgIcon-root": {
                            color: "rgba(255,255,255,0.7)",
                          },
                        }}>
                        <MenuItem value="all">Todos los clientes</MenuItem>
                        {availableClients
                          ?.filter((client) => client && client.razon_social)
                          .sort((a, b) => a.razon_social.localeCompare(b.razon_social))
                          .map((client) => (
                            <MenuItem key={client._id} value={client.razon_social}>
                              {client.razon_social}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{color: "rgba(255,255,255,0.7)"}}>
                        Línea Transporte
                      </InputLabel>
                      <Select
                        value={lineaTransporteFilter}
                        onChange={(e) => setLineaTransporteFilter(e.target.value)}
                        label="Línea Transporte"
                        sx={{
                          color: "white",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.3)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.5)",
                          },
                          "& .MuiSvgIcon-root": {
                            color: "rgba(255,255,255,0.7)",
                          },
                        }}>
                        <MenuItem value="all">Todas las líneas</MenuItem>
                        {availableLineasTransporte
                          ?.filter((linea) => linea && linea.nombre)
                          .sort((a, b) => a.nombre.localeCompare(b.nombre))
                          .map((linea) => (
                            <MenuItem key={linea._id} value={linea.nombre}>
                              {linea.nombre}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{color: "rgba(255,255,255,0.7)"}}>Operador</InputLabel>
                      <Select
                        value={operadorFilter}
                        onChange={(e) => setOperadorFilter(e.target.value)}
                        label="Operador"
                        sx={{
                          color: "white",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.3)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.5)",
                          },
                          "& .MuiSvgIcon-root": {
                            color: "rgba(255,255,255,0.7)",
                          },
                        }}>
                        <MenuItem value="all">Todos los operadores</MenuItem>
                        {availableOperadores
                          ?.filter((operador) => operador && operador.nombre)
                          .sort((a, b) => a.nombre.localeCompare(b.nombre))
                          .map((operador) => (
                            <MenuItem key={operador._id} value={operador.nombre}>
                              {operador.nombre}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        startIcon={<FilterList />}
                        onClick={applyFilters}
                        fullWidth>
                        Aplicar
                      </Button>
                      <IconButton color="secondary" onClick={resetFilters} title="Limpiar filtros">
                        <Refresh />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="row mb-3 mb-md-4">
              <div className="col-12">
                <div className="chart-card">
                  <div className="chart-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="mb-0">Resumen de Bitácoras</h6>
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
                    <div className="row g-2 g-md-3">
                      {/* Total Bitácoras */}
                      <div className="col-6 col-lg mb-2 mb-lg-0">
                        <div className="stat-card h-100" style={{position: "relative"}}>
                          {renderLoadingOverlay()}
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
                        <div className="stat-card h-100" style={{position: "relative"}}>
                          {renderLoadingOverlay()}
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
                                    (dashboardStats.nuevasBitacoras /
                                      dashboardStats.totalBitacoras) *
                                      100
                                  )
                                : 0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* En Proceso */}
                      <div className="col-6 col-lg mb-2 mb-lg-0">
                        <div className="stat-card h-100" style={{position: "relative"}}>
                          {renderLoadingOverlay()}
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
                                    (dashboardStats.enProcesoBitacoras /
                                      dashboardStats.totalBitacoras) *
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
                        <div className="stat-card h-100" style={{position: "relative"}}>
                          {renderLoadingOverlay()}
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
                                    (dashboardStats.cerradasBitacoras /
                                      dashboardStats.totalBitacoras) *
                                      100
                                  )
                                : 0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Con Anomalías */}
                      <div className="col-6 col-lg mb-2 mb-lg-0">
                        <div className="stat-card h-100" style={{position: "relative"}}>
                          {renderLoadingOverlay()}
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
                  </div>
                </div>
              </div>
            </div>

            {/* Main Charts Grid */}
            <Grid container spacing={3} sx={{mb: 3}}>
              {/* Client Anomalies Pie Chart */}
              <Grid item xs={12} lg={6}>
                <Card
                  sx={{
                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                    color: "white",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                  }}>
                  <CardHeader
                    title="Anomalías por Cliente"
                    subheader="Haz clic en un segmento para filtrar por ese cliente"
                    titleTypographyProps={{color: "white"}}
                    subheaderTypographyProps={{color: "rgba(255,255,255,0.7)"}}
                    action={
                      <MuiTooltip title="Gráfico interactivo">
                        <PieChartIcon sx={{color: "white"}} />
                      </MuiTooltip>
                    }
                    sx={{
                      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <CardContent>{renderClientAnomaliasPieChart()}</CardContent>
                </Card>
              </Grid>

              {/* Event Categories Pie Chart */}
              <Grid item xs={12} lg={6}>
                <Card
                  sx={{
                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                    color: "white",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                  }}>
                  <CardHeader
                    title="Tipos de Anomalías"
                    subheader="Distribución por categoría de evento"
                    titleTypographyProps={{color: "white"}}
                    subheaderTypographyProps={{color: "rgba(255,255,255,0.7)"}}
                    sx={{
                      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <CardContent>{renderEventCategoriesPieChart()}</CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* ONC Events Section */}
            <Card
              sx={{
                mb: 3,
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                color: "white",
                border: "1px solid rgba(148, 163, 184, 0.1)",
              }}>
              <CardHeader
                title="Eventos de Usuario No Responde (ONC)"
                subheader="Análisis de eventos donde el usuario no responde"
                titleTypographyProps={{color: "white"}}
                subheaderTypographyProps={{color: "rgba(255,255,255,0.7)"}}
                action={
                  <Box display="flex" gap={1}>
                    <Button
                      variant={oncViewMode === "chart" ? "contained" : "outlined"}
                      size="small"
                      startIcon={<BarChartIcon />}
                      onClick={() => setOncViewMode("chart")}
                      sx={{
                        color: oncViewMode === "chart" ? "white" : "rgba(255,255,255,0.7)",
                        borderColor:
                          oncViewMode === "outlined" ? "rgba(255,255,255,0.3)" : "transparent",
                      }}>
                      Gráfico
                    </Button>
                    <Button
                      variant={oncViewMode === "list" ? "contained" : "outlined"}
                      size="small"
                      startIcon={<ListIcon />}
                      onClick={() => setOncViewMode("list")}
                      sx={{
                        color: oncViewMode === "list" ? "white" : "rgba(255,255,255,0.7)",
                        borderColor:
                          oncViewMode === "outlined" ? "rgba(255,255,255,0.3)" : "transparent",
                      }}>
                      Lista
                    </Button>
                  </Box>
                }
                sx={{
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <CardContent>
                {oncViewMode === "chart" ? renderOncBarChart() : renderOncListView()}
              </CardContent>
            </Card>

            {/* Anomalies Table */}
            <Card
              sx={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                color: "white",
                border: "1px solid rgba(148, 163, 184, 0.1)",
              }}>
              <CardHeader
                title="Bitácoras con Anomalías"
                subheader={`Mostrando ${filteredAnomaliasData.length} de ${bitacorasAnomalias.length} registros`}
                titleTypographyProps={{color: "white"}}
                subheaderTypographyProps={{color: "rgba(255,255,255,0.7)"}}
                action={
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => downloadBitacorasAnomaliasExcel(filteredAnomaliasData)}
                    disabled={filteredAnomaliasData.length === 0}
                    sx={{
                      color: "white",
                      borderColor: "rgba(255,255,255,0.3)",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.5)",
                      },
                    }}>
                    Exportar Excel
                  </Button>
                }
                sx={{
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <CardContent>{renderAnomaliasTable()}</CardContent>
            </Card>
          </Box>
        </div>
      </div>
    </section>
  );
};

export default AnomaliasDashboardPage;
