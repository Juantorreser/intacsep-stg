import React, {useEffect, useState} from "react";
import {useAuth} from "../../../context/AuthContext";
import {useParams} from "react-router-dom";
import {useWialon} from "../../../context/WialonProvider";

const NewEventModal = ({edited, eventTypes}) => {
  const [bitacora, setBitacora] = useState(null);
  const {id} = useParams();
  const {verifyToken, user, setUser} = useAuth();
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [selectedTransportes, setSelectedTransportes] = useState([]);
  const [transportes, setTransportes] = useState(bitacora?.transportes || []);
  // const [units, setUnits] = useState([]);
  const token = import.meta.env.VITE_WIALON_TOKEN;
  const {units} = useWialon();
  const [openTransportId, setOpenTransportId] = useState(null);

  const toggleCollapse = (id) => {
    setOpenTransportId(openTransportId === id ? null : id);
  };

  const [newEvent, setNewEvent] = useState({
    nombre: "",
    descripcion: "",
    frecuencia: 0,
    registrado_por: `${user?.firstName} ${user?.lastName}`,
    transportes: transportes,
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    const init = async () => {
      try {
        const data = await verifyToken(); // Ensure user is verified
        setUser(data);
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        navigate("/login");
        return; // Stop execution if token verification fails
      }

      // Fetch data or perform any other necessary actions here
    };

    fetchBitacora();
    init();
  }, [token]);

  const fetchBitacora = async () => {
    try {
      const response = await fetch(`${baseUrl}/bitacora/${id}`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();

        if (edited || edited.edited) {
          setBitacora(data.edited_bitacora);
          // setEditedBitacora(data.edited_bitacora);
          setTransportes(data.edited_bitacora.transportes);
          setSelectedTransportes(data.transportes);
        } else if (!edited && data.edited_bitacora) {
          setBitacora(data);
          // setEditedBitacora(data.edited_bitacora);
          setTransportes(data.transportes);
          setSelectedTransportes(data.transportes);
        } else {
          setBitacora(data);
          // setEditedBitacora(data);
          setTransportes(data.transportes);
          setSelectedTransportes(data.transportes);
        }
      } else {
        console.error("Failed to fetch bitácora:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching bitácora:", e);
    }
  };

  const getUnitInfo = async (transporteId) => {
    // Extraer el ID correcto: tomar la parte antes del '_'
    const formattedTransporteId = transporteId.includes("_")
      ? transporteId.split("_")[0]
      : transporteId;

    console.log("ID recibido:", transporteId);
    console.log("ID formateado:", formattedTransporteId);
    console.log(units);

    // Buscar si existe una unidad con el id igual al ID formateado
    const unidadEncontrada = units.find((unit) => unit.id == formattedTransporteId);

    if (unidadEncontrada) {
      const sess = window.wialon.core.Session.getInstance();
      const unit = sess.getItems("avl_unit").find((u) => u.getId() === unidadEncontrada.id);
      console.log(unit);

      if (unit) {
        //Obtener la posición de la unidad
        const pos = unit.getPosition();
        let ubicacion = "";
        const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
        const timeDiffInSeconds = pos ? currentTime - pos.t : 0;
        const duracion = formatDuration(timeDiffInSeconds); // Convertir a formato "20h ago"
        // Usar await para esperar la respuesta de la dirección
        try {
          const address = await getAddressFromCoordinates(pos.x, pos.y);
          ubicacion = Array.isArray(address) ? address.join(", ") : address;
        } catch (error) {
          console.error("Error al obtener la dirección:", error);
        }
        const velocidad = pos ? pos.s : ""; // Velocidad
        const coordenadas = pos ? `${pos.y}, ${pos.x}` : ""; // Coordenadas
        const ultimo_posicionamiento = pos ? window.wialon.util.DateTime.formatTime(pos.t) : ""; // Último mensaje

        setNewEvent((prev) => ({
          ...prev,
          transportes: transportes.map((transporte) =>
            transporte.id.split("_")[0] === unidadEncontrada?.id
              ? {
                  ...transporte,
                  registro: {
                    duracion: duracion || "N/A",
                    ubicacion: ubicacion || "N/A",
                    velocidad: velocidad || "N/A",
                    coordenadas: coordenadas || "N/A",
                    ultimo_posicionamiento: ultimo_posicionamiento || "N/A",
                  },
                }
              : {
                  ...transporte,
                  registro: transporte.registro || {
                    duracion: "N/A",
                    ubicacion: "N/A",
                    velocidad: "N/A",
                    coordenadas: "N/A",
                    ultimo_posicionamiento: "N/A",
                  },
                }
          ),
        }));
      }
    }
  };

  // Función para formatear el tiempo transcurrido en "X time ago"
  const formatDuration = (seconds) => {
    if (seconds < 60) return `Hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  // Función asincrónica para obtener la dirección a partir de las coordenadas
  const getAddressFromCoordinates = (longitude, latitude) => {
    return new Promise((resolve, reject) => {
      window.wialon.util.Gis.getLocations([{lon: longitude, lat: latitude}], (code, address) => {
        if (!code) {
          resolve(address); // Si se obtiene la dirección correctamente
        } else {
          reject("Dirección no encontrada");
        }
      });
    });
  };

  const handleCheckboxChange = (e) => {
    const {value, checked} = e.target;
    const transporteId = value;
    const transporteToAdd = bitacora.transportes.find(
      (transporte) => String(transporte.id) === transporteId
    );

    setSelectedTransportes((prev) => {
      let newSelection;

      if (value === "all") {
        newSelection = checked ? bitacora.transportes : [];
      } else {
        newSelection = checked
          ? [...prev, transporteToAdd]
          : prev.filter((transporte) => transporte.id !== transporteToAdd.id);
      }

      // Si solo un transporte está seleccionado, obtenemos su info
      if (newSelection.length === 1) {
        getUnitInfo(newSelection[0].id);
      }

      // Si no hay transportes seleccionados, limpiar campos
      if (newSelection.length === 0) {
        setNewEvent((prev) => ({
          ...prev,
          ubicacion: "",
          velocidad: "",
          coordenadas: "",
          ultimo_posicionamiento: "",
          duracion: "",
          nombre: "",
          descripcion: "",
          frecuencia: 0,
          registrado_por: `${user?.firstName} ${user?.lastName}`,
          transportes: [], // Asegurar que se borren los transportes
        }));
      }

      return newSelection;
    });
  };

  const handleChange = (e) => {
    const {name, value} = e.target;
    setNewEvent((prev) => ({...prev, [name]: value}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(newEvent);

    if (selectedTransportes.length === 0) {
      alert("Favor de seleccionar un transporte.");
      return;
    }

    const isValidacion = newEvent.nombre === "Validación";
    const isCierreDeServicio = newEvent.nombre === "Cierre de servicio";
    const currentDate = new Date().toISOString();

    // Solo actualizamos los transportes seleccionados
    const updatedTransportes = selectedTransportes.map((transporte) => ({
      ...transporte,
      inicioMonitoreo: isValidacion ? currentDate : transporte.inicioMonitoreo,
      finalMonitoreo: isCierreDeServicio ? currentDate : transporte.finalMonitoreo,
    }));

    console.log(updatedTransportes);

    try {
      const response = await fetch(`${baseUrl}/bitacora/${id}/event`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          nombre: newEvent.nombre,
          descripcion: newEvent.descripcion,
          ubicacion: newEvent.ubicacion,
          ultimo_posicionamiento: newEvent.ultimo_posicionamiento,
          velocidad: newEvent.velocidad,
          coordenadas: newEvent.coordenadas,
          duracion: newEvent.duracion,
          registrado_por: `${user.firstName} ${user.lastName}`,
          frecuencia: newEvent.frecuencia,
          transportes: updatedTransportes, // Aquí solo enviamos los seleccionados
        }),
        credentials: "include",
      });

      if (bitacora.status === "nueva") {
        try {
          const response = await fetch(`${baseUrl}/bitacora/${id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "validada",
              inicioMonitoreo: new Date().toISOString(), // Set the start time
            }),
            credentials: "include",
          });
          if (response.ok) {
            const updatedBitacora = await response.json();
            setBitacora(updatedBitacora);
            setIsEventStarted(true);
            setFinishButtonDisabled(false);
          } else {
            console.error("Failed to start bitácora:", response.statusText);
          }
        } catch (e) {
          console.error("Error starting bitácora:", e);
        }
      }

      if (bitacora.status === "validada" && newEvent.nombre === "Inicio de recorrido") {
        try {
          const response = await fetch(`${baseUrl}/bitacora/${id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "iniciada",
              inicioMonitoreo: new Date().toISOString(), // Set the start time
            }),
            credentials: "include",
          });
          if (response.ok) {
            const updatedBitacora = await response.json();
            setBitacora(updatedBitacora);
            setIsEventStarted(true);
            setFinishButtonDisabled(false);
          } else {
            console.error("Failed to start bitácora:", response.statusText);
          }
        } catch (e) {
          console.error("Error starting bitácora:", e);
        }
      }

      if (bitacora.status === "iniciada" && newEvent.nombre === "Cierre de servicio") {
        try {
          const response = await fetch(`${baseUrl}/bitacora/${id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "cerrada",
              inicioMonitoreo: new Date().toISOString(), // Set the start time
            }),
            credentials: "include",
          });
          if (response.ok) {
            const updatedBitacora = await response.json();
            setBitacora(updatedBitacora);
            setIsEventStarted(true);
            setFinishButtonDisabled(false);
          } else {
            console.error("Failed to start bitácora:", response.statusText);
          }
        } catch (e) {
          console.error("Error starting bitácora:", e);
        }
      }

      if (response.ok) {
        const updatedBitacora = await response.json();
        setBitacora(updatedBitacora);
        setNewEvent({
          nombre: "",
          descripcion: "",
          transportes: updatedBitacora.transportes,
          frecuencia: 0,
        });
      } else {
        console.error("Failed to add event:", response.statusText);
      }
    } catch (e) {
      console.error("Error adding event:", e);
    }
  };

  return (
    <div
      className="modal fade"
      id="eventModal"
      tabIndex="-1"
      aria-labelledby="eventModalLabel"
      aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="eventModalLabel">
              Añadir Evento
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="transportes" className="form-label">
                  Transportes
                </label>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="allTransportes"
                    name="transportes"
                    value="all"
                    onChange={handleCheckboxChange}
                    checked={
                      bitacora?.transportes &&
                      selectedTransportes.length === bitacora.transportes.length
                    }
                  />

                  <label className="form-check-label" htmlFor="allTransportes">
                    Todos
                  </label>
                </div>
                {bitacora?.transportes?.map((transporte) => {
                  const transporteId = transporte.id.includes("_")
                    ? transporte.id.split("_")[1] // Obtiene la parte después del '_'
                    : transporte.id; // Mantiene el ID original

                  return (
                    <div className="form-check" key={transporte.id}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`transporte-${transporte.id}`}
                        name="transportes"
                        value={transporte.id}
                        onChange={handleCheckboxChange}
                        checked={selectedTransportes.includes(transporte)}
                      />
                      <label className="form-check-label" htmlFor={`transporte-${transporte.id}`}>
                        {`${transporteId} - ${transporte.tracto.eco}`}
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="mb-3">
                <label htmlFor="nombre" className="form-label">
                  Tipo de Evento
                </label>
                <select
                  id="nombre"
                  name="nombre"
                  className="form-select"
                  value={newEvent.nombre}
                  onChange={handleChange}
                  required>
                  <option value="">Seleccionar tipo de evento</option>

                  {(() => {
                    // Filtrar eventos con nombre "Validación"
                    const eventosValidacion =
                      bitacora?.eventos.filter((evento) => evento.nombre === "Validación") || [];

                    // Filtrar eventos con nombre "Inicio de recorrido"
                    const eventosInicioRecorrido =
                      bitacora?.eventos.filter(
                        (evento) => evento.nombre === "Inicio de recorrido"
                      ) || [];

                    // Filtrar eventos con nombre "Arribo a destino"
                    const eventosArriboDestino =
                      bitacora?.eventos.filter((evento) => evento.nombre === "Arribo a destino") ||
                      [];

                    // Extraer IDs de transportes en eventos "Validación"
                    const transportesConValidacion = new Set(
                      eventosValidacion.flatMap((evento) => evento.transportes.map((t) => t.id))
                    );

                    // Extraer IDs de transportes en eventos "Inicio de recorrido"
                    const transportesConInicioRecorrido = new Set(
                      eventosInicioRecorrido.flatMap((evento) =>
                        evento.transportes.map((t) => t.id)
                      )
                    );

                    // Extraer IDs de transportes en eventos "Arribo a destino"
                    const transportesConArriboDestino = new Set(
                      eventosArriboDestino.flatMap((evento) => evento.transportes.map((t) => t.id))
                    );

                    // Verificar si TODOS los selectedTransportes están en eventos de "Validación"
                    const allSelectedTransportesInValidacion = selectedTransportes.every((t) =>
                      transportesConValidacion.has(t.id)
                    );

                    // Verificar si TODOS los selectedTransportes están en eventos de "Inicio de recorrido"
                    const allSelectedTransportesInInicioRecorrido = selectedTransportes.every((t) =>
                      transportesConInicioRecorrido.has(t.id)
                    );

                    // Verificar si TODOS los selectedTransportes están en eventos de "Arribo a destino"
                    const allSelectedTransportesInArriboDestino = selectedTransportes.every((t) =>
                      transportesConArriboDestino.has(t.id)
                    );

                    if (allSelectedTransportesInValidacion) {
                      if (allSelectedTransportesInInicioRecorrido) {
                        // Si todos los transportes están en "Validación" y "Inicio de recorrido"
                        return eventTypes
                          .filter(
                            (eventType) =>
                              allSelectedTransportesInArriboDestino ||
                              eventType.eventType !== "Cierre de servicio"
                          )
                          .map((eventType) => (
                            <option key={eventType._id} value={eventType.eventType}>
                              {eventType.eventType}
                            </option>
                          ));
                      } else {
                        // Si todos los transportes están en "Validación" pero no en "Inicio de recorrido", mostrar solo "Inicio de recorrido"
                        return <option value="Inicio de recorrido">Inicio de recorrido</option>;
                      }
                    }

                    // Si algún transporte no está en "Validación", solo permitir "Validación"
                    return <option value="Validación">Validación</option>;
                  })()}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="descripcion" className="form-label">
                  Descripcion
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  className="form-control"
                  value={newEvent.descripcion}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="frecuencia" className="form-label">
                  Frecuencia
                </label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="99"
                  id="frecuencia"
                  name="frecuencia"
                  value={newEvent.frecuencia}
                  onChange={handleChange}
                  required
                />
              </div>
              <hr />

              <div>
                {selectedTransportes.map((t) => (
                  <div key={t.id} className="border mb-2 rounded">
                    <div
                      className="d-flex justify-content-between align-items-center cursor-pointer border p-2 rounded"
                      onClick={() => toggleCollapse(t.id)}>
                      <div className="whitespace-nowrap">
                        GPS ID: {t.id.includes("_") ? t.id.split("_")[1] : t.id}
                      </div>

                      <div className="ml-auto flex items-center w-[25px]">
                        {openTransportId === t.id ? "-" : "+"}
                      </div>
                    </div>

                    {openTransportId === t.id && (
                      <div className="p-2 mt-2 border-t">
                        <p>
                          <strong>Duración:</strong>{" "}
                          {newEvent.transportes?.find((transporte) => transporte.id === t.id)
                            ?.registro?.duracion || "N/A"}
                        </p>

                        <p>
                          <strong>Ubicación:</strong>{" "}
                          {newEvent.transportes?.find((transporte) => transporte.id === t.id)
                            ?.registro?.ubicacion || "N/A"}
                        </p>

                        <p>
                          <strong>Velocidad:</strong>{" "}
                          {newEvent.transportes?.find((transporte) => transporte.id === t.id)
                            ?.registro?.velocidad || "N/A"}
                        </p>

                        <p>
                          <strong>Ultimo posicionamiento:</strong>{" "}
                          {newEvent.transportes?.find((transporte) => transporte.id === t.id)
                            ?.registro?.ultimo_posicionamiento || "N/A"}
                        </p>

                        <p>
                          <strong>Coordenadas:</strong>{" "}
                          {newEvent.transportes?.find((transporte) => transporte.id === t.id)
                            ?.registro?.coordenadas || "N/A"}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-end">
                <button type="button" className="btn btn-danger m-2" data-bs-dismiss="modal">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success" data-bs-dismiss="modal">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewEventModal;
