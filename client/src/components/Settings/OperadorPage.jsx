import {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";

const OperadorPage = () => {
  const [operadores, setOperadores] = useState([]);
  const [filteredOperadores, setFilteredOperadores] = useState([]);
  const [lineasTransporte, setLineasTransporte] = useState([]);
  const [formData, setFormData] = useState({nombre: "", lineaTransporte: ""});
  const [idToDelete, setIdToDelete] = useState("");
  const [currentOperador, setCurrentOperador] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'create' | 'edit'
  const baseUrl = import.meta.env.VITE_BASE_URL;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Filter states
  const [filters, setFilters] = useState({
    nombre: "",
    lineaTransporte: "",
  });

  const {user, verifyToken, setUser} = useAuth();
  const [roleData, setRoleData] = useState(null);
  const {isSidebarCollapsed} = useSidebar();

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken(); // Ensure user is verified
        setUser(data);
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        window.location.href = "/login";
      }
    };
    init();
  }, []);

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

    fetchRolePermissions();
  }, [user]);

  useEffect(() => {
    const fetchOperadores = async () => {
      try {
        const response = await fetch(`${baseUrl}/operadores`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setOperadores(data);
          setFilteredOperadores(data);
        } else {
          console.error("Failed to fetch operadores:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching operadores:", e);
      }
    };

    fetchOperadores();
  }, [baseUrl]);

  useEffect(() => {
    const fetchLineasTransporte = async () => {
      try {
        const response = await fetch(`${baseUrl}/lineas-transporte`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setLineasTransporte(data);
        } else {
          console.error("Failed to fetch lineas transporte:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching lineas transporte:", e);
      }
    };

    fetchLineasTransporte();
  }, [baseUrl]);

  // Filter operadores based on search criteria
  useEffect(() => {
    const filtered = operadores.filter((operador) => {
      // Handle both possible field names (nombre or name)
      const operadorName = operador.nombre || operador.name || "";
      const operadorLinea = operador.lineaTransporte || "";

      const nombreMatch = operadorName.toLowerCase().includes(filters.nombre.toLowerCase());
      const lineaMatch = operadorLinea
        .toLowerCase()
        .includes(filters.lineaTransporte.toLowerCase());

      return nombreMatch && lineaMatch;
    });
    setFilteredOperadores(filtered);

    // Update pagination
    const totalFiltered = filtered.length;
    setTotalItems(totalFiltered);
    setTotalPages(Math.ceil(totalFiltered / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [operadores, filters, itemsPerPage]);

  const handleFilterChange = (e) => {
    const {name, value} = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      nombre: "",
      lineaTransporte: "",
    });
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (event) => {
    const newLimit = Number(event.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Get paginated data
  const getPaginatedOperadores = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOperadores.slice(startIndex, endIndex);
  };

  const handleDelete = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/operadores/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setOperadores(operadores.filter((operador) => operador._id !== id));
        setShowDeleteModal(false);
      } else {
        console.error("Failed to delete operador:", response.statusText);
      }
    } catch (e) {
      console.error("Error deleting operador:", e);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseUrl}/operadores`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const created = await response.json();
        setOperadores([...operadores, created]);
        setFormData({nombre: "", lineaTransporte: ""});
        setModalType("");
      } else {
        console.error("Failed to create operador:", response.statusText);
      }
    } catch (e) {
      console.error("Error creating operador:", e);
    }
  };

  const handleSaveEdit = async () => {
    if (!currentOperador) return;

    try {
      const response = await fetch(`${baseUrl}/operadores/${currentOperador._id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const updated = await response.json();
        setOperadores(operadores.map((o) => (o._id === updated._id ? updated : o)));
        setFormData({nombre: "", lineaTransporte: ""});
        setCurrentOperador(null);
        setModalType("");
      } else {
        console.error("Failed to update operador:", response.statusText);
      }
    } catch (e) {
      console.error("Error updating operador:", e);
    }
  };

  const handleEdit = (operador) => {
    setCurrentOperador(operador);
    setFormData({
      nombre: operador.nombre || operador.name || "",
      lineaTransporte: operador.lineaTransporte || "",
    });
    setModalType("edit");
  };

  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData((prev) => ({...prev, [id]: value}));
  };

  return (
    <section id="operadores" className="settings-page">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <h1>Catálogos - Operadores</h1>

            <button type="button" className="new-btn" onClick={() => setModalType("create")}>
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* Filtros */}
          <div className="mx-3 mb-4">
            <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border-0 shadow-sm">
              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-filter text-muted"></i>
                <span className="text-muted small fw-medium">Filtros</span>
              </div>

              <div className="flex-grow-1 d-flex gap-3">
                <div className="flex-fill">
                  <input
                    type="text"
                    className="form-control form-control-sm border-0 bg-white shadow-sm"
                    placeholder="Buscar por nombre..."
                    name="nombre"
                    value={filters.nombre}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="flex-fill">
                  <select
                    className="form-control form-control-sm border-0 bg-white shadow-sm"
                    name="lineaTransporte"
                    value={filters.lineaTransporte}
                    onChange={handleFilterChange}>
                    <option value="">Todas las líneas de transporte</option>
                    {lineasTransporte.map((linea) => (
                      <option key={linea._id} value={linea.nombre}>
                        {linea.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary border-0"
                onClick={clearFilters}
                title="Limpiar filtros">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="settings-content">
            <div className="table-wrapper" style={{maxHeight: "60vh", overflowY: "auto"}}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{width: "60px"}}>ID</th>
                      <th>Nombre</th>
                      <th>Línea de Transporte</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedOperadores().map((operador) => (
                      <tr key={operador._id}>
                        <td className="text-center fw-bold">
                          {operador.numericId
                            ? operador.numericId.toString().padStart(4, "0")
                            : "N/A"}
                        </td>
                        <td>{operador.nombre || operador.name || ""}</td>
                        <td>{operador.lineaTransporte || ""}</td>
                        <td className="text-end">
                          <div className="action-buttons">
                            <button
                              className="btn btn-primary"
                              onClick={() => handleEdit(operador)}>
                              <i className="fas fa-edit"></i>
                            </button>

                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(operador._id)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredOperadores.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted">
                    No se encontraron operadores que coincidan con los filtros.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredOperadores.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-content">
                <div className="pagination-info">
                  <div className="items-per-page">
                    <label htmlFor="itemsPerPage" className="form-label">
                      Items por página:
                    </label>
                    <select
                      id="itemsPerPage"
                      className="form-select form-select-sm modern-select"
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="pagination-stats">
                  <span className="stats-text">{`${startItem}-${endItem} de ${totalItems}`}</span>
                </div>

                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}>
                    <i className="fa fa-chevron-left"></i>
                  </button>

                  <div className="page-numbers">
                    {Array.from({length: Math.min(3, totalPages)}).map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          className={`page-btn ${pageNum === currentPage ? "active" : ""}`}
                          onClick={() => handlePageChange(pageNum)}>
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 3 && (
                      <>
                        <span className="page-ellipsis">...</span>
                        <button
                          className={`page-btn ${totalPages === currentPage ? "active" : ""}`}
                          onClick={() => handlePageChange(totalPages)}>
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}>
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Crear */}
          {modalType === "create" && (
            <ModalTemplate
              show
              title="Crear Operador"
              onClose={() => setModalType("")}
              onSubmit={handleCreate}>
              <div className="mb-3">
                <label htmlFor="nombre" className="form-label">
                  Nombre
                </label>
                <input
                  id="nombre"
                  className="form-control"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="lineaTransporte" className="form-label">
                  Línea de Transporte
                </label>
                <select
                  id="lineaTransporte"
                  className="form-control"
                  value={formData.lineaTransporte}
                  onChange={handleChange}
                  required>
                  <option value="">Selecciona una línea de transporte</option>
                  {lineasTransporte.map((linea) => (
                    <option key={linea._id} value={linea.nombre}>
                      {linea.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </ModalTemplate>
          )}

          {/* Modal: Editar */}
          {modalType === "edit" && currentOperador && (
            <ModalTemplate
              show
              title="Editar Operador"
              onClose={() => {
                setModalType("");
                setCurrentOperador(null);
              }}
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}>
              <div className="mb-3">
                <label htmlFor="nombre" className="form-label">
                  Nombre
                </label>
                <input
                  id="nombre"
                  className="form-control"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="lineaTransporte" className="form-label">
                  Línea de Transporte
                </label>
                <select
                  id="lineaTransporte"
                  className="form-control"
                  value={formData.lineaTransporte}
                  onChange={handleChange}
                  required>
                  <option value="">Selecciona una línea de transporte</option>
                  {lineasTransporte.map((linea) => (
                    <option key={linea._id} value={linea.nombre}>
                      {linea.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </ModalTemplate>
          )}

          {/* Modal: Eliminar */}
          {showDeleteModal && (
            <ModalTemplate
              show
              title="Confirmar Eliminación"
              onClose={handleCloseDeleteModal}
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmDelete(idToDelete);
              }}>
              <p>¿Está seguro de que desea eliminar este operador?</p>
            </ModalTemplate>
          )}
        </div>
      </div>
    </section>
  );
};

export default OperadorPage;
