import React, {useState, useEffect} from "react";
import RoleCard from "./RoleCard"; // Adjust path as needed
import Header from "../Header";
import Sidebar from "../Sidebar";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

const RolePage = () => {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({
    name: "",
    bitacoras: {create: false, read: false, update: false, delete: false},
    eventos: {create: false, read: false, update: false, delete: false},
    clientes: {create: false, read: false, update: false, delete: false},
    usuarios: {create: false, read: false, update: false, delete: false},
    roles: {create: false, read: false, update: false, delete: false},
    origenes: {create: false, read: false, update: false, delete: false},
    destinos: {create: false, read: false, update: false, delete: false},
    operadores: {create: false, read: false, update: false, delete: false},
    tipos_de_monitoreo: {create: false, read: false, update: false, delete: false},
    inactividad: {create: false, read: false, update: false, delete: false},
    bitacora_abierta: {create: false, read: false, update: false, delete: false},
    bitacora_cerrada: {create: false, read: false, update: false, delete: false},
    bit_detalles: {create: false, read: false, update: false, delete: false},
    bit_eventos: {create: false, read: false, update: false, delete: false},
    bit_transportes: {create: false, read: false, update: false, delete: false},
    auditoria_bitacora: {create: false, read: false, update: false, delete: false},
  });

  const [editRole, setEditRole] = useState(null);
  const [editRoleData, setEditRoleData] = useState({
    name: "",
    bitacoras: {create: false, read: false, update: false, delete: false},
    eventos: {create: false, read: false, update: false, delete: false},
    clientes: {create: false, read: false, update: false, delete: false},
    usuarios: {create: false, read: false, update: false, delete: false},
    roles: {create: false, read: false, update: false, delete: false},
    origenes: {create: false, read: false, update: false, delete: false},
    destinos: {create: false, read: false, update: false, delete: false},
    operadores: {create: false, read: false, update: false, delete: false},
    tipos_de_monitoreo: {create: false, read: false, update: false, delete: false},
    inactividad: {create: false, read: false, update: false, delete: false},
    bitacora_abierta: {create: false, read: false, update: false, delete: false},
    bitacora_cerrada: {create: false, read: false, update: false, delete: false},
    bit_detalles: {create: false, read: false, update: false, delete: false},
    bit_eventos: {create: false, read: false, update: false, delete: false},
    bit_transportes: {create: false, read: false, update: false, delete: false},
    auditoria_bitacora: {create: false, read: false, update: false, delete: false},
  });

  const [showModal, setShowModal] = useState(false);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${baseUrl}/roles`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setRoles(data);
        } else {
          console.error("Failed to fetch roles:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching roles:", e);
      }
    };

    fetchRoles();
  }, [baseUrl]);

  // Handle role deletion
  const handleConfirmDelete = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/roles/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setRoles(roles.filter((role) => role._id !== id));
        setShowDeleteModal(false);
      } else {
        console.error("Failed to delete role:", response.statusText);
      }
    } catch (e) {
      console.error("Error deleting role:", e);
    }
  };

  const handleDelete = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  // Handle new role creation
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${baseUrl}/roles`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(newRole),
        credentials: "include",
      });

      if (response.ok) {
        const createdRole = await response.json();
        setRoles([...roles, createdRole]);

        // Reset state using proper nested permission object
        const resetPermissions = {};
        Object.keys(newRole).forEach((key) => {
          if (typeof newRole[key] === "object") {
            resetPermissions[key] = {create: false, read: false, update: false, delete: false};
          }
        });

        setNewRole({name: "", ...resetPermissions});
        setShowModal(false);
      } else {
        console.error("Failed to create role:", response.statusText);
      }
    } catch (e) {
      console.error("Error creating role:", e);
    }
  };

  // Handle role edit button click
  const handleEditClick = (role) => {
    setEditRole(role);
    setEditRoleData({...role});
  };

  // Handle role update
  const handleEditSave = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/roles/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(editRoleData),
        credentials: "include",
      });

      if (response.ok) {
        const updatedRole = await response.json();
        setRoles(roles.map((role) => (role._id === id ? updatedRole : role)));
        setEditRole(null);

        const resetPermissions = {};
        Object.keys(editRoleData).forEach((key) => {
          if (typeof editRoleData[key] === "object") {
            resetPermissions[key] = {create: false, read: false, update: false, delete: false};
          }
        });

        setEditRoleData({name: "", ...resetPermissions});
      } else {
        console.error("Failed to update role:", response.statusText);
      }
    } catch (e) {
      console.error("Error updating role:", e);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    const resetPermissions = {};
    Object.keys(editRoleData).forEach((key) => {
      if (typeof editRoleData[key] === "object") {
        resetPermissions[key] = {create: false, read: false, update: false, delete: false};
      }
    });

    setEditRole(null);
    setEditRoleData({name: "", ...resetPermissions});
  };

  // Handle form input changes
  const handleInputChange = (e, setter) => {
    const {name, type, checked, value} = e.target;
    setter((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <section id="rolePage">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <div className="page-header">
            <h1>Sistema - Roles</h1>
            <button className="new-btn" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* Role Cards */}
          <div className="mx-3 my-4">
            <div className="mb-3">
              <label htmlFor="roleSelect" className="form-label fw-bold">
                Seleccionar Rol
              </label>
              <select
                id="roleSelect"
                className="form-select"
                value={editRole?._id || ""}
                onChange={(e) => {
                  const selected = roles.find((r) => r._id === e.target.value);
                  setEditRole(selected || null);
                  setEditRoleData(JSON.parse(JSON.stringify(selected))); // deep clone to detach from state mutation
                }}>
                <option value="">-- Seleccione un rol --</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {editRole && (
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Permiso</th>
                      <th className="text-center">Crear</th>
                      <th className="text-center">Ver</th>
                      <th className="text-center">Editar</th>
                      <th className="text-center">Eliminar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(editRoleData)
                      .filter(
                        ([key, val]) => typeof val === "object" && val !== null && "create" in val
                      )
                      .map(([permissionKey, perms]) => (
                        <tr key={permissionKey}>
                          <td className="text-capitalize">{permissionKey.replace(/_/g, " ")}</td>
                          {["create", "read", "update", "delete"].map((action) => (
                            <td className="text-center" key={action}>
                              <input
                                type="checkbox"
                                checked={editRoleData[permissionKey][action]}
                                onChange={(e) =>
                                  setEditRoleData((prev) => ({
                                    ...prev,
                                    [permissionKey]: {
                                      ...prev[permissionKey],
                                      [action]: e.target.checked,
                                    },
                                  }))
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>

                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-secondary" onClick={handleCancelEdit}>
                    Cancelar
                  </button>
                  <button className="btn btn-success" onClick={() => handleEditSave(editRole._id)}>
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal for Creating New Role */}
      <div
        className={`modal fade ${showModal ? "show d-block" : ""}`}
        tabIndex="-1"
        style={{display: showModal ? "block" : "none"}}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Crear Rol</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="roleName" className="form-label">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="roleName"
                    name="name"
                    className="form-control"
                    value={newRole.name}
                    onChange={(e) => handleInputChange(e, setNewRole)}
                    placeholder="Nombre del rol"
                    required
                  />
                </div>
                {/* Permissions */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Permisos</label>
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Módulo</th>
                          <th className="text-center">Create</th>
                          <th className="text-center">Read</th>
                          <th className="text-center">Update</th>
                          <th className="text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(newRole)
                          .filter(
                            ([key, val]) =>
                              typeof val === "object" && val !== null && "create" in val
                          )
                          .map(([key, perms]) => (
                            <tr key={key}>
                              <td className="text-capitalize">{key.replace(/_/g, " ")}</td>
                              {["create", "read", "update", "delete"].map((action) => (
                                <td className="text-center" key={action}>
                                  <input
                                    type="checkbox"
                                    checked={newRole[key][action]}
                                    onChange={(e) =>
                                      setNewRole((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          [action]: e.target.checked,
                                        },
                                      }))
                                    }
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger px-2"
                  onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success px-4">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>¿Está seguro de que desea eliminar este rol?</Modal.Body>
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

export default RolePage;
