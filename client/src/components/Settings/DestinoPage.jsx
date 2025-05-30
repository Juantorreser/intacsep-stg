import React, {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";

const DestinoPage = () => {
  const [destinos, setDestinos] = useState([]);
  const [newDestino, setNewDestino] = useState("");
  const [idToDelete, setIdToDelete] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentDestino, setCurrentDestino] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [modalType, setModalType] = useState(""); // 'create' | 'edit' | ''

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
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <div className="page-header">
            <h1>Catálogos - Destinos</h1>
            <button type="button" className="new-btn" onClick={() => setModalType("create")}>
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* Create New Destino Form */}
          {modalType === "create" && (
            <ModalTemplate
              show
              title="Crear Destino"
              onClose={() => setModalType("")}
              onSubmit={handleCreate}>
              <div className="mb-3">
                <label htmlFor="newDestino" className="form-label">
                  Nombre del Destino
                </label>
                <input
                  id="newDestino"
                  type="text"
                  className="form-control"
                  value={newDestino}
                  onChange={(e) => setNewDestino(e.target.value)}
                  placeholder="Ingrese nuevo destino"
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
                          className="btn btn-primary rounded me-2"
                          onClick={() => {
                            setCurrentDestino(destino);
                            setModalType("edit");
                          }}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger rounded"
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
      {modalType === "edit" && currentDestino && (
        <ModalTemplate
          show
          title="Editar Destino"
          onClose={() => {
            setModalType("");
            setCurrentDestino(null);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveEdit();
          }}>
          <div className="mb-3">
            <label htmlFor="editDestino" className="form-label">
              Nombre del Destino
            </label>
            <input
              id="editDestino"
              type="text"
              className="form-control"
              value={currentDestino.name}
              onChange={handleChange}
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
          <p>¿Está seguro de que desea eliminar este destino?</p>
        </ModalTemplate>
      )}
    </section>
  );
};

export default DestinoPage;
