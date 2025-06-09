import React, {useEffect, useState} from "react";
import axios from "axios";

const EventsPopup = ({bitacora, onClose}) => {
  const [eventTypes, setEventTypes] = useState([]);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const res = await axios.get(`${baseUrl}/event_types`, {withCredentials: true});
        setEventTypes(res.data);
      } catch (err) {
        console.error("Error fetching event types:", err);
      }
    };
    fetchEventTypes();
  }, []);

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

  const getCalificacionForEvent = (nombre) => {
    const found = eventTypes.find((et) => et.evento === nombre);
    return found?.calificacion ?? null;
  };

  const calculatePromedioCalificacion = () => {
    const calificaciones = bitacora.eventos
      ?.map((evt) => getCalificacionForEvent(evt.nombre))
      .filter((val) => typeof val === "number");

    if (!calificaciones.length) return "-";
    const sum = calificaciones.reduce((a, b) => a + b, 0);
    const avg = sum / calificaciones.length;
    return Math.round(avg);
  };

  const promedioCalificacion = calculatePromedioCalificacion();

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
          <div>
            <strong>Calificación Promedio:</strong> <span>{promedioCalificacion}</span>
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
              <th>Calificación</th>
            </tr>
          </thead>
          <tbody>
            {eventosOrdenados.map((evt, idx) => {
              const calificacion = getCalificacionForEvent(evt.nombre);
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
                  <td>{calificacion ?? "-"}</td>
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
