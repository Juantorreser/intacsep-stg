import React, {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";

const OrigenPage = () => {
  const [origenes, setOrigenes] = useState([]);
  const [formData, setFormData] = useState({estado: "", municipio: "", nombre: ""});
  const [showModal, setShowModal] = useState(false);
  const [currentOrigen, setCurrentOrigen] = useState(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");
  const [modalType, setModalType] = useState(""); // 'create', 'edit'

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

  const handleDelete = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseUrl}/origenes`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const created = await response.json();
        setOrigenes([...origenes, created]);
        setFormData({estado: "", municipio: "", nombre: ""});
        setModalType("");
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
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const updated = await response.json();
        setOrigenes(origenes.map((o) => (o._id === updated._id ? updated : o)));
        setFormData({estado: "", municipio: "", nombre: ""});
        setCurrentOrigen(null);
        setModalType("");
      } else {
        console.error("Failed to edit origen:", response.statusText);
      }
    } catch (e) {
      console.error("Error editing origen:", e);
    }
  };

  const handleEdit = (origen) => {
    setCurrentOrigen(origen);
    setFormData({
      estado: origen.estado,
      municipio: origen.municipio,
      nombre: origen.nombre,
    });
    setModalType("edit");
  };

  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData((prev) => ({...prev, [id]: value}));
  };

  return (
    <section id="origenPage" className="settings-page">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <h1>Catálogos - Orígenes</h1>

            {roleData?.origenes?.create && (
              <button type="button" className="new-btn" onClick={() => setModalType("create")}>
                <i className="fas fa-plus"></i>
              </button>
            )}
          </div>

          {/* Tabla */}
          {roleData?.origenes?.read && (
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
                      {origenes.map((origen) => (
                        <tr key={origen._id}>
                          <td>{origen.nombre}</td>
                          <td>{origen.estado}</td>
                          <td>{origen.municipio}</td>
                          <td className="text-end">
                            <div className="action-buttons">
                              {roleData?.origenes?.update && (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleEdit(origen)}>
                                  <i className="fas fa-edit"></i>
                                </button>
                              )}

                              {roleData?.origenes?.delete && (
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleDelete(origen._id)}>
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
              title="Crear Origen"
              onClose={() => setModalType("")}
              onSubmit={handleCreate}>
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

          {/* Modal: Editar */}
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
        </div>
      </div>

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
          <p>¿Está seguro de que desea eliminar este origen?</p>
        </ModalTemplate>
      )}
    </section>
  );
};

export default OrigenPage;
