import {useState, useEffect, useMemo, useCallback} from "react";
import {useAuth} from "../context/AuthContext";
import {useSidebar} from "../context/SidebarContext";
import {useNavigate} from "react-router-dom";
import Sidebar from "./Sidebar";
import {Chart as ChartJS, ArcElement, Tooltip, Legend} from "chart.js";
import {Doughnut} from "react-chartjs-2";
import * as XLSX from "xlsx";

ChartJS.register(ArcElement, Tooltip, Legend);

const AnomaliasDashboardPage = () => {
  const {user} = useAuth();
  const {isSidebarCollapsed} = useSidebar();
  const navigate = useNavigate();

  const [dashboardStats, setDashboardStats] = useState({
    eventCategoriesStats: [],
  });
  const [oncEventsData, setOncEventsData] = useState([]);
  const [bitacorasAnomalias, setBitacorasAnomalias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableClients, setAvailableClients] = useState([]);
  const [availableLineasTransporte, setAvailableLineasTransporte] = useState([]);
  const [availableOperadores, setAvailableOperadores] = useState([]);
  const [oncViewMode, setOncViewMode] = useState("chart"); // 'chart' or 'list'
  const [applyFiltersTrigger, setApplyFiltersTrigger] = useState(0);

  // Filtros pendientes (que se pueden cambiar sin aplicar)
  const [clientFilter, setClientFilter] = useState("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState(() => {
    // Set default value to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [lineaTransporteFilter, setLineaTransporteFilter] = useState("all");
  const [operadorFilter, setOperadorFilter] = useState("all");

  // Filtros aplicados (que realmente se usan en las consultas)
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
    anomalias: [], // Changed to array for multiple selection
    linea_transporte: "",
    operador: "",
    origen: "",
    destino: "",
    status: "",
  });

  const baseUrl = import.meta.env.VITE_BASE_URL;

  // Function to apply filters when check button is pressed
  const applyFilters = () => {
    setAppliedClientFilter(clientFilter);
    setAppliedFechaDesde(fechaDesde);
    setAppliedFechaHasta(fechaHasta);
    setAppliedLineaTransporteFilter(lineaTransporteFilter);
    setAppliedOperadorFilter(operadorFilter);
    setApplyFiltersTrigger((prev) => prev + 1);
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

  // Helper function to format numbers with thousands separator
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const downloadBitacorasAnomaliasExcel = (filteredData) => {
    if (!filteredData || filteredData.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    // Prepare data for Excel with new column order (Anomalías after Cliente)
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

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths with new order
    const columnWidths = [
      {wch: 15}, // No. Bitácora
      {wch: 20}, // Cliente
      {wch: 30}, // Anomalías
      {wch: 20}, // Línea Transporte
      {wch: 20}, // Operador
      {wch: 25}, // Origen
      {wch: 25}, // Destino
      {wch: 12}, // Estado
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

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch available clients for filter
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
      setLoading(false);
    }
  }, [
    baseUrl,
    appliedClientFilter,
    appliedFechaDesde,
    appliedFechaHasta,
    appliedLineaTransporteFilter,
    appliedOperadorFilter,
  ]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [user, navigate, fetchDashboardData, applyFiltersTrigger]);

  // Memoize filtered data calculation to avoid unnecessary recalculations
  const filteredAnomaliasData = useMemo(() => {
    if (bitacorasAnomalias.length === 0) {
      return [];
    }

    return bitacorasAnomalias.filter((bitacora) => {
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
  }, [bitacorasAnomalias, anomaliasFilters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("anomalias-dropdown");
      const container = event.target.closest(".anomalias-dropdown-container");

      if (dropdown && !container && dropdown.style.display === "block") {
        dropdown.style.display = "none";
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Chart rendering functions
  const renderAnomaliasPieChart = () => {
    const eventCategoriesStats = dashboardStats.eventCategoriesStats || [];

    if (eventCategoriesStats.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="mb-3">
            <i
              className="fa fa-check-circle"
              style={{
                fontSize: "3rem",
                color: "#10b981",
                opacity: 0.3,
              }}></i>
          </div>
          <h6 className="text-muted mb-2">Sin Anomalías Detectadas</h6>
          <p className="text-muted small mb-0">
            No se encontraron bitácoras con anomalías en el período seleccionado
          </p>
        </div>
      );
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
      labels: eventCategoriesStats.map((category) => {
        const labelMap = {
          ENA: "Estadia no autorizada",
          FM: "Falla mecánica",
          ONC: "Usuario no responde",
          DR: "Desvío de ruta",
        };
        return labelMap[category.categoria] || category.categoria;
      }),
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
          position: "nearest",
          yAlign: "top",
          xAlign: "center",
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
            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#374151",
                lineHeight: "1.2",
              }}>
              <div>{total}</div>
              <div style={{fontSize: "10px", marginTop: "2px"}}>Bitácoras</div>
            </div>
          </div>
        </div>
        <div
          className="pie-legend"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
          {/* Total at the top of legend */}
          <div
            className="legend-total"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(255,255,255,0.2)",
            }}>
            <span
              className="legend-color"
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                background: "#374151",
              }}></span>
            <span
              className="legend-text"
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#ffffff",
              }}>
              Total: {formatNumber(total)} bitácoras
            </span>
          </div>

          {eventCategoriesStats.map((category, index) => {
            const percentage = total > 0 ? ((category.count / total) * 100).toFixed(1) : 0;
            const labelMap = {
              ENA: "Estadia no autorizada",
              FM: "Falla mecánica",
              ONC: "Usuario no responde",
              DR: "Desvío de ruta",
            };
            const displayLabel = labelMap[category.categoria] || category.categoria;
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
                  {displayLabel} - {formatNumber(category.count)} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOncBarChart = () => {
    if (oncEventsData.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="mb-3">
            <i
              className="fa fa-user-times"
              style={{
                fontSize: "3rem",
                color: "#06b6d4",
                opacity: 0.3,
              }}></i>
          </div>
          <h6 className="text-muted mb-2">Sin Eventos ONC</h6>
          <p className="text-muted small mb-0">
            No hay eventos de "Usuario No Responde" registrados
          </p>
        </div>
      );
    }

    const maxCount = Math.max(...oncEventsData.map((event) => event.count));
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
          {oncEventsData.map((event, index) => {
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
                    {formatNumber(event.count)}
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
      </div>
    );
  };

  const renderOncListView = () => {
    if (oncEventsData.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="mb-3">
            <i
              className="fa fa-user-times"
              style={{
                fontSize: "3rem",
                color: "#06b6d4",
                opacity: 0.3,
              }}></i>
          </div>
          <h6 className="text-muted mb-2">Sin Eventos ONC</h6>
          <p className="text-muted small mb-0">
            No hay eventos de "Usuario No Responde" registrados
          </p>
        </div>
      );
    }

    const totalEvents = oncEventsData.reduce((sum, event) => sum + event.count, 0);

    return (
      <div className="list-view-container">
        <div className="table-responsive" style={{maxHeight: "300px", overflowY: "auto"}}>
          <table className="table table-hover table-sm">
            <thead className="sticky-top" style={{backgroundColor: "#ffffff"}}>
              <tr>
                <th className="small">Evento</th>
                <th className="small text-center">Cantidad</th>
                <th className="small text-center">Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {oncEventsData.map((event, index) => {
                const percentage =
                  totalEvents > 0 ? ((event.count / totalEvents) * 100).toFixed(1) : 0;
                return (
                  <tr key={index}>
                    <td className="small">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: event.color,
                            color: "#fff",
                            fontSize: "0.7rem",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                          }}></span>
                        {event.eventName}
                      </div>
                    </td>
                    <td className="small text-center fw-bold">{formatNumber(event.count)}</td>
                    <td className="small text-center">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBitacorasAnomalias = () => {
    if (bitacorasAnomalias.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="mb-3">
            <i
              className="fa fa-clipboard-check"
              style={{
                fontSize: "3rem",
                color: "#10b981",
                opacity: 0.3,
              }}></i>
          </div>
          <h6 className="text-muted mb-2">Sin Anomalías Registradas</h6>
          <p className="text-muted small mb-0">
            No hay bitácoras con anomalías en el período seleccionado
          </p>
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

    const handleFilterChange = (field, value) => {
      setAnomaliasFilters((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

    const handleAnomaliasFilterChange = (selectedOptions) => {
      setAnomaliasFilters((prev) => ({
        ...prev,
        anomalias: selectedOptions,
      }));
    };

    const clearFilters = () => {
      setAnomaliasFilters({
        bitacora_id: "",
        cliente: "",
        anomalias: [],
        linea_transporte: "",
        operador: "",
        origen: "",
        destino: "",
        status: "",
      });
    };

    return (
      <div>
        {/* Filter Controls */}
        <div className="mb-3">
          <div className="row g-2">
            <div className="col-12 d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <small className="text-muted">
                  Mostrando {filteredAnomaliasData.length} de {bitacorasAnomalias.length} registros
                </small>
                {anomaliasFilters.anomalias.length > 0 && (
                  <div className="d-flex align-items-center gap-1">
                    <span className="badge bg-primary" style={{fontSize: "10px"}}>
                      <i className="fa fa-filter me-1"></i>
                      Anomalías: {anomaliasFilters.anomalias.length}
                    </span>
                    <div className="d-flex gap-1">
                      {anomaliasFilters.anomalias.map((anomalia) => {
                        const colors = {
                          ENA: "#f59e0b",
                          FM: "#ef4444",
                          ONC: "#06b6d4",
                          DR: "#10b981",
                        };
                        return (
                          <span
                            key={anomalia}
                            className="badge"
                            style={{
                              backgroundColor: colors[anomalia],
                              color: "white",
                              fontSize: "8px",
                              padding: "2px 4px",
                            }}>
                            {anomalia}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={clearFilters}
                disabled={Object.entries(anomaliasFilters).every(([key, value]) =>
                  key === "anomalias" ? value.length === 0 : !value
                )}>
                <i className="fa fa-times me-1"></i>
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="table-responsive" style={{maxHeight: "400px", overflowY: "auto"}}>
          <table className="table table-hover table-sm">
            <thead className="sticky-top" style={{backgroundColor: "#ffffff"}}>
              <tr>
                <th className="small text-center" style={{minWidth: "120px"}}>
                  <div>No. Bitácora</div>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Filtrar..."
                    value={anomaliasFilters.bitacora_id}
                    onChange={(e) => handleFilterChange("bitacora_id", e.target.value)}
                    style={{fontSize: "10px"}}
                  />
                </th>
                <th className="small text-center" style={{minWidth: "120px"}}>
                  <div>Cliente</div>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Filtrar..."
                    value={anomaliasFilters.cliente}
                    onChange={(e) => handleFilterChange("cliente", e.target.value)}
                    style={{fontSize: "10px"}}
                  />
                </th>
                <th className="small text-center" style={{minWidth: "120px"}}>
                  <div>Anomalías</div>
                  <div className="anomalias-dropdown-container mt-1" style={{position: "relative"}}>
                    <button
                      type="button"
                      className="form-control form-control-sm d-flex align-items-center justify-content-between"
                      onClick={() => {
                        const dropdown = document.getElementById("anomalias-dropdown");
                        dropdown.style.display =
                          dropdown.style.display === "block" ? "none" : "block";
                      }}
                      style={{
                        fontSize: "10px",
                        height: "32px",
                        border:
                          anomaliasFilters.anomalias.length > 0
                            ? "2px solid #0d6efd"
                            : "1px solid #ced4da",
                        backgroundColor:
                          anomaliasFilters.anomalias.length > 0 ? "#e7f3ff" : "white",
                        cursor: "pointer",
                      }}>
                      <div className="d-flex align-items-center gap-1">
                        {anomaliasFilters.anomalias.length === 0 ? (
                          <span className="text-muted">Filtrar...</span>
                        ) : (
                          <div className="d-flex gap-1 flex-wrap">
                            {anomaliasFilters.anomalias.slice(0, 2).map((anomalia) => {
                              const colors = {
                                ENA: "#f59e0b",
                                FM: "#ef4444",
                                ONC: "#06b6d4",
                                DR: "#10b981",
                              };
                              return (
                                <span
                                  key={anomalia}
                                  className="badge"
                                  style={{
                                    backgroundColor: colors[anomalia],
                                    color: "white",
                                    fontSize: "7px",
                                    padding: "1px 3px",
                                  }}>
                                  {anomalia}
                                </span>
                              );
                            })}
                            {anomaliasFilters.anomalias.length > 2 && (
                              <span
                                className="badge bg-secondary"
                                style={{fontSize: "7px", padding: "1px 3px"}}>
                                +{anomaliasFilters.anomalias.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <i className="fa fa-chevron-down" style={{fontSize: "8px"}}></i>
                    </button>

                    <div
                      id="anomalias-dropdown"
                      className="anomalias-dropdown-menu"
                      style={{
                        display: "none",
                        position: "absolute",
                        top: "100%",
                        left: "0",
                        right: "0",
                        backgroundColor: "white",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                        fontSize: "10px",
                        padding: "8px",
                      }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted fw-bold">Seleccionar anomalías:</small>
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0"
                            onClick={() => handleAnomaliasFilterChange(["ENA", "FM", "ONC", "DR"])}
                            style={{fontSize: "8px", textDecoration: "none"}}
                            title="Seleccionar todas">
                            Todas
                          </button>
                          <span style={{fontSize: "8px"}}>|</span>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0"
                            onClick={() => handleAnomaliasFilterChange([])}
                            style={{fontSize: "8px", textDecoration: "none"}}
                            title="Deseleccionar todas">
                            Limpiar
                          </button>
                        </div>
                      </div>

                      {[
                        {
                          value: "ENA",
                          label: "ENA",
                          color: "#f59e0b",
                          desc: "Estadia no autorizada",
                        },
                        {value: "FM", label: "FM", color: "#ef4444", desc: "Falla mecánica"},
                        {
                          value: "ONC",
                          label: "ONC",
                          color: "#06b6d4",
                          desc: "Usuario no responde",
                        },
                        {value: "DR", label: "DR", color: "#10b981", desc: "Desvío de ruta"},
                      ].map((anomalia) => (
                        <label
                          key={anomalia.value}
                          className="d-flex align-items-center gap-2 py-1 px-1"
                          style={{
                            cursor: "pointer",
                            borderRadius: "3px",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = "#ffffff")}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}>
                          <input
                            type="checkbox"
                            checked={anomaliasFilters.anomalias.includes(anomalia.value)}
                            onChange={(e) => {
                              const currentSelection = [...anomaliasFilters.anomalias];
                              if (e.target.checked) {
                                currentSelection.push(anomalia.value);
                              } else {
                                const index = currentSelection.indexOf(anomalia.value);
                                if (index > -1) {
                                  currentSelection.splice(index, 1);
                                }
                              }
                              handleAnomaliasFilterChange(currentSelection);
                            }}
                            style={{margin: "0", accentColor: anomalia.color}}
                          />
                          <span
                            className="badge"
                            style={{
                              backgroundColor: anomalia.color,
                              color: "white",
                              fontSize: "8px",
                              padding: "2px 4px",
                              minWidth: "25px",
                              textAlign: "center",
                            }}>
                            {anomalia.label}
                          </span>
                          <span style={{fontSize: "9px", color: "#6c757d"}}>{anomalia.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </th>
                <th className="small text-center" style={{minWidth: "150px"}}>
                  <div>Línea Transporte</div>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Filtrar..."
                    value={anomaliasFilters.linea_transporte}
                    onChange={(e) => handleFilterChange("linea_transporte", e.target.value)}
                    style={{fontSize: "10px"}}
                  />
                </th>
                <th className="small text-center" style={{minWidth: "120px"}}>
                  <div>Operador</div>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Filtrar..."
                    value={anomaliasFilters.operador}
                    onChange={(e) => handleFilterChange("operador", e.target.value)}
                    style={{fontSize: "10px"}}
                  />
                </th>
                <th className="small text-center" style={{minWidth: "120px"}}>
                  <div>Origen</div>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Filtrar..."
                    value={anomaliasFilters.origen}
                    onChange={(e) => handleFilterChange("origen", e.target.value)}
                    style={{fontSize: "10px"}}
                  />
                </th>
                <th className="small text-center" style={{minWidth: "120px"}}>
                  <div>Destino</div>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Filtrar..."
                    value={anomaliasFilters.destino}
                    onChange={(e) => handleFilterChange("destino", e.target.value)}
                    style={{fontSize: "10px"}}
                  />
                </th>
                <th className="small text-center" style={{minWidth: "100px"}}>
                  <div>Estado</div>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Filtrar..."
                    value={anomaliasFilters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    style={{fontSize: "10px"}}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAnomaliasData.map((bitacora, index) => (
                <tr key={bitacora._id || index}>
                  <td className="small text-center">{bitacora.bitacora_id || "N/A"}</td>
                  <td className="small">{bitacora.cliente || "N/A"}</td>
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
                  <td className="small">{bitacora.linea_transporte || "N/A"}</td>
                  <td className="small">{bitacora.operador || "N/A"}</td>
                  <td className="small">{bitacora.origen || "N/A"}</td>
                  <td className="small">{bitacora.destino || "N/A"}</td>
                  <td className="small text-center">
                    <span
                      className={`badge ${
                        bitacora.status === "cerrada"
                          ? "bg-danger"
                          : bitacora.status === "nueva"
                          ? "bg-warning"
                          : bitacora.status === "iniciada"
                          ? "bg-primary"
                          : bitacora.status === "validada"
                          ? "bg-info"
                          : bitacora.status === "finalizada"
                          ? "bg-secondary"
                          : "bg-light text-dark"
                      }`}>
                      {bitacora.status || "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <h1 className="fs-3 fw-semibold text-black m-0">Dashboard</h1>
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
                        Tablero de control de anomalías del sistema de monitoreo Intacsep
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

                      {/* Usuario No Responde - Gráfico de Barras */}
                      <div className="col-12 col-lg-6">
                        <div className="chart-card">
                          <div className="chart-header d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Usuario No Responde</h6>
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                type="button"
                                className={`btn ${
                                  oncViewMode === "chart" ? "btn-primary" : "btn-outline-primary"
                                }`}
                                onClick={() => setOncViewMode("chart")}
                                title="Vista de gráfico">
                                <i className="fa fa-bar-chart"></i>
                              </button>
                              <button
                                type="button"
                                className={`btn ${
                                  oncViewMode === "list" ? "btn-primary" : "btn-outline-primary"
                                }`}
                                onClick={() => setOncViewMode("list")}
                                title="Vista de lista">
                                <i className="fa fa-list"></i>
                              </button>
                            </div>
                          </div>
                          <div className="chart-body">
                            {oncViewMode === "chart" ? renderOncBarChart() : renderOncListView()}
                          </div>
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
                      onClick={() => downloadBitacorasAnomaliasExcel(filteredAnomaliasData)}
                      disabled={filteredAnomaliasData.length === 0}>
                      <i className="fa fa-file-excel me-1"></i>
                      Excel
                    </button>
                  </div>
                  <div className="chart-body">{renderBitacorasAnomalias()}</div>
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
