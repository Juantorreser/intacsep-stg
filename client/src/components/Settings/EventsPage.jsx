import React, {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";
import {useNavigate} from "react-router-dom";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [formData, setFormData] = useState({evento: "", categoria: "", calificacion: ""});
  const [editEvent, setEditEvent] = useState(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");
  const [modalType, setModalType] = useState(""); // 'create', 'edit', ''

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Filter states
  const [filters, setFilters] = useState({
    evento: "",
    categoria: "",
    calificacion: "",
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
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${baseUrl}/event_types`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
          setFilteredEvents(data);
        } else {
          console.error("Failed to fetch events:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching events:", e);
      }
    };

    fetchEvents();
  }, [baseUrl]);

  // Filter events based on search criteria
  useEffect(() => {
    const filtered = events.filter((event) => {
      const eventoMatch = event.evento.toLowerCase().includes(filters.evento.toLowerCase());
      const categoriaMatch = event.categoria
        .toLowerCase()
        .includes(filters.categoria.toLowerCase());
      const calificacionMatch = event.calificacion.toString().includes(filters.calificacion);

      return eventoMatch && categoriaMatch && calificacionMatch;
    });
    setFilteredEvents(filtered);

    // Update pagination
    const totalFiltered = filtered.length;
    setTotalItems(totalFiltered);
    setTotalPages(Math.ceil(totalFiltered / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [events, filters, itemsPerPage]);

  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData((prev) => ({...prev, [id]: value}));
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
      evento: "",
      categoria: "",
      calificacion: "",
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
  const getPaginatedEvents = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEvents.slice(startIndex, endIndex);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.evento || !formData.categoria || !formData.calificacion) return;

    try {
      const response = await fetch(`${baseUrl}/event_types`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const created = await response.json();
        setEvents([...events, created]);
        setFormData({evento: "", categoria: "", calificacion: ""});
        setModalType("");
      } else {
        const err = await response.json();
        alert(`ERROR: ${err.message}`);
      }
    } catch (e) {
      console.error("Error creating event:", e);
    }
  };

  const handleEditClick = (event) => {
    setEditEvent(event);
    setFormData({
      evento: event.evento,
      categoria: event.categoria,
      calificacion: event.calificacion,
    });
    setModalType("edit");
  };

  const handleEditSave = async () => {
    if (!editEvent) return;

    try {
      const response = await fetch(`${baseUrl}/event_types/${editEvent._id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setEvents(events.map((e) => (e._id === updated._id ? updated : e)));
        setFormData({evento: "", categoria: "", calificacion: ""});
        setEditEvent(null);
        setModalType("");
      } else {
        console.error("Failed to update event:", response.statusText);
      }
    } catch (e) {
      console.error("Error updating event:", e);
    }
  };

  const handleDelete = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/event_types/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setEvents(events.filter((e) => e._id !== id));
        setShowDeleteModal(false);
      }
    } catch (e) {
      console.error("Error deleting event:", e);
    }
  };

  return (
    <section id="eventsPage" className="settings-page">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <h1>Catálogos - Eventos</h1>
            {roleData?.eventos?.create && (
              <button className="new-btn" onClick={() => setModalType("create")}>
                <i className="fas fa-plus"></i>
              </button>
            )}
          </div>

          {/* Filtros */}
          {roleData?.eventos?.read && (
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
                      placeholder="Buscar por evento..."
                      name="evento"
                      value={filters.evento}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="flex-fill">
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 bg-white shadow-sm"
                      placeholder="Buscar por categoría..."
                      name="categoria"
                      value={filters.categoria}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="flex-fill">
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 bg-white shadow-sm"
                      placeholder="Buscar por calificación..."
                      name="calificacion"
                      value={filters.calificacion}
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
          {roleData?.eventos?.read && (
            <div className="settings-content">
              <div className="table-wrapper" style={{maxHeight: "60vh", overflowY: "auto"}}>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{width: "60px"}}>ID</th>
                        <th>Evento</th>
                        <th>Categoría</th>
                        <th>Calificación</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedEvents().map((event, index) => (
                        <tr key={event._id}>
                          <td className="text-center fw-bold">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td>{event.evento}</td>
                          <td>{event.categoria}</td>
                          <td>{event.calificacion}</td>
                          <td className="text-end">
                            <div className="action-buttons">
                              {roleData?.eventos?.update && (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleEditClick(event)}>
                                  <i className="fa fa-edit"></i>
                                </button>
                              )}

                              {roleData?.eventos?.delete && (
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleDelete(event._id)}>
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredEvents.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            <p className="text-muted">
                              No se encontraron eventos que coincidan con los filtros.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {roleData?.eventos?.read && filteredEvents.length > 0 && (
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
              title="Crear Evento"
              onClose={() => setModalType("")}
              onSubmit={handleCreate}>
              <div className="mb-3">
                <label htmlFor="evento" className="form-label">
                  Evento
                </label>
                <input
                  id="evento"
                  className="form-control"
                  value={formData.evento}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="categoria" className="form-label">
                  Categoría
                </label>
                <input
                  id="categoria"
                  className="form-control"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="calificacion" className="form-label">
                  Calificación
                </label>
                <input
                  type="number"
                  min={0}
                  max={3}
                  id="calificacion"
                  className="form-control"
                  value={formData.calificacion}
                  onChange={handleChange}
                  required
                />
              </div>
            </ModalTemplate>
          )}

          {/* Modal: Editar */}
          {modalType === "edit" && editEvent && (
            <ModalTemplate
              show
              title="Editar Evento"
              onClose={() => {
                setModalType("");
                setEditEvent(null);
              }}
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave();
              }}>
              <div className="mb-3">
                <label htmlFor="evento" className="form-label">
                  Evento
                </label>
                <input
                  id="evento"
                  className="form-control"
                  value={formData.evento}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="categoria" className="form-label">
                  Categoría
                </label>
                <input
                  id="categoria"
                  className="form-control"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="calificacion" className="form-label">
                  Calificación
                </label>
                <input
                  type="number"
                  min={0}
                  max={3}
                  id="calificacion"
                  className="form-control"
                  value={formData.calificacion}
                  onChange={handleChange}
                  required
                />
              </div>
            </ModalTemplate>
          )}

          {/* Modal: Eliminar */}
          {showDeleteModal && (
            <ModalTemplate
              show
              title="Confirmar Eliminación"
              onClose={() => setShowDeleteModal(false)}
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmDelete(idToDelete);
              }}>
              <p>¿Está seguro de que desea eliminar este evento?</p>
            </ModalTemplate>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventsPage;
