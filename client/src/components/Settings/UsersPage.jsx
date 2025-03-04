import React, {useState, useEffect} from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import {useAuth} from "../../context/AuthContext";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    countryKey: "",
    role: "",
  });
  const [isModalVisible, setModalVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const {user} = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      console.log(user.role);

      try {
        const response = await fetch(`${baseUrl}/users`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          const currentUserRole = user.role;
          const filteredUsers =
            currentUserRole != "Máster" ? data.filter((user) => user.role != "Máster") : data;

          setUsers(filteredUsers);
        } else {
          console.error("Failed to fetch users:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching users:", e);
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await fetch(`${baseUrl}/roles`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          const currentUserRole = user.role;
          console.log(data);

          const filteredRoles =
            currentUserRole !== "Máster"
              ? data.filter((role) => role.name != "Máster" && role.name != "Owner")
              : data;

          setRoles(filteredRoles);
        } else {
          console.error("Failed to fetch roles:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching roles:", e);
      }
    };

    fetchUsers();
    fetchRoles();
  }, [baseUrl]);

  const handleConfirmDelete = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setUsers(users.filter((user) => user._id !== id));
        setShowDeleteModal(false);
      } else {
        console.error("Failed to delete user:", response.statusText);
      }
    } catch (e) {
      console.error("Error deleting user:", e);
    }
  };

  const handleDelete = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({
      ...user,
    });
    setModalVisible(true);
  };

  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingUserId ? "PUT" : "POST";
      const url = editingUserId ? `${baseUrl}/users/${editingUserId}` : `${baseUrl}/users`;

      const response = await fetch(url, {
        method,
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          countryKey: formData.countryKey,
          role: formData.role,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        if (editingUserId) {
          setUsers(users.map((user) => (user._id === updatedUser._id ? updatedUser : user)));
        } else {
          setUsers([...users, updatedUser]);
        }
        // Reset state
        setEditingUserId(null);
        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          countryKey: "",
          role: "",
        });
        setModalVisible(false);
      } else {
        const errorData = await response.json();
        console.error("Failed to save user:", errorData.message);
      }
    } catch (e) {
      console.error("Error saving user:", e);
    }
  };

  const handleCreateNew = () => {
    setEditingUserId(null);
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      countryKey: "",
      role: "",
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingUserId(null);
  };

  return (
    <section id="usersPage">
      <Header />
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>

        <div className="content-wrapper">
          <div className="position-relative mb-4">
            <h1 className="fs-3 fw-semibold text-black text-center m-0">Usuarios</h1>
            <button
              className="btn btn-primary rounded-5 position-absolute end-0 top-50 translate-middle-y me-3"
              onClick={handleCreateNew}>
              <i className="fas fa-plus"></i>
            </button>
          </div>

          <div className="mx-3 my-4">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Telefono</th>
                    <th>Rol</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.email}</td>
                      <td>{user.firstName}</td>
                      <td>{user.lastName}</td>
                      <td>{user.phone}</td>
                      <td>{user.role}</td>
                      <td className="text-end d-flex">
                        <button className="btn btn-primary me-2" onClick={() => handleEdit(user)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(user._id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal with Backdrop */}
          {isModalVisible && (
            <>
              <div
                className="modal fade show d-block"
                id="userModal"
                tabIndex="-1"
                aria-labelledby="userModalLabel"
                aria-hidden="true">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title" id="userModalLabel">
                        {editingUserId ? "Editar Usuario" : "Crear Nuevo Usuario"}
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={closeModal}
                        aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                      <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="mb-3">
                          <label htmlFor="email" className="form-label">
                            Email
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        {/* Password */}
                        <div className="mb-3">
                          <label htmlFor="password" className="form-label">
                            Contraseña
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={!editingUserId}
                          />
                        </div>

                        {/* First Name */}
                        <div className="mb-3">
                          <label htmlFor="firstName" className="form-label">
                            Nombre
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        {/* Last Name */}
                        <div className="mb-3">
                          <label htmlFor="lastName" className="form-label">
                            Apellido
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        {/* Phone */}
                        <div className="mb-3">
                          <label htmlFor="phone" className="form-label">
                            Telefono
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        {/* Country Key
                                                <div className="mb-3">
                                                    <label
                                                        htmlFor="countryKey"
                                                        className="form-label">
                                                        Clave del País
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="countryKey"
                                                        value={formData.countryKey}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div> */}

                        {/* Role */}
                        <div className="mb-3">
                          <label htmlFor="role" className="form-label">
                            Rol
                          </label>
                          <select
                            id="role"
                            className="form-select"
                            value={formData.role}
                            onChange={handleChange}
                            required>
                            <option value="">Seleccione un rol</option>
                            {roles.map((role) => (
                              <option key={role._id} value={role.name}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="modal-footer">
                          <button type="button" className="btn btn-danger px-" onClick={closeModal}>
                            Cancelar
                          </button>
                          <button type="submit" className="btn btn-success px-4">
                            {editingUserId ? "Guardar" : "Crear"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}
        </div>
      </div>
      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>¿Está seguro de que desea eliminar este usuario?</Modal.Body>
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

export default UsersPage;
