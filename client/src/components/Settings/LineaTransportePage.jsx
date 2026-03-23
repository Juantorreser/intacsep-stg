import {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";

const LineaTransportePage = () => {
  const [lineasTransporte, setLineasTransporte] = useState([]);
  const [filteredLineasTransporte, setFilteredLineasTransporte] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({nombre: "", cliente: ""});
  const [idToDelete, setIdToDelete] = useState("");
  const [currentLineaTransporte, setCurrentLineaTransporte] = useState(null);
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
    cliente: "",
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
    const fetchLineasTransporte = async () => {
      try {
        const response = await fetch(`${baseUrl}/lineas-transporte`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setLineasTransporte(data);
          setFilteredLineasTransporte(data);
        } else {
          console.error("Failed to fetch lineas transporte:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching lineas transporte:", e);
      }
    };

    fetchLineasTransporte();
  }, [baseUrl]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`${baseUrl}/clients`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        } else {
          console.error("Failed to fetch clients:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching clients:", e);
      }
    };

    fetchClients();
  }, [baseUrl]);

  // Filter lineas transporte based on search criteria
  useEffect(() => {
    const filtered = lineasTransporte.filter((linea) => {
      const nombreMatch =
        linea.nombre && linea.nombre.toLowerCase().includes(filters.nombre.toLowerCase());
      const clienteMatch =
        linea.cliente && linea.cliente.toLowerCase().includes(filters.cliente.toLowerCase());

      return nombreMatch && clienteMatch;
    });
    setFilteredLineasTransporte(filtered);

    // Update pagination
    const totalFiltered = filtered.length;
    setTotalItems(totalFiltered);
    setTotalPages(Math.ceil(totalFiltered / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [lineasTransporte, filters, itemsPerPage]);

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
      cliente: "",
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
  const getPaginatedLineasTransporte = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLineasTransporte.slice(startIndex, endIndex);
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
      const response = await fetch(`${baseUrl}/lineas-transporte/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setLineasTransporte(lineasTransporte.filter((linea) => linea._id !== id));
        setShowDeleteModal(false);
      } else {
        console.error("Failed to delete linea transporte:", response.statusText);
      }
    } catch (e) {
      console.error("Error deleting linea transporte:", e);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseUrl}/lineas-transporte`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const created = await response.json();
        setLineasTransporte([...lineasTransporte, created]);
        setFormData({nombre: "", cliente: ""});
        setModalType("");
      } else {
        console.error("Failed to create linea transporte:", response.statusText);
      }
    } catch (e) {
      console.error("Error creating linea transporte:", e);
    }
  };

  const handleSaveEdit = async () => {
    if (!currentLineaTransporte) return;

    try {
      const response = await fetch(`${baseUrl}/lineas-transporte/${currentLineaTransporte._id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const updated = await response.json();
        setLineasTransporte(lineasTransporte.map((l) => (l._id === updated._id ? updated : l)));
        setFormData({nombre: "", cliente: ""});
        setCurrentLineaTransporte(null);
        setModalType("");
      } else {
        console.error("Failed to update linea transporte:", response.statusText);
      }
    } catch (e) {
      console.error("Error updating linea transporte:", e);
    }
  };

  const handleEdit = (linea) => {
    setCurrentLineaTransporte(linea);
    setFormData({
      nombre: linea.nombre,
      cliente: linea.cliente,
    });
    setModalType("edit");
  };

  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData((prev) => ({...prev, [id]: value}));
  };

  return (
    <section id="lineasTransporte" className="settings-page">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <h1>Catálogos - Líneas de Transporte</h1>

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
                    name="cliente"
                    value={filters.cliente}
                    onChange={handleFilterChange}>
                    <option value="">Todos los clientes</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client.razon_social}>
                        {client.razon_social}
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
                      <th>Cliente</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedLineasTransporte().map((linea) => (
                      <tr key={linea._id}>
                        <td className="text-center fw-bold">
                          {linea.numericId ? linea.numericId.toString().padStart(4, "0") : "N/A"}
                        </td>
                        <td>{linea.nombre}</td>
                        <td>{linea.cliente}</td>
                        <td className="text-end">
                          <div className="action-buttons">
                            <button className="btn btn-primary" onClick={() => handleEdit(linea)}>
                              <i className="fas fa-edit"></i>
                            </button>

                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(linea._id)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredLineasTransporte.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted">
                    No se encontraron líneas de transporte que coincidan con los filtros.
                  </p>
                </div>
              )}
            </div>

          {/* Pagination Controls */}
          {filteredLineasTransporte.length > 0 && (
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
          </div>

          {/* Modal: Crear */}
          {modalType === "create" && (
            <ModalTemplate
              show
              title="Crear Línea de Transporte"
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
                <label htmlFor="cliente" className="form-label">
                  Cliente
                </label>
                <select
                  id="cliente"
                  className="form-control"
                  value={formData.cliente}
                  onChange={handleChange}
                  required>
                  <option value="">Selecciona un cliente</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client.razon_social}>
                      {client.razon_social}
                    </option>
                  ))}
                </select>
              </div>
            </ModalTemplate>
          )}

          {/* Modal: Editar */}
          {modalType === "edit" && currentLineaTransporte && (
            <ModalTemplate
              show
              title="Editar Línea de Transporte"
              onClose={() => {
                setModalType("");
                setCurrentLineaTransporte(null);
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
                <label htmlFor="cliente" className="form-label">
                  Cliente
                </label>
                <select
                  id="cliente"
                  className="form-control"
                  value={formData.cliente}
                  onChange={handleChange}
                  required>
                  <option value="">Selecciona un cliente</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client.razon_social}>
                      {client.razon_social}
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
              <p>¿Está seguro de que desea eliminar esta línea de transporte?</p>
            </ModalTemplate>
          )}
        </div>
      </div>
    </section>
  );
};

export default LineaTransportePage;
