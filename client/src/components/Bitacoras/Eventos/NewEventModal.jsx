import React, {useEffect, useState} from "react";
import {useAuth} from "../../../context/AuthContext";
import {useParams} from "react-router-dom";
import {useWialon} from "../../../context/WialonProvider";

const NewEventModal = ({edited, eventTypes, onEventAdded}) => {
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
          // setSelectedTransportes(data.transportes);
        } else if (!edited && data.edited_bitacora) {
          setBitacora(data);
          // setEditedBitacora(data.edited_bitacora);
          setTransportes(data.transportes);
          // setSelectedTransportes(data.transportes);
        } else {
          setBitacora(data);
          // setEditedBitacora(data);
          setTransportes(data.transportes);
          // setSelectedTransportes(data.transportes);
        }
      } else {
        console.error("Failed to fetch bitácora:", response.statusText);
      }
    } catch (e) {
      console.error("Error fetching bitácora:", e);
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

  const getUnitInfo = async (transporteId) => {
    console.log(`Ejecutando getUnitInfo para transporte ID: ${transporteId}`);

    const formattedTransporteId = transporteId.includes("_")
      ? transporteId.split("_")[0]
      : transporteId;

    const unidadEncontrada = units.find((unit) => unit.id == formattedTransporteId);
    if (!unidadEncontrada) {
      console.error(`No se encontró unidad para ID: ${formattedTransporteId}`);
      return;
    }

    const sess = window.wialon.core.Session.getInstance();
    const unit = sess.getItems("avl_unit").find((u) => u.getId() === unidadEncontrada.id);

    if (!unit) {
      console.error(`No se encontró el objeto unit en Wialon para ID: ${unidadEncontrada.id}`);
      return;
    }

    const pos = unit.getPosition();
    if (!pos) {
      console.error(`No se encontró posición para unidad: ${unidadEncontrada.id}`);
      return;
    }

    console.log(`📡 Datos obtenidos de Wialon para ${unidadEncontrada.id}:`, pos);

    let ubicacion = "";
    try {
      const address = await getAddressFromCoordinates(pos.x, pos.y);
      ubicacion = Array.isArray(address) ? address.join(", ") : address;
    } catch (error) {
      console.error("Error al obtener la dirección:", error);
    }

    const duracion = formatDuration(Math.floor(Date.now() / 1000) - pos.t);
    const velocidad = pos.s;
    const coordenadas = `${pos.y}, ${pos.x}`;
    const ultimo_posicionamiento = window.wialon.util.DateTime.formatTime(pos.t);

    return {duracion, velocidad, coordenadas, ultimo_posicionamiento, ubicacion};
  };

  const handleCheckboxChange = async (e) => {
    const {value, checked} = e.target;
    const transporteId = value;

    console.log(transporteId);

    const transporteToAdd = bitacora.transportes.find(
      (transporte) => String(transporte.id) === transporteId
    );

    if (!transporteToAdd.registro) {
      transporteToAdd.registro = {};
    }

    const data = await getUnitInfo(transporteId);

    console.log(data);

    if (!transporteToAdd) return;

    if (data) {
      transporteToAdd.registro.ubicacion = data.ubicacion;
      transporteToAdd.registro.duracion = data.duracion;
      transporteToAdd.registro.ultimo_posicionamiento = data.ultimo_posicionamiento;
      transporteToAdd.registro.velocidad = data.velocidad;
      transporteToAdd.registro.coordenadas = data.coordenadas;
    } else {
      transporteToAdd.registro.ubicacion = "";
      transporteToAdd.registro.duracion = "";
      transporteToAdd.registro.ultimo_posicionamiento = "";
      transporteToAdd.registro.velocidad = "";
      transporteToAdd.registro.coordenadas = "";
    }

    let updatedTransportes = [...newEvent.transportes]; // Keep previous selections

    if (checked) {
      if (!updatedTransportes.some((t) => t.id === transporteToAdd.id)) {
        updatedTransportes.push(transporteToAdd);
      }
    } else {
      updatedTransportes = updatedTransportes.filter((t) => t.id !== transporteToAdd.id);
    }

    newEvent.transportes = updatedTransportes; // Update newEvent directly

    setNewEvent((prev) => ({
      ...prev,
      transportes: updatedTransportes,
    }));
  };

  const handleChange = (e) => {
    const {name, value} = e.target;
    setNewEvent((prev) => ({...prev, [name]: value}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newEvent.transportes?.length === 0) {
      alert("Favor de seleccionar un transporte.");
      return;
    }

    const isValidacion = newEvent.nombre?.toLowerCase() === "validación";
    const isCierreDeServicio = newEvent.nombre?.toLowerCase() === "cierre de servicio";
    const currentDate = new Date().toISOString();

    console.log(newEvent);

    const updatedTransportes = newEvent.transportes.map((transporte) => ({
      ...transporte,
      inicioMonitoreo: isValidacion ? currentDate : transporte.inicioMonitoreo,
      finalMonitoreo: isCierreDeServicio ? currentDate : transporte.finalMonitoreo,
    }));

    console.log(
      "🚀 Enviando datos al backend:",
      JSON.stringify(
        {
          nombre: newEvent.nombre,
          descripcion: newEvent.descripcion,
          registrado_por: `${user.firstName} ${user.lastName}`,
          frecuencia: newEvent.frecuencia,
          transportes: updatedTransportes,
        },
        null,
        2
      )
    );

    if (bitacora.status === "nueva" && newEvent.nombre === "Validación") {
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

    const eventosArriboDestino =
      bitacora?.eventos.filter((evento) => evento.nombre?.toLowerCase() === "arribo a destino") ||
      [];

    const transportesConArriboDestino = new Set(
      eventosArriboDestino.flatMap((evento) => evento.transportes.map((t) => t.id))
    );

    const allTransportesInArriboDestino = bitacora.transportes.every((t) =>
      transportesConArriboDestino.has(t.id)
    );

    // if (
    //   bitacora.status === "iniciada" &&
    //   newEvent.nombre === "CIERRE DE SERVICIO" &&
    //   allTransportesInArriboDestino
    // ) {
    //   try {
    //     const response = await fetch(`${baseUrl}/bitacora/${id}/status`, {
    //       method: "PATCH",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         status: "cerrada",
    //         inicioMonitoreo: new Date().toISOString(), // Set the start time
    //       }),
    //       credentials: "include",
    //     });
    //     if (response.ok) {
    //       const updatedBitacora = await response.json();
    //       setBitacora(updatedBitacora);
    //       setIsEventStarted(true);
    //       setFinishButtonDisabled(false);
    //     } else {
    //       console.error("Failed to start bitácora:", response.statusText);
    //     }
    //   } catch (e) {
    //     console.error("Error starting bitácora:", e);
    //   }
    // }

    try {
      const response = await fetch(`${baseUrl}/bitacora/${id}/event`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          nombre: newEvent.nombre,
          descripcion: newEvent.descripcion,
          registrado_por: `${user.firstName} ${user.lastName}`,
          frecuencia: newEvent.frecuencia,
          transportes: updatedTransportes,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Error en respuesta del servidor:", response.statusText);
        return;
      }

      const updatedBitacora = await response.json();
      console.log("✅ Evento guardado en la DB:", updatedBitacora);
      setBitacora(updatedBitacora);
      setNewEvent({
        nombre: "",
        descripcion: "",
        frecuencia: 0,
        registrado_por: `${user?.firstName} ${user?.lastName}`,
        transportes: [],
      });
      onEventAdded();
    } catch (e) {
      console.error("Error en handleSubmit:", e);
    }
  };

  let allSelectedTransportesInArriboDestino = false;

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

                {bitacora?.transportes
                  ?.filter((transporte) => {
                    const cierreEventos =
                      bitacora?.eventos?.filter(
                        (evento) => evento.nombre?.toLowerCase === "cierre de servicio"
                      ) || [];

                    const transportesEnCierre = new Set(
                      cierreEventos.flatMap((evento) => evento.transportes.map((t) => t.id))
                    );

                    return !transportesEnCierre.has(transporte.id);
                  })
                  .map((transporte) => {
                    const transporteId = transporte.id.includes("_")
                      ? `${transporte.id.split("_")[1]}`
                      : transporte.id;

                    return (
                      <div className="form-check" key={transporte.id}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`transporte-${transporte.id}`}
                          name="transportes"
                          value={transporte.id}
                          onChange={handleCheckboxChange}
                          checked={newEvent.transportes.includes(transporte)}
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

                  {newEvent.transportes.length == 0 ? (
                    <option value="">Seleccionar tipo de evento</option>
                  ) : (
                    (() => {
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
                        bitacora?.eventos.filter(
                          (evento) => evento.nombre === "Arribo a destino"
                        ) || [];

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
                        eventosArriboDestino.flatMap((evento) =>
                          evento.transportes.map((t) => t.id)
                        )
                      );

                      // Verificar si TODOS los selectedTransportes están en eventos de "Validación"
                      const allSelectedTransportesInValidacion = newEvent.transportes.every((t) =>
                        transportesConValidacion.has(t.id)
                      );

                      // Verificar si TODOS los selectedTransportes están en eventos de "Inicio de recorrido"
                      const allSelectedTransportesInInicioRecorrido = newEvent.transportes.every(
                        (t) => transportesConInicioRecorrido.has(t.id)
                      );

                      // Verificar si TODOS los selectedTransportes están en eventos de "Arribo a destino"
                      allSelectedTransportesInArriboDestino = newEvent.transportes.every((t) =>
                        transportesConArriboDestino.has(t.id)
                      );

                      if (allSelectedTransportesInValidacion) {
                        if (allSelectedTransportesInInicioRecorrido) {
                          // Si todos los transportes están en "Validación" y "Inicio de recorrido"
                          return eventTypes
                            .filter(
                              (eventType) =>
                                allSelectedTransportesInArriboDestino ||
                                eventType.eventType?.toLowerCase() !== "cierre de servicio"
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
                    })()
                  )}
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
                {newEvent.transportes?.map((t) => (
                  <div key={t.id} className="border mb-2 rounded">
                    <div
                      className="d-flex justify-content-between align-items-center cursor-pointer border p-2 rounded"
                      onClick={() => toggleCollapse(t.id)}>
                      <div className="whitespace-nowrap">
                        GPS ID:{" "}
                        {t.id.includes("_")
                          ? `${t.id.split("_")[1]} - ${t.id.split("_")[2]}`
                          : t.id}
                      </div>

                      <div className="ml-auto flex items-center w-[25px]">
                        {openTransportId == t.id ? "-" : "+"}
                      </div>
                    </div>

                    {openTransportId == t.id && (
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
