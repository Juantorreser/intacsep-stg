import React, {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState("");
  const [editEvent, setEditEvent] = useState(null);
  const [editEventName, setEditEventName] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalType, setModalType] = useState(""); // 'create', 'edit', or ''

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

  const handleConfirmDelete = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/event_types/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setEvents(events.filter((event) => event._id !== id));
        setShowDeleteModal(false);
      } else {
        console.error("Failed to delete event:", response.statusText);
      }
    } catch (e) {
      console.error("Error deleting event:", e);
    }
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
    if (!newEvent) return;

    try {
      const response = await fetch(`${baseUrl}/event_types`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({eventType: newEvent}),
        credentials: "include",
      });

      if (response.ok) {
        const createdEvent = await response.json();
        setEvents([...events, createdEvent]);
        setNewEvent("");
        setErrorMessage(""); // Clear any previous error messages
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message); // Set the error message from the response
        alert(`ERROR: El evento "${newEvent}" ya existe!`);
        setNewEvent("");
      }
    } catch (e) {
      console.error("Error creating event:", e);
    }
  };

  const handleEditClick = (event) => {
    setEditEvent(event);
    setEditEventName(event.eventType); // Ensure this matches the actual field in your event object
    setShowEditModal(true); // Show the edit modal
  };

  const handleEditSave = async () => {
    if (!editEvent || !editEventName) return;

    try {
      const response = await fetch(`${baseUrl}/event_types/${editEvent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({name: editEventName}), // Ensure this matches the schema field
        credentials: "include",
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(events.map((event) => (event._id === updatedEvent._id ? updatedEvent : event)));
        setShowEditModal(false);
        setEditEvent(null);
        setEditEventName("");
      } else {
        console.error("Failed to update event:", response.statusText);
      }
    } catch (e) {
      console.error("Error updating event:", e);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditEvent(null);
    setEditEventName("");
  };

  return (
    <section id="eventsPage">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <div className="page-header">
            <h1 className="fs-3 fw-semibold text-black m-0">Catálogos - Eventos</h1>
            <button type="button" className="new-btn" onClick={() => setModalType("create")}>
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* Create New Event Form */}
          {modalType === "create" && (
            <ModalTemplate
              show
              title="Crear Evento"
              onClose={() => setModalType("")}
              onSubmit={handleCreate}>
              <div className="mb-3">
                <label htmlFor="newEvent" className="form-label">
                  Nombre del Evento
                </label>
                <input
                  id="newEvent"
                  className="form-control"
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  placeholder="Ingrese nuevo evento"
                  required
                />
              </div>
            </ModalTemplate>
          )}

          {/* Responsive Table */}
          <div className="mx-3 my-4">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nombre del Evento</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event._id}>
                      <td>{event.eventType}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-primary rounded"
                          onClick={() => {
                            setEditEvent(event);
                            setEditEventName(event.eventType);
                            setModalType("edit");
                          }}>
                          <i className="fa fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger rounded ms-2"
                          onClick={() => handleDelete(event._id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
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
          <p>¿Está seguro de que desea eliminar este evento?</p>
        </ModalTemplate>
      )}

      {/* Edit Modal */}
      {modalType === "edit" && editEvent && (
        <ModalTemplate
          show
          title="Editar Evento"
          onClose={handleCloseEditModal}
          onSubmit={(e) => {
            e.preventDefault();
            handleEditSave();
          }}>
          <div className="mb-3">
            <label htmlFor="editEventName" className="form-label">
              Nombre del Evento
            </label>
            <input
              id="editEventName"
              className="form-control"
              value={editEventName}
              onChange={(e) => setEditEventName(e.target.value)}
              required
            />
          </div>
        </ModalTemplate>
      )}
    </section>
  );
};

export default EventsPage;
