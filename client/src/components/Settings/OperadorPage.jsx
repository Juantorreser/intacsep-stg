import React, {useState, useEffect} from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const OperadorPage = () => {
  const [operadores, setOperadores] = useState([]);
  const [newOperador, setNewOperador] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentOperador, setCurrentOperador] = useState(null);
  const [editingName, setEditingName] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");

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
        } else {
          console.error("Failed to fetch operadores:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching operadores:", e);
      }
    };

    fetchOperadores();
  }, [baseUrl]);

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

  const handleDelete = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newOperador) return;

    try {
      const response = await fetch(`${baseUrl}/operadores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({name: newOperador}),
        credentials: "include",
      });

      if (response.ok) {
        const createdOperador = await response.json();
        setOperadores([...operadores, createdOperador]);
        setNewOperador(""); // Clear the input field
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({name: editingName}),
        credentials: "include",
      });

      if (response.ok) {
        const updatedOperador = await response.json();
        setOperadores(
          operadores.map((operador) =>
            operador._id === updatedOperador._id ? updatedOperador : operador
          )
        );
        setShowModal(false);
        setCurrentOperador(null);
        setEditingName("");
      } else {
        console.error("Failed to update operador:", response.statusText);
      }
    } catch (e) {
      console.error("Error updating operador:", e);
    }
  };

  return (
    <section id="operadores">
      <Header />
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <h1 className="text-center fs-3 fw-semibold text-black">Operadores</h1>

          {/* Create New Operador Form */}
          <div className="mx-3 my-4">
            <form onSubmit={handleCreate} className="mb-4">
              <div className="form-group">
                <div className="input-group">
                  <input
                    type="text"
                    id="newOperador"
                    className="form-control rounded-2"
                    value={newOperador}
                    onChange={(e) => setNewOperador(e.target.value)}
                    placeholder="Ingrese nuevo operador"
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
                    <th>Nombre del Operador</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {operadores.map((operador) => (
                    <tr key={operador._id}>
                      <td>{operador.name}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-primary rounded-circle me-2"
                          onClick={() => {
                            setCurrentOperador(operador);
                            setEditingName(operador.name);
                            setShowModal(true);
                          }}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger rounded-circle"
                          onClick={() => handleDelete(operador._id)}>
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
          <Modal.Title>Editar Operador</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Operador</Form.Label>
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
        <Modal.Body>¿Está seguro de que desea eliminar este operador?</Modal.Body>
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

export default OperadorPage;
