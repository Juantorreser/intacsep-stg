import React, {useState, useEffect} from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState("");
  const [editEvent, setEditEvent] = useState(null);
  const [editEventName, setEditEventName] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

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
      } else {
        console.error("Failed to create event:", response.statusText);
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
      <Header />
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <div className="d-flex justify-content-center align-items-center mb-4">
            <h1 className="fs-3 fw-semibold text-black m-0">Eventos</h1>
          </div>

          {/* Create New Event Form */}
          <div className="mx-3 my-4">
            <form onSubmit={handleCreate} className="mb-4">
              <div className="form-group">
                <div className="input-group">
                  <input
                    type="text"
                    id="newEvent"
                    className="form-control rounded-2"
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    placeholder="Ingrese nuevo evento"
                  />
                  <div className="input-group-append ms-2">
                    <button type="submit" className="btn btn-primary rounded-circle">
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

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
                          className="btn btn-primary rounded-circle"
                          onClick={() => handleEditClick(event)}>
                          <i className="fa fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger rounded-circle ms-2"
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
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>¿Está seguro de que desea eliminar este evento?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => handleConfirmDelete(idToDelete)}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Editar Evento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Evento</Form.Label>
              <Form.Control
                type="text"
                value={editEventName}
                onChange={(e) => setEditEventName(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleEditSave}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
};

export default EventsPage;
