import {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import {useAuth} from "../../context/AuthContext";
import ModalTemplate from "../ModalTemplate";
import {useSidebar} from "../../context/SidebarContext";
import {useNavigate} from "react-router-dom";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
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
  const {user, verifyToken, setUser} = useAuth();
  const [roleData, setRoleData] = useState(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const {isSidebarCollapsed} = useSidebar();
  const navigate = useNavigate();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Filter states
  const [filters, setFilters] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "",
  });

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
    const fetchUsers = async () => {
      console.log(user.role);

      try {
        const response = await fetch(`${baseUrl}/users`, {method: "GET", credentials: "include"});
        if (response.ok) {
          const data = await response.json();
          const currentUserRole = user.role;

          const filteredUsers =
            currentUserRole !== "Máster" ? data.filter((u) => u.role?.name !== "Máster") : data;

          // Normalize role to string name if it's an object
          const normalizedUsers = filteredUsers.map((u) => ({
            ...u,
            role: typeof u.role === "object" ? u.role.name : u.role,
          }));

          setUsers(normalizedUsers);
          setFilteredUsers(normalizedUsers);
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
  }, []);

  // Filter users based on search criteria
  useEffect(() => {
    const filtered = users.filter((user) => {
      const emailMatch = user.email.toLowerCase().includes(filters.email.toLowerCase());
      const firstNameMatch = user.firstName.toLowerCase().includes(filters.firstName.toLowerCase());
      const lastNameMatch = user.lastName.toLowerCase().includes(filters.lastName.toLowerCase());
      const roleMatch = user.role.toLowerCase().includes(filters.role.toLowerCase());

      return emailMatch && firstNameMatch && lastNameMatch && roleMatch;
    });
    setFilteredUsers(filtered);

    // Update pagination
    const totalFiltered = filtered.length;
    setTotalItems(totalFiltered);
    setTotalPages(Math.ceil(totalFiltered / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, filters, itemsPerPage]);

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

  const handleFilterChange = (e) => {
    const {name, value} = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      email: "",
      firstName: "",
      lastName: "",
      role: "",
    });
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (event) => {
    const newLimit = Number(event.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Get paginated data
  const getPaginatedUsers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
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

        // Normalize role back to string
        const normalizedUser = {
          ...updatedUser,
          role: typeof updatedUser.role === "object" ? updatedUser.role.name : updatedUser.role,
        };

        if (editingUserId) {
          setUsers(users.map((u) => (u._id === normalizedUser._id ? normalizedUser : u)));
        } else {
          setUsers([...users, normalizedUser]);
        }

        // Reset form state
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
    <section id="usersPage" className="settings-page">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <h1 className="fs-3 fw-semibold text-black text-center m-0">Sistema - Usuarios</h1>
            {roleData?.usuarios?.create && (
              <button className="new-btn" onClick={handleCreateNew}>
                <i className="fas fa-plus"></i>
              </button>
            )}
          </div>

          {/* Filtros */}
          {roleData?.usuarios?.read && (
            <div className="mx-3 mb-4">
              <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border-0 shadow-sm">
                <div className="d-flex align-items-center gap-2">
                  <i className="fas fa-filter text-muted"></i>
                  <span className="text-muted small fw-medium">Filtros</span>
                </div>

                <div className="flex-grow-1 d-flex gap-3">
                  <div className="flex-fill">
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 bg-white shadow-sm"
                      placeholder="Buscar por email..."
                      name="email"
                      value={filters.email}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="flex-fill">
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 bg-white shadow-sm"
                      placeholder="Buscar por nombre..."
                      name="firstName"
                      value={filters.firstName}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="flex-fill">
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 bg-white shadow-sm"
                      placeholder="Buscar por apellido..."
                      name="lastName"
                      value={filters.lastName}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="flex-fill">
                    <select
                      className="form-control form-control-sm border-0 bg-white shadow-sm"
                      name="role"
                      value={filters.role}
                      onChange={handleFilterChange}>
                      <option value="">Todos los roles</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary border-0"
                  onClick={clearFilters}
                  title="Limpiar filtros">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          )}

          {/* Tabla */}
          {roleData?.usuarios?.read && (
            <div className="settings-content">
              <div className="table-wrapper" style={{maxHeight: "60vh", overflowY: "auto"}}>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{width: "60px"}}>ID</th>
                        <th>Email</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Teléfono</th>
                        <th>Rol</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedUsers().map((user, index) => (
                        <tr key={user._id}>
                          <td className="text-center fw-bold">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td>{user.email}</td>
                          <td>{user.firstName}</td>
                          <td>{user.lastName}</td>
                          <td>{user.phone}</td>
                          <td>{user.role}</td>
                          <td className="text-end">
                            <div className="action-buttons">
                              {roleData?.usuarios?.update && (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleEdit(user)}>
                                  <i className="fas fa-edit"></i>
                                </button>
                              )}

                              {roleData?.usuarios?.delete && (
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleDelete(user._id)}>
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <p className="text-muted">
                          No se encontraron usuarios que coincidan con los filtros.
                        </p>
                      </td>
                    </tr>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {roleData?.usuarios?.read && filteredUsers.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-content">
                <div className="pagination-info">
                  <div className="items-per-page">
                    <label htmlFor="itemsPerPage" className="form-label">
                      Items por página:
                    </label>
                    <select
                      id="itemsPerPage"
                      className="form-select form-select-sm modern-select"
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="pagination-stats">
                  <span className="stats-text">{`${startItem}-${endItem} de ${totalItems}`}</span>
                </div>

                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}>
                    <i className="fa fa-chevron-left"></i>
                  </button>

                  <div className="page-numbers">
                    {Array.from({length: Math.min(3, totalPages)}).map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          className={`page-btn ${pageNum === currentPage ? "active" : ""}`}
                          onClick={() => handlePageChange(pageNum)}>
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 3 && (
                      <>
                        <span className="page-ellipsis">...</span>
                        <button
                          className={`page-btn ${totalPages === currentPage ? "active" : ""}`}
                          onClick={() => handlePageChange(totalPages)}>
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}>
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal with Backdrop */}
          {isModalVisible && (
            <ModalTemplate
              show={isModalVisible}
              title={editingUserId ? "Editar Usuario" : "Crear Nuevo Usuario"}
              onClose={closeModal}
              onSubmit={handleSubmit}>
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
                  Teléfono
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
            </ModalTemplate>
          )}
        </div>
      </div>
      {/* Delete Modal */}
      {showDeleteModal && (
        <ModalTemplate
          show={showDeleteModal}
          title="Confirmar Eliminación"
          onClose={handleCloseDeleteModal}
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirmDelete(idToDelete);
          }}>
          <p>¿Está seguro de que desea eliminar este usuario?</p>
        </ModalTemplate>
      )}
    </section>
  );
};

export default UsersPage;
