import React, {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";
import {useNavigate} from "react-router-dom";

const TiposMonitoreo = () => {
  const [monitoreos, setMonitoreos] = useState([]);
  const [filteredMonitoreos, setFilteredMonitoreos] = useState([]);
  const [newMonitoreo, setNewMonitoreo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentMonitoreo, setCurrentMonitoreo] = useState(null);
  const [editingName, setEditingName] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Filter states
  const [filters, setFilters] = useState({
    tipoMonitoreo: "",
  });

  const {user, verifyToken, setUser} = useAuth();
  const [roleData, setRoleData] = useState(null);
  const {isSidebarCollapsed} = useSidebar();
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken(); // Ensure user is verified
        setUser(data);
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        navigate("/login");
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
    const fetchMonitoreos = async () => {
      try {
        const response = await fetch(`${baseUrl}/monitoreos`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setMonitoreos(data);
          setFilteredMonitoreos(data);
        } else {
          console.error("Failed to fetch monitoreos:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching monitoreos:", e);
      }
    };

    fetchMonitoreos();
  }, []);

  // Filter monitoreos based on search criteria
  useEffect(() => {
    const filtered = monitoreos.filter((monitoreo) => {
      const tipoMatch = monitoreo.tipoMonitoreo
        .toLowerCase()
        .includes(filters.tipoMonitoreo.toLowerCase());
      return tipoMatch;
    });
    setFilteredMonitoreos(filtered);

    // Update pagination
    const totalFiltered = filtered.length;
    setTotalItems(totalFiltered);
    setTotalPages(Math.ceil(totalFiltered / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [monitoreos, filters, itemsPerPage]);

  const handleConfirmDelete = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/monitoreos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setMonitoreos(monitoreos.filter((monitoreo) => monitoreo._id !== id));
        setShowDeleteModal(false);
      } else {
        console.error("Failed to delete monitoreo:", response.statusText);
      }
    } catch (e) {
      console.error("Error deleting monitoreo:", e);
    }
  };

  const handleFilterChange = (e) => {
    const {name, value} = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      tipoMonitoreo: "",
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
  const getPaginatedMonitoreos = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMonitoreos.slice(startIndex, endIndex);
  };

  const handleDelete = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newMonitoreo) return;

    try {
      const response = await fetch(`${baseUrl}/monitoreos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({tipoMonitoreo: newMonitoreo}),
        credentials: "include",
      });

      if (response.ok) {
        const createdMonitoreo = await response.json();
        setMonitoreos([...monitoreos, createdMonitoreo]);
        setNewMonitoreo(""); // Clear the input field
      } else {
        console.error("Failed to create monitoreo:", response.statusText);
      }
    } catch (e) {
      console.error("Error creating monitoreo:", e);
    }
  };

  const handleSaveEdit = async () => {
    if (!currentMonitoreo) return;

    try {
      const response = await fetch(`${baseUrl}/monitoreos/${currentMonitoreo._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({tipoMonitoreo: editingName}),
        credentials: "include",
      });

      if (response.ok) {
        const updatedMonitoreo = await response.json();
        setMonitoreos(
          monitoreos.map((monitoreo) =>
            monitoreo._id === updatedMonitoreo._id ? updatedMonitoreo : monitoreo
          )
        );
        setShowModal(false);
        setCurrentMonitoreo(null);
        setEditingName("");
      } else {
        console.error("Failed to edit Monitoreo:", response.statusText);
      }
    } catch (e) {
      console.error("Error editing Monitoreo:", e);
    }
  };

  return (
    <section id="pastBits" className="settings-page">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <h1>Catálogos - Tipos de Monitoreo</h1>

            {roleData?.tipos_de_monitoreo?.create && (
              <button type="button" className="new-btn" onClick={() => setShowModal("create")}>
                <i className="fas fa-plus"></i>
              </button>
            )}
          </div>

          {/* Create New Monitoreo Form */}
          {showModal === "create" && (
            <ModalTemplate
              show
              title="Crear Tipo de Monitoreo"
              onClose={() => setShowModal(false)}
              onSubmit={handleCreate}>
              <div className="mb-3">
                <label htmlFor="newMonitoreo" className="form-label">
                  Tipo de Monitoreo
                </label>
                <input
                  id="newMonitoreo"
                  type="text"
                  className="form-control"
                  value={newMonitoreo}
                  onChange={(e) => setNewMonitoreo(e.target.value)}
                  placeholder="Ingrese nuevo tipo de monitoreo"
                  required
                />
              </div>
            </ModalTemplate>
          )}

          {/* Filtros */}
          {roleData?.tipos_de_monitoreo?.read && (
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
                      placeholder="Buscar por tipo de monitoreo..."
                      name="tipoMonitoreo"
                      value={filters.tipoMonitoreo}
                      onChange={handleFilterChange}
                    />
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
          )}

          {/* Tabla */}
          {roleData?.tipos_de_monitoreo?.read && (
            <div className="settings-content">
              <div className="table-wrapper" style={{maxHeight: "60vh", overflowY: "auto"}}>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{width: "60px"}}>ID</th>
                        <th>Tipo de Monitoreo</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedMonitoreos().map((monitoreo, index) => (
                        <tr key={monitoreo._id}>
                          <td className="text-center fw-bold">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td>{monitoreo.tipoMonitoreo}</td>
                          <td className="text-end">
                            <div className="action-buttons">
                              {roleData?.tipos_de_monitoreo?.update && (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => {
                                    setCurrentMonitoreo(monitoreo);
                                    setEditingName(monitoreo.tipoMonitoreo);
                                    setShowModal("edit");
                                  }}>
                                  <i className="fas fa-edit"></i>
                                </button>
                              )}

                              {roleData?.tipos_de_monitoreo?.delete && (
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleDelete(monitoreo._id)}>
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredMonitoreos.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-4">
                        <p className="text-muted">
                          No se encontraron tipos de monitoreo que coincidan con los filtros.
                        </p>
                      </td>
                    </tr>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {roleData?.tipos_de_monitoreo?.read && filteredMonitoreos.length > 0 && (
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
      </div>
      {/* Edit Modal */}
      {showModal === "edit" && currentMonitoreo && (
        <ModalTemplate
          show
          title="Editar Monitoreo"
          onClose={() => {
            setShowModal(false);
            setCurrentMonitoreo(null);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveEdit();
          }}>
          <div className="mb-3">
            <label htmlFor="editMonitoreo" className="form-label">
              Tipo de Monitoreo
            </label>
            <input
              id="editMonitoreo"
              type="text"
              className="form-control"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              required
            />
          </div>
        </ModalTemplate>
      )}
      {/* Delete Modal */}
      {showDeleteModal && (
        <ModalTemplate
          show
          title="Confirmar Eliminación"
          onClose={handleCloseDeleteModal}
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirmDelete(idToDelete);
          }}>
          <p>¿Está seguro de que desea eliminar este tipo de monitoreo?</p>
        </ModalTemplate>
      )}
    </section>
  );
};

export default TiposMonitoreo;
