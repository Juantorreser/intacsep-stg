import React from "react";

const RoleCard = ({
  role,
  onEditClick,
  onDelete,
  editRole,
  editRoleData,
  onEditSave,
  onCancelEdit,
  setEditRoleData,
}) => {
  const handleInputChange = (e) => {
    const {name, type, checked, value} = e.target;
    setEditRoleData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCancelEdit = () => {
    onCancelEdit();
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div className="flex-grow-1">
            <h5 className="card-title">{role.name}</h5>
            <hr />
            <div className="d-flex flex-wrap">
              <div>
                <h6 className="font-weight-bold">Monitoreo</h6>
                {[
                  {name: "bitacoras", label: "Bitacoras"},
                  {
                    name: "edit_bitacora_abierta",
                    label: "Editar Bitacoras Abiertas",
                  },
                  {
                    name: "edit_bitacora_cerrada",
                    label: "Editar Bitacoras Cerradas",
                  },
                  {
                    name: "edit_eventos_a",
                    label: "Editar Eventos (Bitacora Abierta)",
                  },
                  {
                    name: "edit_eventos_c",
                    label: "Editar Eventos (Bitacora Cerrada)",
                  },
                  {
                    name: "edit_transportes_a",
                    label: "Editar Transportes (Bitacora Abierta)",
                  },
                  {
                    name: "edit_transportes_c",
                    label: "Editar Transportes (Bitacora Cerrada)",
                  },
                ].map(({name, label}) => (
                  <div key={name} className="form-check me-3">
                    <input
                      type="checkbox"
                      name={name}
                      className="form-check-input"
                      checked={
                        editRole && role._id === editRole._id ? editRoleData[name] : role[name]
                      }
                      onChange={handleInputChange}
                      disabled={editRole && role._id !== editRole._id}
                    />
                    <label className="form-check-label">{label}</label>
                  </div>
                ))}
              </div>
              <hr className="d-md-none w-100" />
              <div>
                <h6 className="font-weight-bold">Configuracion</h6>
                {[
                  {name: "tipos_de_monitoreo", label: "Tipos de Monitoreo"},
                  {name: "eventos", label: "Eventos"},
                  {name: "clientes", label: "Clientes"},

                  {name: "origenes", label: "Origenes"},
                  {name: "destinos", label: "Destinos"},
                  {name: "operadores", label: "Operadores"},
                  {name: "usuarios", label: "Usuarios"},
                  {name: "roles", label: "Roles"},
                  {name: "inactividad", label: "Inactividad"},
                ].map(({name, label}) => (
                  <div key={name} className="form-check me-3">
                    <input
                      type="checkbox"
                      name={name}
                      className="form-check-input"
                      checked={
                        editRole && role._id === editRole._id ? editRoleData[name] : role[name]
                      }
                      onChange={handleInputChange}
                      disabled={editRole && role._id !== editRole._id}
                    />
                    <label className="form-check-label">{label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="d-flex flex-column align-items-end">
            {!editRole || role._id !== editRole._id ? (
              <>
                <button
                  className="btn btn-primary rounded-circle mb-2"
                  onClick={() => onEditClick(role)}>
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  className="btn btn-danger rounded-circle"
                  onClick={() => onDelete(role._id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-success rounded-circle mb-2"
                  onClick={() => onEditSave(role._id)}>
                  <i className="fas fa-save"></i>
                </button>
                <button className="btn btn-secondary rounded-circle" onClick={handleCancelEdit}>
                  <i className="fas fa-times"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleCard;
