import React, {useState, useEffect} from "react";
import ModalTemplate from "../ModalTemplate";

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

  // Helper function to format ID
  const formatID = (id) => {
    return id.toString().padStart(5, "0");
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center">
          <div className="col-md-6">
            <p className="card-text mb-3 fs-5">
              <strong>ID Cliente:</strong> {formatID(formData.ID_Cliente || "")}
            </p>

            <p className="card-text mb-0">
              <strong>Razón Social:</strong> {formData.razon_social || ""}
            </p>
            <p className="card-text mb-0">
              <strong>RFC:</strong> {formData.RFC || ""}
            </p>
            <p className="card-text mb-0">
              <strong>Calle:</strong> {formData.calle || ""}
            </p>
            <p className="card-text mb-0">
              <strong>Número Ext:</strong> {formData.num_ext || ""}
            </p>
            <p className="card-text mb-0">
              <strong>Número Int:</strong> {formData.num_int || ""}
            </p>
            <p className="card-text mb-0">
              <strong>Colonia:</strong> {formData.colonia || ""}
            </p>
            <p className="card-text mb-0">
              <strong>Alcaldía:</strong> {formData.alcaldia || ""}
            </p>
            <p className="card-text mb-0">
              <strong>Ciudad:</strong> {formData.ciudad || ""}
            </p>
            <p className="card-text mb-0">
              <strong>Código Postal:</strong> {formData.codigo_postal || ""}
            </p>
            <p className="card-text mb-0">
              <strong>Clave País:</strong> {formData.clave_pais || ""}
            </p>
          </div>
          <div className="col-md-6">
            <hr />
            <p className="card-text mb-0">
              <strong className="fs-5">Contacto</strong>
            </p>
            <hr />
            <p className="card-text mb-0">
              <strong>Nombre:</strong> {formData.contacto.nombres || "No disponible"}{" "}
              {formData.contacto.apellidos || "No disponible"}
            </p>
            <p className="card-text mb-0">
              <strong>Email:</strong> {formData.contacto.email || "No disponible"}
            </p>
            <p className="card-text mb-0">
              <strong>Teléfono:</strong> {formData.contacto.telefono || "No disponible"}
            </p>
            <p className="card-text mb-0">
              <strong>País:</strong> {formData.contacto.pais || "No disponible"}
            </p>
          </div>
          <div className="ms-auto">
            <button className="btn btn-primary me-2" onClick={handleEdit}>
              <i className="fa fa-pencil-alt"></i>
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <i className="fa fa-trash-alt"></i>
            </button>
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
