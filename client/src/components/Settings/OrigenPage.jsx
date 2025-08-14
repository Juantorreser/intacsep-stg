import {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";

const OrigenPage = () => {
  const [origenes, setOrigenes] = useState([]);
  const [filteredOrigenes, setFilteredOrigenes] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({estado: "", municipio: "", nombre: ""});
  const [currentOrigen, setCurrentOrigen] = useState(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");
  const [modalType, setModalType] = useState(""); // 'create', 'edit'

  // Filter states
  const [filters, setFilters] = useState({
    nombre: "",
    estado: "",
    cliente: "",
  });

  const {user, verifyToken, setUser} = useAuth();
  const [roleData, setRoleData] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken(); // Ensure user is verified
        setUser(data);
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        window.location.href = "/login";
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
          setFilteredOrigenes(data);
        } else {
          console.error("Failed to fetch origenes:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching origenes:", e);
      }
    };

    fetchOrigenes();
  }, [baseUrl]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`${baseUrl}/clients`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        } else {
          console.error("Failed to fetch clients:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching clients:", e);
      }
    };

    fetchClients();
  }, [baseUrl]);

  // Filter origenes based on search criteria
  useEffect(() => {
    const filtered = origenes.filter((origen) => {
      const nombreMatch = origen.nombre.toLowerCase().includes(filters.nombre.toLowerCase());
      const estadoMatch = origen.estado.toLowerCase().includes(filters.estado.toLowerCase());
      const clienteMatch = origen.municipio.toLowerCase().includes(filters.cliente.toLowerCase());

      return nombreMatch && estadoMatch && clienteMatch;
    });
    setFilteredOrigenes(filtered);
  }, [origenes, filters]);

  const handleFilterChange = (e) => {
    const {name, value} = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      nombre: "",
      estado: "",
      cliente: "",
    });
  };

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
    <section id="origenPage">
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <div className="page-header">
            <h1 className="text-center fs-3 fw-semibold text-black">Catálogos - Orígenes</h1>

            {roleData?.origenes?.create && (
              <button type="button" className="new-btn" onClick={() => setModalType("create")}>
                <i className="fas fa-plus"></i>
              </button>
            )}
          </div>

          {/* Filtros */}
          {roleData?.origenes?.read && (
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
                      placeholder="Buscar por nombre..."
                      name="nombre"
                      value={filters.nombre}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="flex-fill">
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 bg-white shadow-sm"
                      placeholder="Buscar por estado..."
                      name="estado"
                      value={filters.estado}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="flex-fill">
                    <select
                      className="form-control form-control-sm border-0 bg-white shadow-sm"
                      name="cliente"
                      value={filters.cliente}
                      onChange={handleFilterChange}>
                      <option value="">Todos los clientes</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client.razon_social}>
                          {client.razon_social}
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
          {roleData?.origenes?.read && (
            <div className="mx-3 my-4">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Estado</th>
                      <th>Cliente</th>

                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrigenes.map((origen) => (
                      <tr key={origen._id}>
                        <td>{origen.nombre}</td>
                        <td>{origen.estado}</td>
                        <td>{origen.municipio}</td>

                        <td className="text-end">
                          {roleData?.origenes?.update && (
                            <button
                              className="btn btn-primary me-2"
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOrigenes.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">
                      No se encontraron orígenes que coincidan con los filtros.
                    </p>
                  </div>
                )}
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
                  Cliente
                </label>
                <select
                  id="municipio"
                  className="form-control"
                  value={formData.municipio}
                  onChange={handleChange}>
                  <option value="">Selecciona un cliente</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client.razon_social}>
                      {client.razon_social}
                    </option>
                  ))}
                </select>
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
                  Cliente
                </label>
                <select
                  id="municipio"
                  className="form-control"
                  value={formData.municipio}
                  onChange={handleChange}>
                  <option value="">Selecciona un cliente</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client.razon_social}>
                      {client.razon_social}
                    </option>
                  ))}
                </select>
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
