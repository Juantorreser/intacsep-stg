import React from "react";

const MonitoreoCard = ({id, tipoMonitoreo, onDelete}) => {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title text-center">{tipoMonitoreo}</h5>
        <div className="text-center mt-3">
          <button className="btn btn-danger" onClick={() => onDelete(id)}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonitoreoCard;
