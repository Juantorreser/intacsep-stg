import React, {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";

const OrigenPage = () => {
  const [origenes, setOrigenes] = useState([]);
  const [newOrigen, setNewOrigen] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentOrigen, setCurrentOrigen] = useState(null);
  const [editingName, setEditingName] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");
  const [modalType, setModalType] = useState(""); // 'create', 'edit', ''

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
      //
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <div className="page-header">
            <h1 className="text-center fs-3 fw-semibold text-black">Catálogos - Origenes</h1>
            <button type="button" className="new-btn" onClick={() => setModalType("create")}>
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* Create New Origen Form */}
          {modalType === "create" && (
            <ModalTemplate
              show
              title="Crear Origen"
              onClose={() => setModalType("")}
              onSubmit={handleCreate}>
              <div className="mb-3">
                <label htmlFor="newOrigen" className="form-label">
                  Nombre del Origen
                </label>
                <input
                  id="newOrigen"
                  type="text"
                  className="form-control"
                  value={newOrigen}
                  onChange={(e) => setNewOrigen(e.target.value)}
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
                          className="btn btn-primary rounded me-2"
                          onClick={() => {
                            setCurrentOrigen(origen);
                            setEditingName(origen.name);
                            setModalType("edit");
                          }}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger rounded"
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
      {modalType === "edit" && currentOrigen && (
        <ModalTemplate
          show
          title="Editar Origen"
          onClose={() => {
            setModalType("");
            setCurrentOrigen(null);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveEdit();
          }}>
          <div className="mb-3">
            <label htmlFor="editOrigen" className="form-label">
              Nombre del Origen
            </label>
            <input
              id="editOrigen"
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
          <p>¿Está seguro de que desea eliminar este origen?</p>
        </ModalTemplate>
      )}
    </section>
  );
};

export default OrigenPage;
