import React, {useState, useEffect} from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const TiposMonitoreo = () => {
  const [monitoreos, setMonitoreos] = useState([]);
  const [newMonitoreo, setNewMonitoreo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentMonitoreo, setCurrentMonitoreo] = useState(null);
  const [editingName, setEditingName] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");

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
        } else {
          console.error("Failed to fetch monitoreos:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching monitoreos:", e);
      }
    };

    fetchMonitoreos();
  }, []);

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
    <section id="pastBits">
      <Header />
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <h1 className="text-center fs-3 fw-semibold text-black">Tipos de Monitoreo</h1>

          {/* Create New Monitoreo Form */}
          <div className="mx-3 my-4">
            <form onSubmit={handleCreate} className="mb-4">
              <div className="form-group">
                <div className="input-group">
                  <input
                    type="text"
                    id="newMonitoreo"
                    className="form-control rounded-2"
                    value={newMonitoreo}
                    onChange={(e) => setNewMonitoreo(e.target.value)}
                    placeholder="Ingrese nuevo tipo de monitoreo"
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
                    <th>Tipo de Monitoreo</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoreos.map((monitoreo) => (
                    <tr key={monitoreo._id}>
                      <td>{monitoreo.tipoMonitoreo}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-primary rounded-circle me-2"
                          onClick={() => {
                            setCurrentMonitoreo(monitoreo);
                            setEditingName(monitoreo.tipoMonitoreo);
                            setShowModal(true);
                          }}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger rounded-circle"
                          onClick={() => handleDelete(monitoreo._id)}>
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
      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Monitoreo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de monitoreo</Form.Label>
              <Form.Control
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleSaveEdit}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>¿Está seguro de que desea eliminar este tipo de monitoreo?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => handleConfirmDelete(idToDelete)}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
};

export default TiposMonitoreo;
