import React, {useState, useEffect} from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const OrigenPage = () => {
  const [origenes, setOrigenes] = useState([]);
  const [newOrigen, setNewOrigen] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentOrigen, setCurrentOrigen] = useState(null);
  const [editingName, setEditingName] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");

  useEffect(() => {
    const fetchOrigenes = async () => {
      try {
        const response = await fetch(`${baseUrl}/origenes`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setOrigenes(data);
        } else {
          console.error("Failed to fetch origenes:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching origenes:", e);
      }
    };

    fetchOrigenes();
  }, [baseUrl]);

  const handleConfirmDelete = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/origenes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setOrigenes(origenes.filter((origen) => origen._id !== id));
        setShowDeleteModal(false);
      } else {
        console.error("Failed to delete origen:", response.statusText);
      }
    } catch (e) {
      console.error("Error deleting origen:", e);
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
    if (!newOrigen) return;

    try {
      const response = await fetch(`${baseUrl}/origenes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({name: newOrigen}),
        credentials: "include",
      });

      if (response.ok) {
        const createdOrigen = await response.json();
        setOrigenes([...origenes, createdOrigen]);
        setNewOrigen("");
      } else {
        console.error("Failed to create origen:", response.statusText);
      }
    } catch (e) {
      console.error("Error creating origen:", e);
    }
  };

  const handleSaveEdit = async () => {
    if (!currentOrigen) return;

    try {
      const response = await fetch(`${baseUrl}/origenes/${currentOrigen._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({name: editingName}),
        credentials: "include",
      });

      if (response.ok) {
        const updatedOrigen = await response.json();
        setOrigenes(
          origenes.map((origen) => (origen._id === updatedOrigen._id ? updatedOrigen : origen))
        );
        setShowModal(false);
        setCurrentOrigen(null);
        setEditingName("");
      } else {
        console.error("Failed to edit origen:", response.statusText);
      }
    } catch (e) {
      console.error("Error editing origen:", e);
    }
  };

  return (
    <section id="origenPage">
      <Header />
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <h1 className="text-center fs-3 fw-semibold text-black">Origenes</h1>

          {/* Create New Origen Form */}
          <div className="mx-3 my-4">
            <form onSubmit={handleCreate} className="mb-4">
              <div className="form-group">
                <div className="input-group">
                  <input
                    type="text"
                    id="newOrigen"
                    className="form-control rounded-2"
                    value={newOrigen}
                    onChange={(e) => setNewOrigen(e.target.value)}
                    placeholder="Ingrese nuevo origen"
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
                    <th>Origen</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {origenes.map((origen) => (
                    <tr key={origen._id}>
                      <td>{origen.name}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-primary rounded-circle me-2"
                          onClick={() => {
                            setCurrentOrigen(origen);
                            setEditingName(origen.name);
                            setShowModal(true);
                          }}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger rounded-circle"
                          onClick={() => handleDelete(origen._id)}>
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
          <Modal.Title>Editar Origen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Origen</Form.Label>
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
        <Modal.Body>¿Está seguro de que desea eliminar este origen?</Modal.Body>
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

export default OrigenPage;
