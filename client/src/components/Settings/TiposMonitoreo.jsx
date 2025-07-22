import React, {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";

const TiposMonitoreo = () => {
  const [monitoreos, setMonitoreos] = useState([]);
  const [newMonitoreo, setNewMonitoreo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentMonitoreo, setCurrentMonitoreo] = useState(null);
  const [editingName, setEditingName] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");
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
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <h1 className="text-center fs-3 fw-semibold text-black">
              Catálogos - Tipos de Monitoreo
            </h1>

            {roleData?.tipos_de_monitoreo?.create && (
              <button type="button" className="new-btn" onClick={() => setShowModal("create")}>
                <i className="fas fa-plus"></i>
              </button>
            )}
          </div>

          {/* Create New Monitoreo Form */}
          {showModal === "create" && (
            <ModalTemplate
              show
              title="Crear Tipo de Monitoreo"
              onClose={() => setShowModal(false)}
              onSubmit={handleCreate}>
              <div className="mb-3">
                <label htmlFor="newMonitoreo" className="form-label">
                  Tipo de Monitoreo
                </label>
                <input
                  id="newMonitoreo"
                  type="text"
                  className="form-control"
                  value={newMonitoreo}
                  onChange={(e) => setNewMonitoreo(e.target.value)}
                  placeholder="Ingrese nuevo tipo de monitoreo"
                  required
                />
              </div>
            </ModalTemplate>
          )}

          {/* Responsive Table */}
          {roleData?.tipos_de_monitoreo?.read && (
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
                          {roleData?.tipos_de_monitoreo?.update && (
                            <button
                              className="btn btn-primary rounded me-2"
                              onClick={() => {
                                setCurrentMonitoreo(monitoreo);
                                setEditingName(monitoreo.tipoMonitoreo);
                                setShowModal("edit");
                              }}>
                              <i className="fas fa-edit"></i>
                            </button>
                          )}

                          {roleData?.tipos_de_monitoreo?.delete && (
                            <button
                              className="btn btn-danger rounded"
                              onClick={() => handleDelete(monitoreo._id)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Edit Modal */}
      {showModal === "edit" && currentMonitoreo && (
        <ModalTemplate
          show
          title="Editar Monitoreo"
          onClose={() => {
            setShowModal(false);
            setCurrentMonitoreo(null);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveEdit();
          }}>
          <div className="mb-3">
            <label htmlFor="editMonitoreo" className="form-label">
              Tipo de Monitoreo
            </label>
            <input
              id="editMonitoreo"
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
          <p>¿Está seguro de que desea eliminar este tipo de monitoreo?</p>
        </ModalTemplate>
      )}
    </section>
  );
};

export default TiposMonitoreo;
