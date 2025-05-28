import React from "react";

const EventsPopup = ({bitacora, onClose}) => {
  const eventosOrdenados = [...(bitacora.eventos || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const getSemaforoColor = (evento) => {
    if (evento.nombre === "Cierre de servicio") return "black";
    if (evento.isFrecuenciaMet === true) return "#51FF4E";
    if (evento.isFrecuenciaMet === false) return "#F82929";

    const freqMs = evento.frecuencia * 60000;
    const elapsed = Date.now() - new Date(evento.createdAt).getTime();

    if (elapsed < freqMs * 0.75) return "#51FF4E";
    if (elapsed < freqMs) return "#ECEC27";
    return "#F82929";
  };

  const formatFecha = (date) => {
    return new Date(date).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getTransporteLabel = (transporte) => {
    if (!transporte) return "-";
    const tractoEco = transporte.tracto?.eco || "";
    const remolqueEco = transporte.remolque?.eco || "";
    return `${tractoEco} - ${remolqueEco}`.trim();
  };

  return (
    <div className="frecuencia-popup-backdrop" onClick={onClose}>
      <div className="frecuencia-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        <h3 className="text-center mb-3">Tracking de Monitoreo</h3>

        <div className="info-grid">
          <div>
            <strong>Folio Servicio:</strong> {bitacora.folio_servicio}
          </div>
          <div>
            <strong>Tipo Monitoreo:</strong> {bitacora.monitoreo}
          </div>
          <div>
            <strong>No. Bitácora:</strong> {bitacora.bitacora_id}
          </div>
          <div>
            <strong>Origen:</strong> {bitacora.origen}
          </div>
          <div>
            <strong>Cliente:</strong> {bitacora.cliente}
          </div>
          <div>
            <strong>Destino:</strong> {bitacora.destino}
          </div>
          <div>
            <strong>Estatus:</strong> {bitacora.status}
          </div>
        </div>

        <table className="eventos-table mt-3">
          <thead>
            <tr>
              <th>Semáforo</th>
              <th>Frecuencia</th>
              <th>Evento</th>
              <th>Transporte</th>
              <th>Fecha/Hora</th>
            </tr>
          </thead>
          <tbody>
            {eventosOrdenados.map((evt, idx) => {
              const transporte = evt.transportes?.[0]; // Usamos el primero
              return (
                <tr key={idx}>
                  <td>
                    <span
                      className="circle"
                      style={{
                        backgroundColor: getSemaforoColor(evt),
                      }}></span>
                  </td>
                  <td>{evt.frecuencia ? `${evt.frecuencia} min` : "-"}</td>
                  <td>{evt.nombre}</td>
                  <td>
                    {evt.transportes
                      ?.map((t) => {
                        const parts = t.id.split("_");
                        const label = parts.length >= 3 ? `${parts[1]} - ${parts[2]}` : t.id;
                        return label;
                      })
                      .join(" | ") || "-"}
                  </td>

                  <td>{formatFecha(evt.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventsPopup;
