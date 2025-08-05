import React, {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";

const DestinoPage = () => {
  const [destinos, setDestinos] = useState([]);
  const [formData, setFormData] = useState({estado: "", municipio: "", nombre: ""});
  const [idToDelete, setIdToDelete] = useState("");
  const [currentDestino, setCurrentDestino] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'create' | 'edit'
  const baseUrl = import.meta.env.VITE_BASE_URL;

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

  const handleDelete = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseUrl}/destinos`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const created = await response.json();
        setDestinos([...destinos, created]);
        setFormData({estado: "", municipio: "", nombre: ""});
        setModalType("");
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
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const updated = await response.json();
        setDestinos(destinos.map((d) => (d._id === updated._id ? updated : d)));
        setFormData({estado: "", municipio: "", nombre: ""});
        setCurrentDestino(null);
        setModalType("");
      } else {
        console.error("Failed to update destino:", response.statusText);
      }
    } catch (e) {
      console.error("Error updating destino:", e);
    }
  };

  const handleEdit = (destino) => {
    setCurrentDestino(destino);
    setFormData({
      estado: destino.estado,
      municipio: destino.municipio,
      nombre: destino.nombre,
    });
    setModalType("edit");
  };

  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData((prev) => ({...prev, [id]: value}));
  };

  return (
    <section id="destinos" className="settings-page">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <h1>Catálogos - Destinos</h1>

            {roleData?.destinos?.create && (
              <button type="button" className="new-btn" onClick={() => setModalType("create")}>
                <i className="fas fa-plus"></i>
              </button>
            )}
          </div>

          {/* Tabla */}
          {roleData?.destinos?.read && (
            <div className="settings-content">
              <div className="table-wrapper">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Municipio</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {destinos.map((destino) => (
                        <tr key={destino._id}>
                          <td>{destino.nombre}</td>
                          <td>{destino.estado}</td>
                          <td>{destino.municipio}</td>
                          <td className="text-end">
                            <div className="action-buttons">
                              {roleData?.destinos?.update && (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleEdit(destino)}>
                                  <i className="fas fa-edit"></i>
                                </button>
                              )}

                              {roleData?.destinos?.delete && (
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleDelete(destino._id)}>
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
              title="Crear Destino"
              onClose={() => setModalType("")}
              onSubmit={handleCreate}>
              <div className="mb-3">
                <div className="mb-3">
                  <label htmlFor="nombre" className="form-label">
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    className="form-control"
                    value={formData.nombre}
                    onChange={handleChange}
                  />
                </div>
                <label htmlFor="estado" className="form-label">
                  Estado
                </label>
                <input
                  id="estado"
                  className="form-control"
                  value={formData.estado}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="municipio" className="form-label">
                  Municipio
                </label>
                <input
                  id="municipio"
                  className="form-control"
                  value={formData.municipio}
                  onChange={handleChange}
                />
              </div>
            </ModalTemplate>
          )}

          {/* Modal: Editar */}
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
                <label htmlFor="nombre" className="form-label">
                  Nombre
                </label>
                <input
                  id="nombre"
                  className="form-control"
                  value={formData.nombre}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="estado" className="form-label">
                  Estado
                </label>
                <input
                  id="estado"
                  className="form-control"
                  value={formData.estado}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="municipio" className="form-label">
                  Municipio
                </label>
                <input
                  id="municipio"
                  className="form-control"
                  value={formData.municipio}
                  onChange={handleChange}
                />
              </div>
            </ModalTemplate>
          )}

          {/* Modal: Eliminar */}
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
        </div>
      </div>
    </section>
  );
};

export default DestinoPage;
