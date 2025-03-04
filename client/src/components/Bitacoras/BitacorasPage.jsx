import React, {useState, useEffect} from "react";
import {createRoot} from "react-dom/client";
import {useAuth} from "../../context/AuthContext";
import {useNavigate} from "react-router-dom";
import Header from "../Header";
import Sidebar from "../Sidebar";
import "jspdf-autotable"; // For table support in jsPDF
import {sortBitacoras} from "../../utils/utils"; // Assume these functions exist
import BitacoraDetail from "./BitacoraDetail";
import {
  fetchBitacoras,
  fetchClients,
  fetchMonitoreos,
  fetchUsers,
  fetchOrigenes,
  fetchDestinos,
  fetchOperadores,
} from "../../utils/api";

const BitacorasPage = () => {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const {user} = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState("all");
  const [PDFOption, setPDFOption] = useState({
    selectValue: "",
  });
  const [bitacoras, setBitacoras] = useState([]);
  const [selectedBitacora, setSelectedBitacora] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1); // Track total pages
  const [totalItems, setTotalItems] = useState(25);
  const [clients, setClients] = useState([]);
  const [monitoreos, setMonitoreos] = useState([]);
  const [users, setUsers] = useState([]);
  const [origenes, setOrigenes] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [sortField, setSortField] = useState("bitacora_id"); // Default sort field
  const [sortOrder, setSortOrder] = useState("desc"); // Default sort order
  const [statusFilter, setStatusFilter] = useState("");
  const [creationDateFilter, setCreationDateFilter] = useState("");
  const [clienteFilter, setClienteFilter] = useState("");
  const [operadorFilter, setOperadorFilter] = useState("");
  const [monitoreoFilter, setMonitoreoFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const [loadingBitacoras, setLoadingBitacoras] = useState(false);
  const [selectedTransporte, setSelectedTransporte] = useState(null);
  const [formData, setFormData] = useState({
    bitacora_id: "",
    folio_servicio: "",
    linea_transporte: ".",
    destino: "",
    origen: "",
    monitoreo: "",
    cliente: "",
    enlace: ".",
    id_acceso: ".",
    contra_acceso: ".",
    remolque: {
      eco: "",
      placa: "",
      color: "",
      capacidad: "",
      sello: "",
    },
    tracto: {
      eco: "",
      placa: "",
      marca: "",
      modelo: "",
      color: "",
      tipo: "",
    },
    operador: ".",
    telefono: ".",
    inicioMonitoreo: "",
    finalMonitoreo: "",
    status: "nueva",
    eventos: [],
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoadingBitacoras(true);
        const [
          bitacorasData,
          clientsData,
          monitoreosData,
          usersData,
          origenesData,
          destinosData,
          operadoresData,
        ] = await Promise.all([
          fetchBitacoras(currentPage, itemsPerPage),
          fetchClients(),
          fetchMonitoreos(),
          fetchUsers(),
          fetchOrigenes(),
          fetchDestinos(),
          fetchOperadores(),
        ]);

        setBitacoras(bitacorasData.bitacoras);
        setTotalItems(bitacorasData.totalItems);
        setTotalPages(bitacorasData.totalPages);
        setClients(clientsData);
        setMonitoreos(monitoreosData);
        setUsers(usersData);
        setOrigenes(origenesData);
        setDestinos(destinosData);
        setOperadores(operadoresData);

        updateFormDataFromUser();
        setBitacoras(bitacorasData.bitacoras);
        setTotalItems(bitacorasData.totalItems);
        setTotalPages(bitacorasData.totalPages);
        setClients(clientsData);
        setMonitoreos(monitoreosData);
        setUsers(usersData);
        setOrigenes(origenesData);
        setDestinos(destinosData);
        setOperadores(operadoresData);

        updateFormDataFromUser();
      } catch (e) {
        console.error("Verification failed:", e);
      } finally {
        setLoadingBitacoras(false);
      }
    };

    initialize();
  }, [currentPage, itemsPerPage]);

  const updateFormDataFromUser = () => {
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        operador: `${user.firstName} ${user.lastName}`,
        telefono: user.phone,
      }));
    }
  };

  const handleModalToggle = () => {
    setShowModal(!showModal);
  };

  const handlePDFToggle = (bitacora) => {
    setShowPrintModal(!showPrintModal);
    setSelectedBitacora(bitacora);
  };

  const handleChange = (e) => {
    const {id, value} = e.target;
    if (id.startsWith("remolque") || id.startsWith("tracto")) {
      const [field, key] = id.split("_");
      setFormData((prevData) => ({
        ...prevData,
        [field]: {
          ...prevData[field],
          [key]: value,
        },
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [id]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseUrl}/bitacora`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        // After successful creation, you might want to refetch bitacoras
        fetchBitacoras();
        handleModalToggle();
      } else {
        console.error("Failed to create bitácora:", response.statusText);
      }
    } catch (e) {
      console.error("Error creating bitácora:", e);
    }
  };

  const handleRadioChange = (e) => {
    setSelectedOption(e.target.value);
    if (e.target.value === "option2") {
      setFormData({...formData, selectValue: ""}); // Reset select value when "option2" is selected
    }
  };

  const handleSelectChange = (e) => {
    setSelectedTransporte(e.target.value);
  };

  const handlePDFSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    if (selectedOption === "all") {
      console.log(selectedBitacora?.bitacora_id);
      generatePDF(selectedBitacora);
    } else if (selectedOption === "one") {
      console.log(selectedTransporte);
      generatePDF(selectedBitacora, selectedTransporte);
    }
  };

  const getFilteredBitacoras = () => {
    let filtered = bitacoras;

    if (idFilter) {
      filtered = filtered.filter((bitacora) => bitacora.bitacora_id.toString().includes(idFilter));
    }

    if (statusFilter) {
      filtered = filtered.filter((bitacora) => bitacora.status === statusFilter);
    }

    if (clienteFilter) {
      filtered = filtered.filter((bitacora) => bitacora.cliente === clienteFilter);
    }

    if (operadorFilter) {
      filtered = filtered.filter((bitacora) => bitacora.operador === operadorFilter);
    }

    if (monitoreoFilter) {
      filtered = filtered.filter((bitacora) => bitacora.monitoreo === monitoreoFilter);
    }

    if (creationDateFilter) {
      filtered = filtered.filter(
        (bitacora) =>
          new Date(bitacora.createdAt).toISOString().split("T")[0] === creationDateFilter
      );
    }

    return filtered;
  };

  const sortedFilteredBitacoras = sortBitacoras(getFilteredBitacoras(), sortField, sortOrder);

  const filteredBitacoras = bitacoras.filter((bitacora) => {
    return (
      (clienteFilter === "" || bitacora.cliente === clienteFilter) &&
      (operadorFilter === "" || bitacora.operador === operadorFilter)
    );
  });

  const clearFilters = () => {
    setStatusFilter("");
    setCreationDateFilter("");
    setSortField("ID");
    setSortOrder("desc");
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchBitacoras(newPage, itemsPerPage);
  };

  const handleItemsPerPageChange = (event) => {
    const newLimit = Number(event.target.value);
    setItemsPerPage(newLimit);
    fetchBitacoras(currentPage, newLimit); // Refetch with new limit
  };

  const generatePDF = async (bitacora, transporteId = "") => {
    const tempContainer = document.createElement("div");
    tempContainer.id = "tempContainer";
    tempContainer.style.position = "absolute";
    tempContainer.style.top = "0";
    tempContainer.style.left = "0";
    tempContainer.style.width = "100%";
    tempContainer.style.backgroundColor = "#fff";
    tempContainer.style.zIndex = "10000";
    document.body.appendChild(tempContainer);

    const root = createRoot(tempContainer);
    if (transporteId == "") {
      root.render(<BitacoraDetail bitacora={bitacora} />);
    } else {
      root.render(<BitacoraDetail bitacora={bitacora} transporteId={selectedTransporte} />);
    }

    const style = document.createElement("style");
    style.textContent = `
    @media print {
      .sidebar-wrapper {
        display: none; /* Hide everything outside tempContainer */
      }
    }
  `;
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
      root.unmount();
      document.body.removeChild(tempContainer);
      document.head.removeChild(style);
    }, 10); // Adjusted delay to ensure rendering completion
  };

  const handleEditClick = (bitacoraId) => {
    navigate(`/bitacoras/${bitacoraId}/editada`);
  };

  const handleSortChange = (field) => {
    const order = field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);
    sortData(field, order);
  };

  const sortData = (field, order) => {
    filteredBitacoras.sort((a, b) => {
      if (a[field] < b[field]) {
        return order === "asc" ? -1 : 1;
      }
      if (a[field] > b[field]) {
        return order === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const getEventColor = (bitacora) => {
    if (bitacora.status != "iniciada" && bitacora.status != "validada") {
      return ["#333235"]; // No events
    }

    const latestEvent = bitacora.eventos.reduce((latest, current) =>
      new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current
    );

    const frecuencia = latestEvent.frecuencia;
    if (!frecuencia) return ["#333235"]; // No frecuencia

    const frecuenciaMs = frecuencia * 60000; // Convert minutes to milliseconds
    const eventTimeMs = new Date(latestEvent.createdAt).getTime();
    const currentTimeMs = new Date().getTime();
    const elapsedTimeMs = currentTimeMs - eventTimeMs;

    const greenColor = "#51FF4E"; // Green
    const yellowColor = "#ECEC27"; // Yellow
    const redColor = "#F82929"; // Red

    // Determine the color
    if (elapsedTimeMs < frecuenciaMs) {
      const threshold = frecuenciaMs * 0.75; // 75% of the frecuencia
      if (elapsedTimeMs < threshold) {
        return [greenColor]; // Green
      } else {
        return [yellowColor]; // Yellow
      }
    } else {
      return [redColor]; // Red
    }
  };

  const getRecorrido = (bitacora) => {
    if (
      bitacora.status != "iniciada" &&
      bitacora.status != "validada" &&
      bitacora.status != "cerrada" &&
      bitacora.status != "finalizada"
    ) {
      return ""; // No events
    }

    const latestEvent = bitacora.eventos.reduce((latest, current) =>
      new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current
    );

    const recorrido = latestEvent.nombre;
    if (!recorrido) return ""; // No frecuencia

    return recorrido;
  };

  return (
    <section id="activeBits">
      <Header />
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <div className="d-flex justify-content-between align-items-center mx-3">
            <h1 className="text-center flex-grow-1 fs-3 fw-semibold text-black">Bitácoras</h1>
            <button className="btn btn-primary rounded-5" onClick={() => setShowModal(!showModal)}>
              <i className="fa fa-plus"></i>
            </button>
          </div>

          {/* Table */}
          <div className="mx-3 my-2 table-wrapper">
            <div className="table-container">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th
                        className="half"
                        onClick={() => handleSortChange("frecuencia")}
                        style={{cursor: "pointer"}}>
                        Frec {sortField === "frecuencia" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="one"
                        onClick={() => handleSortChange("bitacora_id")}
                        style={{cursor: "pointer"}}>
                        ID {sortField === "bitacora_id" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="two"
                        onClick={() => handleSortChange("cliente")}
                        style={{cursor: "pointer"}}>
                        Cliente {sortField === "cliente" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="two"
                        onClick={() => handleSortChange("monitoreo")}
                        style={{cursor: "pointer"}}>
                        Tipo Monitoreo{" "}
                        {sortField === "monitoreo" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="two"
                        onClick={() => handleSortChange("operador")}
                        style={{cursor: "pointer"}}>
                        Operador {sortField === "operador" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="two"
                        onClick={() => handleSortChange("createdAt")}
                        style={{cursor: "pointer"}}>
                        Fecha Creación{" "}
                        {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="one"
                        onClick={() => handleSortChange("status")}
                        style={{cursor: "pointer"}}>
                        Estatus <br /> Bitácora{" "}
                        {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="text-center two">
                        Estatus <br /> Documentación
                      </th>
                      <th className="text-center half relative">
                        <i className="fa fa-download"></i>
                      </th>
                      <th className="text-center half">
                        <i className="fa fa-clipboard-check"></i>
                      </th>
                      {/* <th className="text-center half">
                        <i className="fa fa-eye"></i>
                      </th> */}
                    </tr>

                    {/* Filter Row */}
                    <tr>
                      <th className="half"></th>
                      <th className="one">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="# ID"
                          value={idFilter}
                          onChange={(e) => setIdFilter(e.target.value)}
                        />
                      </th>

                      <th className="two">
                        <select
                          id="clienteFilter"
                          className="form-select"
                          value={clienteFilter}
                          onChange={(e) => setClienteFilter(e.target.value)}>
                          <option value="">Todos</option>
                          {clients.map((client, id) => (
                            <option key={id} value={client.razon_social}>
                              {client.razon_social}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th className="two">
                        <select
                          id="clienteFilter"
                          className="form-select"
                          value={monitoreoFilter}
                          onChange={(e) => setMonitoreoFilter(e.target.value)}>
                          <option value="">Todos</option>
                          {monitoreos.map((monitreo, id) => (
                            <option key={id} value={monitreo.tipoMonitoreo}>
                              {monitreo.tipoMonitoreo}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th className="two">
                        <select
                          id="operadorFilter"
                          className="form-select"
                          value={operadorFilter}
                          onChange={(e) => setOperadorFilter(e.target.value)}>
                          <option value="">Todos</option>
                          {operadores.map((operador, id) => (
                            <option key={id} value={operador.name}>
                              {operador.name}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th className="two">
                        <div className="">
                          <input
                            id="creationDateFilter"
                            type="date"
                            className="form-control"
                            value={creationDateFilter}
                            onChange={(e) => setCreationDateFilter(e.target.value)}
                          />
                        </div>
                      </th>
                      <th className="one">
                        <div>
                          <select
                            id="statusFilter"
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="nueva">Nueva</option>
                            <option value="validada">Validada</option>
                            <option value="iniciada">Iniciada</option>
                            <option value="cerrada">Cerrada</option>
                            <option value="finalizada">Finalizada</option>
                            <option value="cerrada (e)">Cerrada (e)</option>
                          </select>
                        </div>
                      </th>
                      <th className="two"></th>
                      <th className="half"></th>
                      <th className="half"></th>
                      {/* <th className="half"></th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingBitacoras ? (
                      <div className="loading-placeholder text-center py-5 w-full h-full flex items-center justify-center">
                        <i className="fa fa-spinner fa-spin me-1" style={{fontSize: "24px"}}></i>{" "}
                        Cargando bitacoras...
                      </div>
                    ) : (
                      sortedFilteredBitacoras.map((bitacora) => (
                        <tr key={bitacora._id}>
                          <td className="half text-capitalize">
                            <div className="semaforo">
                              {getEventColor(bitacora).map((color, index) => (
                                <div
                                  key={index}
                                  className={`circle`}
                                  style={{
                                    backgroundColor: color,
                                  }}></div>
                              ))}
                            </div>
                          </td>
                          <td className="one">
                            <a href={`/bitacora/${bitacora._id}`} className="text-decoration-none">
                              {bitacora.bitacora_id}
                            </a>
                          </td>
                          <td className="two">{bitacora.cliente}</td>
                          <td className="two">{bitacora.monitoreo}</td>
                          <td className="two ">{bitacora.operador}</td>
                          <td className="two">
                            {new Date(bitacora.createdAt).toLocaleDateString()}
                          </td>
                          <td className="one text-capitalize">
                            {bitacora.status}
                            {bitacora.edited ? " (e)" : ""}
                          </td>
                          <td className="two">{getRecorrido(bitacora)}</td>
                          <td className="text-center half position-relative">
                            <button
                              className={
                                bitacora.status !== "finalizada" &&
                                bitacora.status !== "cerrada" &&
                                bitacora.status !== "cerrada (e)"
                                  ? "btn btn-secondary icon-btn"
                                  : "btn btn-danger icon-btn"
                              }
                              // onClick={() => generatePDF(bitacora)}
                              onClick={() => handlePDFToggle(bitacora)}
                              disabled={
                                bitacora.status !== "finalizada" &&
                                bitacora.status !== "cerrada" &&
                                bitacora.status !== "cerrada (e)"
                              }>
                              <i className="fa fa-file-pdf"></i>
                            </button>
                          </td>
                          <td className="text-center half position-relative">
                            <button
                              className={
                                bitacora.edited === false
                                  ? "btn btn-secondary icon-btn"
                                  : "btn btn-warning icon-btn"
                              }
                              // onClick={() => generatePDF(bitacora.edited_bitacora)}
                              onClick={() => handlePDFToggle(bitacora)}
                              disabled={bitacora.edited == false}>
                              <i className="fa fa-file-pdf"></i>
                            </button>
                          </td>
                          {/* <td className="text-center half position-relative">
                            <button
                              className={
                                bitacora.edited == false
                                  ? "btn btn-secondary icon-btn"
                                  : "btn btn-primary icon-btn"
                              }
                              onClick={() => handleEditClick(bitacora._id)}
                              disabled={bitacora.edited == false}>
                              <i className="fa fa-eye"></i>
                            </button>
                          </td> */}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="d-flex justify-content-between align-items-center mx-3 my-3 gap-4">
            <div className="d-flex align-items-center justify-content-start">
              <label htmlFor="itemsPerPage" className="form-label p-0 m-0 s-font fw-bold">
                Items Por Página:
              </label>
              <select
                id="itemsPerPage"
                className="form-select itemsSelector s-font ms-2"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="m-font">{`${startItem}-${endItem} de ${totalItems}`}</span>
              </div>
            </div>

            <div className="d-flex align-items-center">
              <button
                className="btn border-0"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}>
                <i className="fa fa-chevron-left s-font"></i>
              </button>

              <div className="mx-0 s-font">
                {Array.from({length: Math.min(3, totalPages)}).map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      className={`btn pageLink s-font ${
                        pageNum === currentPage ? "fw-bold fs-6" : "opacity-75"
                      }`}
                      onClick={() => handlePageChange(pageNum)}>
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 3 && (
                  <>
                    <span className="mx-1">...</span>
                    <button
                      className={`btn  pageLink s-font ${
                        totalPages === currentPage ? "fw-bold" : ""
                      }`}
                      onClick={() => handlePageChange(totalPages)}>
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                className="btn border-0"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}>
                <i className="fa fa-chevron-right s-font"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print PDF Select Modal */}
      <>
        {showPrintModal && (
          <>
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              aria-labelledby="exampleModalLabel"
              aria-hidden="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-body w-100">
                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={handlePDFToggle}
                      style={{
                        position: "absolute",
                        top: "15px",
                        right: "15px",
                      }}></button>
                    <div className="w-100 col justify-content-center align-items-center">
                      <img src="/logo2.png" alt="" width={50} />
                      <p className="p-0 m-0"> Metodo de Impresion</p>
                    </div>
                    <hr />
                    <form onSubmit={handlePDFSubmit}>
                      {/* Radio Buttons */}
                      <div className="mb-3">
                        <div>
                          <input
                            type="radio"
                            id="all"
                            name="radioOption"
                            value="all"
                            checked={selectedOption === "all"}
                            onChange={handleRadioChange}
                          />
                          <label htmlFor="all">Todos los transportes</label>
                        </div>
                        <div>
                          <input
                            type="radio"
                            id="one"
                            name="radioOption"
                            value="one"
                            checked={selectedOption === "one"}
                            onChange={handleRadioChange}
                          />
                          <label htmlFor="one">Seleccionar transporte</label>
                        </div>
                      </div>

                      {/* Conditionally Render Select Dropdown */}
                      {selectedOption === "one" && selectedBitacora?.transportes?.length > 0 && (
                        <div className="mb-3">
                          <label htmlFor="selectValue" className="form-label">
                            ID del transporte
                          </label>
                          <select
                            id="selectValue"
                            className="form-select"
                            value={formData.selectValue}
                            onChange={handleSelectChange}>
                            <option value="">Seleccionar ID</option>
                            {selectedBitacora.transportes.map((transporte) => (
                              <option value={transporte.id} key={transporte.id}>
                                {transporte.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className="btn btn-danger me-3 px-2"
                          onClick={handlePDFToggle}>
                          Cancelar
                        </button>
                        <button type="submit" className="btn btn-success px-4">
                          Imprimir
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}
      </>

      {/* Modal with Backdrop */}
      {showModal && (
        <>
          <div
            className="modal fade show d-block"
            id="exampleModal"
            tabIndex="-1"
            aria-labelledby="exampleModalLabel"
            aria-hidden="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-body w-100">
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleModalToggle}
                    style={{
                      position: "absolute",
                      top: "15px",
                      right: "15px",
                    }}></button>
                  <div className="w-100 col justify-content-center align-items-center">
                    <img src="/logo2.png" alt="" width={50} />
                    <p className="p-0 m-0"> Nueva Bitácora</p>
                  </div>
                  <hr />
                  <form onSubmit={handleSubmit}>
                    {/* Tipo de Monitoreo */}
                    <div className="mb-3">
                      <label htmlFor="monitoreo" className="form-label">
                        Tipo de Monitoreo
                      </label>
                      <select
                        className="form-select"
                        id="monitoreo"
                        aria-label="Tipo de Monitoreo"
                        value={formData.monitoreo}
                        onChange={handleChange}
                        required>
                        <option value="">Selecciona una opción</option>
                        {monitoreos.map((monitoreo) => (
                          <option key={monitoreo._id} value={monitoreo.tipoMonitoreo}>
                            {monitoreo.tipoMonitoreo}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cliente */}
                    <div className="mb-3">
                      <label htmlFor="cliente" className="form-label">
                        Cliente
                      </label>
                      <select
                        className="form-select"
                        id="cliente"
                        aria-label="Cliente"
                        value={formData.cliente}
                        onChange={handleChange}
                        required>
                        <option value="">Selecciona una opción</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client.razon_social}>
                            {client.razon_social}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group mb-3">
                      <label htmlFor="folio_servicio">Folio de Servicio</label>
                      <input
                        id="folio_servicio"
                        type="text"
                        value={formData.folio_servicio}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                    {/* <div className="form-group mb-3">
                      <label htmlFor="linea_transporte">Línea de Transporte</label>
                      <input
                        id="linea_transporte"
                        type="text"
                        value={formData.linea_transporte}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div> */}

                    <div className="mb-3">
                      <label htmlFor="origen" className="form-label">
                        Origen
                      </label>
                      <select
                        id="origen"
                        className="form-select"
                        value={formData.origen}
                        onChange={handleChange}
                        required>
                        <option value="">Seleccionar</option>
                        {origenes.map((origen) => (
                          <option key={origen._id} value={origen.name}>
                            {origen.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="destino" className="form-label">
                        Destino
                      </label>
                      <select
                        id="destino"
                        className="form-select"
                        value={formData.destino}
                        onChange={handleChange}
                        required>
                        <option value="">Seleccionar</option>
                        {destinos.map((destino) => (
                          <option key={destino._id} value={destino.name}>
                            {destino.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* <div className="mb-3">
                      <label htmlFor="operador" className="form-label">
                        Operador
                      </label>
                      <select
                        id="operador"
                        className="form-select"
                        value={formData.operador}
                        onChange={handleChange}
                        required>
                        <option value="">Seleccionar</option>
                        {operadores.map((operador) => (
                          <option key={operador._id} value={operador.name}>
                            {operador.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group mb-3">
                      <label htmlFor="telefono">Telefono</label>
                      <input
                        id="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div> */}

                    {/* <div className="form-group mb-3">
                      <label htmlFor="enlace">Enlace</label>
                      <input
                        id="enlace"
                        type="text"
                        value={formData.enlace}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label htmlFor="id_acceso">ID de Acceso</label>
                      <input
                        id="id_acceso"
                        type="text"
                        value={formData.id_acceso}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label htmlFor="contra_acceso">Contraseña de Acceso</label>
                      <input
                        id="contra_acceso"
                        type="text"
                        value={formData.contra_acceso}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div> */}
                    <hr />

                    <div className="d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-danger me-3 px-2"
                        onClick={handleModalToggle}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-success px-4">
                        Crear
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </section>
  );
};

export default BitacorasPage;
