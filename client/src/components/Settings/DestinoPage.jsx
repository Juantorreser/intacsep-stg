import React, {useState, useEffect} from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const DestinoPage = () => {
  const [destinos, setDestinos] = useState([]);
  const [newDestino, setNewDestino] = useState("");
  const [idToDelete, setIdToDelete] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentDestino, setCurrentDestino] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchDestinos = async () => {
      try {
        const response = await fetch(`${baseUrl}/destinos`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setDestinos(data);
        } else {
          console.error("Failed to fetch destinos:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching destinos:", e);
      }
    };

    fetchDestinos();
  }, [baseUrl]);

  const handleConfirmDelete = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/destinos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setDestinos(destinos.filter((destino) => destino._id !== id));
        setShowDeleteModal(false);
      } else {
        console.error("Failed to delete destino:", response.statusText);
      }
    } catch (e) {
      console.error("Error deleting destino:", e);
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

    if (!newDestino) return;

    try {
      const response = await fetch(`${baseUrl}/destinos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({name: newDestino}),
        credentials: "include",
      });

      if (response.ok) {
        const createdDestino = await response.json();
        setDestinos([...destinos, createdDestino]);
        setNewDestino(""); // Clear the input field
      } else {
        console.error("Failed to create destino:", response.statusText);
      }
    } catch (e) {
      console.error("Error creating destino:", e);
    }
  };

  const handleSaveEdit = async () => {
    if (!currentDestino) return;

    try {
      const response = await fetch(`${baseUrl}/destinos/${currentDestino._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({name: currentDestino.name}),
        credentials: "include",
      });

      if (response.ok) {
        setDestinos(
          destinos.map((destino) => (destino._id === currentDestino._id ? currentDestino : destino))
        );
        setShowModal(false);
        setCurrentDestino(null);
      } else {
        console.error("Failed to update destino:", response.statusText);
      }
    } catch (e) {
      console.error("Error updating destino:", e);
    }
  };

  const handleChange = (e) => {
    setCurrentDestino({...currentDestino, name: e.target.value});
  };

  return (
    <section id="destinos">
      <Header />
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <h1 className="text-center fs-3 fw-semibold text-black">Destinos</h1>

          {/* Create New Destino Form */}
          <div className="mx-3 my-4">
            <form onSubmit={handleCreate} className="mb-4">
              <div className="form-group">
                <div className="input-group">
                  <input
                    type="text"
                    id="newDestino"
                    className="form-control rounded-2"
                    value={newDestino}
                    onChange={(e) => setNewDestino(e.target.value)}
                    placeholder="Ingrese nuevo destino"
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
                    <th>Nombre del Destino</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {destinos.map((destino) => (
                    <tr key={destino._id}>
                      <td>{destino.name}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-primary rounded-circle me-2"
                          onClick={() => {
                            setCurrentDestino(destino);
                            setShowModal(true);
                          }}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger rounded-circle"
                          onClick={() => handleDelete(destino._id)}>
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
          <Modal.Title>Editar Destino</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Destino</Form.Label>
              <Form.Control
                type="text"
                value={currentDestino?.name || ""}
                onChange={handleChange}
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
        <Modal.Body>¿Está seguro de que desea eliminar este destino?</Modal.Body>
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

export default DestinoPage;
