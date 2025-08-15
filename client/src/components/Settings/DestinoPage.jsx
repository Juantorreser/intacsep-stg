import {useState, useEffect} from "react";
import Sidebar from "../Sidebar";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";

const DestinoPage = () => {
  const [destinos, setDestinos] = useState([]);
  const [filteredDestinos, setFilteredDestinos] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({estado: "", municipio: "", nombre: ""});
  const [idToDelete, setIdToDelete] = useState("");
  const [currentDestino, setCurrentDestino] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'create' | 'edit'
  const baseUrl = import.meta.env.VITE_BASE_URL;

  // Filter states
  const [filters, setFilters] = useState({
    nombre: "",
    estado: "",
    cliente: "",
  });

  // Mexican states array
  const estados = [
    {clave: "01", nombre: "Aguascalientes"},
    {clave: "02", nombre: "Baja California"},
    {clave: "03", nombre: "Baja California Sur"},
    {clave: "04", nombre: "Campeche"},
    {clave: "05", nombre: "Coahuila de Zaragoza"},
    {clave: "06", nombre: "Colima"},
    {clave: "07", nombre: "Chiapas"},
    {clave: "08", nombre: "Chihuahua"},
    {clave: "09", nombre: "Distrito Federal"},
    {clave: "10", nombre: "Durango"},
    {clave: "11", nombre: "Guanajuato"},
    {clave: "12", nombre: "Guerrero"},
    {clave: "13", nombre: "Hidalgo"},
    {clave: "14", nombre: "Jalisco"},
    {clave: "15", nombre: "México"},
    {clave: "16", nombre: "Michoacán de Ocampo"},
    {clave: "17", nombre: "Morelos"},
    {clave: "18", nombre: "Nayarit"},
    {clave: "19", nombre: "Nuevo León"},
    {clave: "20", nombre: "Oaxaca"},
    {clave: "21", nombre: "Puebla"},
    {clave: "22", nombre: "Querétaro"},
    {clave: "23", nombre: "Quintana Roo"},
    {clave: "24", nombre: "San Luis Potosí"},
    {clave: "25", nombre: "Sinaloa"},
    {clave: "26", nombre: "Sonora"},
    {clave: "27", nombre: "Tabasco"},
    {clave: "28", nombre: "Tamaulipas"},
    {clave: "29", nombre: "Tlaxcala"},
    {clave: "30", nombre: "Veracruz de Ignacio de la Llave"},
    {clave: "31", nombre: "Yucatán"},
    {clave: "32", nombre: "Zacatecas"},
  ];

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
    const fetchDestinos = async () => {
      try {
        const response = await fetch(`${baseUrl}/destinos`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setDestinos(data);
          setFilteredDestinos(data);
        } else {
          console.error("Failed to fetch destinos:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching destinos:", e);
      }
    };

    fetchDestinos();
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

  // Filter destinos based on search criteria
  useEffect(() => {
    const filtered = destinos.filter((destino) => {
      const nombreMatch = destino.nombre.toLowerCase().includes(filters.nombre.toLowerCase());
      const estadoMatch = destino.estado.toLowerCase().includes(filters.estado.toLowerCase());
      const clienteMatch = destino.municipio.toLowerCase().includes(filters.cliente.toLowerCase());

      return nombreMatch && estadoMatch && clienteMatch;
    });
    setFilteredDestinos(filtered);
  }, [destinos, filters]);

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

          {/* Filtros */}
          {roleData?.destinos?.read && (
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
                    <select
                      className="form-control form-control-sm border-0 bg-white shadow-sm"
                      placeholder="Buscar por estado..."
                      name="estado"
                      value={filters.estado}
                      onChange={handleFilterChange}>
                      <option value="">Todos los estados</option>
                      {estados.map((estado) => (
                        <option key={estado.clave} value={estado.nombre}>
                          {estado.nombre}
                        </option>
                      ))}
                    </select>
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
          {roleData?.destinos?.read && (
            <div className="settings-content">
              <div className="table-wrapper">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Cliente</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDestinos.map((destino) => (
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
                  {filteredDestinos.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted">
                        No se encontraron destinos que coincidan con los filtros.
                      </p>
                    </div>
                  )}
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
                <select
                  id="estado"
                  className="form-control"
                  value={formData.estado}
                  onChange={handleChange}>
                  <option value="">Selecciona un estado</option>
                  {estados.map((estado) => (
                    <option key={estado.clave} value={estado.nombre}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>
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
                <select
                  id="estado"
                  className="form-control"
                  value={formData.estado}
                  onChange={handleChange}>
                  <option value="">Selecciona un estado</option>
                  {estados.map((estado) => (
                    <option key={estado.clave} value={estado.nombre}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>
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
