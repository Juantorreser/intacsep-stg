import React, {useState, useEffect} from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Make sure to import Bootstrap CSS
import {Modal, Button} from "react-bootstrap";

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
      <Modal show={showModal} onHide={handleClose} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Editar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            {/* Client Info */}
            <div className="row">
              <div className="col-md-6">
                <p>Cliente</p>
                <hr />
                <div className="mb-3">
                  <label htmlFor="razon_social" className="form-label">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="razon_social"
                    value={formData.razon_social || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="RFC" className="form-label">
                    RFC
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="RFC"
                    value={formData.RFC || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="calle" className="form-label">
                    Calle
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="calle"
                    value={formData.calle || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="num_ext" className="form-label">
                    Número Ext
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="num_ext"
                    value={formData.num_ext || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="num_int" className="form-label">
                    Número Int
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="num_int"
                    value={formData.num_int || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="colonia" className="form-label">
                    Colonia
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="colonia"
                    value={formData.colonia || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="alcaldia" className="form-label">
                    Alcaldía
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="alcaldia"
                    value={formData.alcaldia || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="ciudad" className="form-label">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="ciudad"
                    value={formData.ciudad || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="codigo_postal" className="form-label">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="codigo_postal"
                    value={formData.codigo_postal || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="clave_pais" className="form-label">
                    Clave País
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="clave_pais"
                    value={formData.clave_pais || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              {/* Contact Info */}
              <div className="col-md-6">
                <p>Contacto</p>
                <hr />
                <div className="mb-3">
                  <label htmlFor="nombres" className="form-label">
                    Nombre
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="nombres"
                    value={formData.contacto.nombres || ""}
                    onChange={handleChangeContacto}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="apellidos" className="form-label">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="apellidos"
                    value={formData.contacto.apellidos || ""}
                    onChange={handleChangeContacto}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={formData.contacto.email || ""}
                    onChange={handleChangeContacto}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="telefono" className="form-label">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="telefono"
                    value={formData.contacto.telefono || ""}
                    onChange={handleChangeContacto}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="pais" className="form-label">
                    País
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="pais"
                    value={formData.contacto.pais || ""}
                    onChange={handleChangeContacto}
                    required
                  />
                </div>
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleConfirm}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>¿Está seguro de que desea eliminar este cliente?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClientCard;
