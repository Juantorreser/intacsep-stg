import React, {useState, useEffect} from "react";
import ModalTemplate from "../ModalTemplate";
import {useAuth} from "../../context/AuthContext";

const ClientCard = ({client, onDelete, fetchClients}) => {
  const [formData, setFormData] = useState({
    ...client,
    contacto: {
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      pais: "",
      ...client.contacto,
    },
  });

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const baseUrl = import.meta.env.VITE_BASE_URL;
  const {user, verifyToken, setUser} = useAuth();
  const [roleData, setRoleData] = useState(null);

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
    setFormData({
      ...client,
      contacto: {
        nombres: "",
        apellidos: "",
        email: "",
        telefono: "",
        pais: "",
        ...client.contacto,
      },
    });
  }, [client]);

  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleChangeContacto = (e) => {
    const {id, value} = e.target;
    setFormData((prevData) => ({
      ...prevData,
      contacto: {
        ...prevData.contacto,
        [id]: value,
      },
    }));
  };

  const handleEdit = () => {
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleConfirm = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/clients/${client._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        handleClose();
        await fetchClients();
      } else {
        console.error("Failed to update client:", response.statusText);
      }
    } catch (e) {
      console.error("Error updating client:", e);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/clients/${client._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setShowDeleteModal(false);
        await onDelete(client._id);
      } else {
        console.error("Failed to delete client:", response.statusText);
      }
    } catch (e) {
      console.error("Error deleting client:", e);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Helper function to format ID
  const formatID = (id) => {
    return id.toString().padStart(5, "0");
  };

  return (
    <div className={`client-card ${isExpanded ? "client-card--expanded" : ""}`}>
      <div className="client-card__header" onClick={toggleExpanded}>
        <div className="client-card__id">
          <span className="client-card__id-label">ID Cliente</span>
          <span className="client-card__id-value">{formatID(formData.ID_Cliente || "")}</span>
          {formData.razon_social && (
            <span className="client-card__company-name">{formData.razon_social}</span>
          )}
        </div>
        <div className="client-card__header-actions">
          <div className="client-card__expand-icon">
            <i className={`fa fa-chevron-${isExpanded ? "up" : "down"}`}></i>
          </div>
          <div className="client-card__actions">
            {roleData?.clientes?.update && (
              <button
                className="client-card__btn client-card__btn--edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}>
                <i className="fa fa-edit"></i>
              </button>
            )}
            {roleData?.clientes?.delete && (
              <button
                className="client-card__btn client-card__btn--delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}>
                <i className="fa fa-trash"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`client-card__content ${isExpanded ? "client-card__content--expanded" : ""}`}>
        <div className="client-card__section">
          <h3 className="client-card__section-title">Información General</h3>
          <div className="client-card__info-grid">
            <div className="client-card__info-item">
              <span className="client-card__label">Razón Social</span>
              <span className="client-card__value">{formData.razon_social || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">RFC</span>
              <span className="client-card__value">{formData.RFC || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">Calle</span>
              <span className="client-card__value">{formData.calle || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">Número Ext</span>
              <span className="client-card__value">{formData.num_ext || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">Número Int</span>
              <span className="client-card__value">{formData.num_int || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">Colonia</span>
              <span className="client-card__value">{formData.colonia || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">Alcaldía</span>
              <span className="client-card__value">{formData.alcaldia || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">Ciudad</span>
              <span className="client-card__value">{formData.ciudad || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">Código Postal</span>
              <span className="client-card__value">{formData.codigo_postal || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">Clave País</span>
              <span className="client-card__value">{formData.clave_pais || "—"}</span>
            </div>
          </div>
        </div>

        <div className="client-card__section">
          <h3 className="client-card__section-title">Contacto</h3>
          <div className="client-card__info-grid">
            <div className="client-card__info-item">
              <span className="client-card__label">Nombre</span>
              <span className="client-card__value">
                {formData.contacto.nombres || "—"} {formData.contacto.apellidos || ""}
              </span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">Email</span>
              <span className="client-card__value">{formData.contacto.email || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">Teléfono</span>
              <span className="client-card__value">{formData.contacto.telefono || "—"}</span>
            </div>
            <div className="client-card__info-item">
              <span className="client-card__label">País</span>
              <span className="client-card__value">{formData.contacto.pais || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Editing */}
      {showModal && (
        <ModalTemplate
          show
          title="Editar Cliente"
          onClose={handleClose}
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}>
          <div style={{maxHeight: "65vh", overflowY: "auto", paddingRight: "6px"}}>
            <form>
              <div className="row">
                <div className="col-md-6">
                  <p>Cliente</p>
                  <hr />
                  {[
                    "razon_social",
                    "RFC",
                    "calle",
                    "num_ext",
                    "num_int",
                    "colonia",
                    "alcaldia",
                    "ciudad",
                    "codigo_postal",
                    "clave_pais",
                  ].map((field) => (
                    <div className="mb-3" key={field}>
                      <label htmlFor={field} className="form-label">
                        {field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id={field}
                        value={formData[field] || ""}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  ))}
                </div>
                <div className="col-md-6">
                  <p>Contacto</p>
                  <hr />
                  {["nombres", "apellidos", "email", "telefono", "pais"].map((field) => (
                    <div className="mb-3" key={field}>
                      <label htmlFor={field} className="form-label">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <input
                        type={field === "email" ? "email" : "text"}
                        className="form-control"
                        id={field}
                        value={formData.contacto[field] || ""}
                        onChange={handleChangeContacto}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </ModalTemplate>
      )}

      {showDeleteModal && (
        <ModalTemplate
          show
          title="Confirmar Eliminación"
          onClose={handleCloseDeleteModal}
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirmDelete();
          }}>
          <p>¿Está seguro de que desea eliminar este cliente?</p>
        </ModalTemplate>
      )}
    </div>
  );
};

export default ClientCard;
