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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Filter states
  const [filters, setFilters] = useState({
    nombre: "",
    estado: "",
    cliente: "",
  });

  // Mexican states array
  const estados = [
    {clave: "01", nombre: "AGUASCALIENTES"},
    {clave: "02", nombre: "BAJA CALIFORNIA"},
    {clave: "03", nombre: "BAJA CALIFORNIA SUR"},
    {clave: "04", nombre: "CAMPECHE"},
    {clave: "05", nombre: "CDMX"},
    {clave: "06", nombre: "COAHUILA DE ZARAGOZA"},
    {clave: "07", nombre: "COLIMA"},
    {clave: "08", nombre: "CHIAPAS"},
    {clave: "09", nombre: "CHIHUAHUA"},
    {clave: "10", nombre: "DURANGO"},
    {clave: "11", nombre: "EDO. MÉXICO"},
    {clave: "12", nombre: "GUANAJUATO"},
    {clave: "13", nombre: "GUERRERO"},
    {clave: "14", nombre: "HIDALGO"},
    {clave: "15", nombre: "JALISCO"},
    {clave: "16", nombre: "MICHOACÁN DE OCAMPO"},
    {clave: "17", nombre: "MORELOS"},
    {clave: "18", nombre: "NAYARIT"},
    {clave: "19", nombre: "NUEVO LEÓN"},
    {clave: "20", nombre: "OAXACA"},
    {clave: "21", nombre: "PUEBLA"},
    {clave: "22", nombre: "QUERÉTARO"},
    {clave: "23", nombre: "QUINTANA ROO"},
    {clave: "24", nombre: "SAN LUIS POTOSÍ"},
    {clave: "25", nombre: "SINALOA"},
    {clave: "26", nombre: "SONORA"},
    {clave: "27", nombre: "TABASCO"},
    {clave: "28", nombre: "TAMAULIPAS"},
    {clave: "29", nombre: "TLAXCALA"},
    {clave: "30", nombre: "VERACRUZ DE IGNACIO DE LA LLAVE"},
    {clave: "31", nombre: "YUCATÁN"},
    {clave: "32", nombre: "ZACATECAS"},
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
      const clienteMatch = destino.cliente.toLowerCase().includes(filters.cliente.toLowerCase());

      return nombreMatch && estadoMatch && clienteMatch;
    });
    setFilteredDestinos(filtered);

    // Update pagination
    const totalFiltered = filtered.length;
    setTotalItems(totalFiltered);
    setTotalPages(Math.ceil(totalFiltered / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [destinos, filters, itemsPerPage]);

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
  const getPaginatedDestinos = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDestinos.slice(startIndex, endIndex);
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
      municipio: destino.cliente,
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
            <>
            <div className="settings-content">
              <div className="table-wrapper" style={{maxHeight: "60vh", overflowY: "auto"}}>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{width: "60px"}}>ID</th>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Cliente</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedDestinos().map((destino) => (
                        <tr key={destino._id}>
                          <td className="text-center fw-bold">
                            {destino.numericId
                              ? destino.numericId.toString().padStart(4, "0")
                              : "N/A"}
                          </td>
                          <td>{destino.nombre}</td>
                          <td>{destino.estado}</td>
                          <td>{destino.cliente}</td>
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
                      {filteredDestinos.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            <p className="text-muted">
                              No se encontraron destinos que coincidan con los filtros.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

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
            </>
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
