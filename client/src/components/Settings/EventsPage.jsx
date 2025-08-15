import React, {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({evento: "", categoria: "", calificacion: ""});
  const [editEvent, setEditEvent] = useState(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");
  const [modalType, setModalType] = useState(""); // 'create', 'edit', ''
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
        } else {
          console.error("Failed to fetch events:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching events:", e);
      }
    };

    fetchEvents();
  }, [baseUrl]);

  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData((prev) => ({...prev, [id]: value}));
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

          {/* Tabla */}
          {roleData?.eventos?.read && (
            <div className="settings-content">
              <div className="table-wrapper">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Evento</th>
                        <th>Categoría</th>
                        <th>Calificación</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event._id}>
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
                    </tbody>
                  </table>
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
