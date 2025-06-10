import React, {useEffect, useState} from "react";
import {useAuth} from "../../../context/AuthContext";
import {useParams} from "react-router-dom";
import ModalTemplate from "../../ModalTemplate";

const NewEventModal = ({show, onClose, edited, eventTypes, onEventAdded}) => {
  const [bitacora, setBitacora] = useState(null);
  const {id} = useParams();
  const {verifyToken, user, setUser} = useAuth();
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [selectedTransportes, setSelectedTransportes] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [units, setUnits] = useState();

  // const [units, setUnits] = useState([]);
  const token = import.meta.env.VITE_WIALON_TOKEN;
  // const {units} = useWialon();
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
    const init = async () => {
      try {
        const userData = await verifyToken();
        setUser(userData);
        await fetchBitacora(); // Only fetch after token is verified
      } catch (error) {
        console.error("Token verification or Bitacora fetch failed:", error);
        navigate("/login");
      }
    };

    if (token) init();
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

  const fetchAllUnits = async (retries = 3, delay = 1000, token) => {
    if (!token) {
      console.error("No Wialon token available. Please log in.");
      return;
    }

    const sess = window.wialon.core.Session.getInstance();
    sess.initSession("https://hst-api.wialon.com");

    console.log(sess);

    try {
      sess.loginToken(token, (code) => {
        if (code) {
          console.log("Error HERE");
        } else {
          console.log("Logged in successfully");
        }
      });

      console.log("Wialon login successful.");
      setSession(sess);
      localStorage.setItem("wialonToken", token); // Store token for persistence
      fetchAllUnits(sess);
    } catch (error) {
      console.error("Error during Wialon login:", error);
    }

    try {
      const flags =
        window.wialon.item.Item.dataFlag.base | window.wialon.item.Unit.dataFlag.lastMessage;

      sess.loadLibrary("itemIcon");

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject("Library load timeout"), 5000);
        sess.updateDataFlags([{type: "type", data: "avl_unit", flags, mode: 0}], (code) => {
          clearTimeout(timeout);
          if (code) {
            reject(window.wialon.core.Errors.getErrorText(code));
          } else {
            resolve();
          }
        });
      });

      const fetchedUnits = sess.getItems("avl_unit") || [];
      const unitDetails = fetchedUnits.map((unit) => ({id: unit.getId(), name: unit.getName()}));
      setUnits(unitDetails);
      console.log("Unidades obtenidas:", unitDetails);
    } catch (error) {
      console.error("Error al obtener unidades, reintentando...", error);
      if (retries > 0) {
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => fetchAllUnits(sess, retries - 1, delay), delay);
      } else {
        console.log("Max retries reached, failing...");
        setUnits([]);
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
  const getAddressFromCoordinates = (lon, lat) => {
    return new Promise((resolve, reject) => {
      if (!lon || !lat) return reject("Invalid coordinates");

      window.wialon.util.Gis.getLocations([{lon, lat}], (code, res) => {
        if (code === 0) resolve(res[0]);
        else reject("No se pudo obtener la dirección.");
      });
    });
  };

  const getUnitInfo = async (transporteId) => {
    await fetchAllUnits(3, 1500, token);

    if (!units || !units.length) {
      console.warn("⚠️ Units not loaded.");
      return null;
    }

    console.log("Units" + units);

    const formattedId = transporteId.split("_")[0];
    const found = units.find((u) => u.id == formattedId);

    if (!found) {
      console.warn(`❌ Unidad no encontrada para ID: ${formattedId}`);
      return null;
    }

    const sess = window.wialon.core.Session.getInstance();
    const unit = sess.getItems("avl_unit").find((u) => u.getId() === found.id);

    if (!unit || typeof unit.getPosition !== "function") {
      console.warn("⚠️ Unidad no disponible en sesión.");
      return null;
    }

    const pos = unit.getPosition();
    if (!pos) {
      console.warn("⚠️ Posición no encontrada.");
      return null;
    }

    let ubicacion = "";
    try {
      const address = await getAddressFromCoordinates(pos.x, pos.y);
      ubicacion = Array.isArray(address) ? address.join(", ") : address;
    } catch (e) {
      console.warn("⚠️ Dirección no encontrada:", e);
    }

    return {
      duracion: formatDuration(Math.floor(Date.now() / 1000) - pos.t),
      velocidad: pos.s,
      coordenadas: `${pos.y}, ${pos.x}`,
      ultimo_posicionamiento: window.wialon.util.DateTime.formatTime(pos.t),
      ubicacion,
    };
  };

  const handleCheckboxChange = async (e) => {
    const {value, checked} = e.target;
    const transporteId = value;

    const transporteToAdd = bitacora.transportes.find(
      (transporte) => String(transporte.id) === transporteId
    );

    if (!transporteToAdd) return;

    if (!transporteToAdd.registro) {
      transporteToAdd.registro = {};
    }

    const isManual = transporteId.split("_")[0] === "0";

    if (isManual) {
      // Manual transportes get static registro values
      transporteToAdd.registro.ubicacion = "";
      transporteToAdd.registro.duracion = "";
      transporteToAdd.registro.ultimo_posicionamiento = "";
      transporteToAdd.registro.velocidad = "";
      transporteToAdd.registro.coordenadas = "";
    } else {
      // Automatic GPS data fetch
      const data = await getUnitInfo(transporteId);
      console.log(data);

      if (!data) {
        console.log("⚠️ No se pudo obtener datos de GPS. Activando modo manual.");

        transporteToAdd.registro.ubicacion = "";
        transporteToAdd.registro.duracion = "";
        transporteToAdd.registro.ultimo_posicionamiento = "";
        transporteToAdd.registro.velocidad = "";
        transporteToAdd.registro.coordenadas = "";

        // Aún así, agregar el transporte a la lista
        let updatedTransportes = [...newEvent.transportes];
        if (!updatedTransportes.some((t) => t.id === transporteToAdd.id)) {
          updatedTransportes.push(transporteToAdd);
        }

        if (checked) {
          if (!updatedTransportes.some((t) => t.id === transporteToAdd.id)) {
            updatedTransportes.push(transporteToAdd);
          }
        } else {
          updatedTransportes = updatedTransportes.filter((t) => t.id !== transporteToAdd.id);
        }

        setNewEvent((prev) => ({
          ...prev,
          transportes: updatedTransportes,
        }));

        return; // Exit early since GPS data failed
      } else {
        transporteToAdd.registro.ubicacion = data.ubicacion;
        transporteToAdd.registro.duracion = data.duracion;
        transporteToAdd.registro.ultimo_posicionamiento = data.ultimo_posicionamiento;
        transporteToAdd.registro.velocidad = data.velocidad;
        transporteToAdd.registro.coordenadas = data.coordenadas;
      }
    }

    // Update transportes in newEvent
    let updatedTransportes = [...newEvent.transportes];

    if (checked) {
      if (!updatedTransportes.some((t) => t.id === transporteToAdd.id)) {
        updatedTransportes.push(transporteToAdd);
      }
    } else {
      updatedTransportes = updatedTransportes.filter((t) => t.id !== transporteToAdd.id);
    }

    setNewEvent((prev) => ({
      ...prev,
      transportes: updatedTransportes,
    }));
  };

  const handleChange = (e) => {
    const {name, value} = e.target;

    // Auto-set and disable frecuencia if event is Cierre de servicio
    if (name === "nombre" && value.toLowerCase() === "cierre de servicio") {
      setNewEvent((prev) => ({...prev, [name]: value, frecuencia: 0}));
    } else {
      setNewEvent((prev) => ({...prev, [name]: value}));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newEvent.transportes?.length === 0 || !newEvent.transportes) {
      alert("Favor de seleccionar un transporte.");
      return;
    }

    const isValidacion = newEvent.nombre.toLowerCase() === "validación";
    const isCierreDeServicio = newEvent.nombre.toLowerCase() === "cierre de servicio";
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
      bitacora?.eventos.filter((evento) => evento.nombre.toLowerCase() === "arribo a destino") ||
      [];

    const transportesConArriboDestino = new Set(
      eventosArriboDestino.flatMap((evento) => evento.transportes.map((t) => t.id))
    );

    const allTransportesInArriboDestino = bitacora.transportes.every((t) =>
      transportesConArriboDestino.has(t.id)
    );

    try {
      console.log(newEvent);

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

  const handleManualRegistroChange = (transporteId, field, value) => {
    setNewEvent((prev) => {
      const updatedTransportes = prev.transportes.map((t) => {
        if (t.id === transporteId) {
          return {
            ...t,
            registro: {
              ...t.registro,
              [field]: value,
            },
          };
        }
        return t;
      });

      return {
        ...prev,
        transportes: updatedTransportes,
      };
    });
  };

  let allSelectedTransportesInArriboDestino = false;

  return (
    <ModalTemplate show={show} onClose={onClose} onSubmit={handleSubmit} title="Crear Nuevo Evento">
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
                    (evento) => evento.nombre.toLowerCase() === "cierre de servicio"
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
                  <div
                    className={`transportes-checkbox ${
                      newEvent.transportes.some((t) => t.id === transporte.id) ? "checked" : ""
                    }`}
                    key={transporte.id}>
                    <input
                      type="checkbox"
                      className={`form-check-input ${
                        newEvent.transportes.some((t) => t.id === transporte.id)
                          ? "border-success"
                          : ""
                      }`}
                      id={`transporte-${transporte.id}`}
                      name="transportes"
                      value={transporte.id}
                      onChange={handleCheckboxChange}
                      checked={newEvent.transportes.some((t) => t.id === transporte.id)}
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
                    bitacora?.eventos.filter((evento) => evento.nombre === "Inicio de recorrido") ||
                    [];

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
                    eventosInicioRecorrido.flatMap((evento) => evento.transportes.map((t) => t.id))
                  );

                  // Extraer IDs de transportes en eventos "Arribo a destino"
                  const transportesConArriboDestino = new Set(
                    eventosArriboDestino.flatMap((evento) => evento.transportes.map((t) => t.id))
                  );

                  // Verificar si TODOS los selectedTransportes están en eventos de "Validación"
                  const allSelectedTransportesInValidacion = newEvent.transportes.every((t) =>
                    transportesConValidacion.has(t.id)
                  );

                  // Verificar si TODOS los selectedTransportes están en eventos de "Inicio de recorrido"
                  const allSelectedTransportesInInicioRecorrido = newEvent.transportes.every((t) =>
                    transportesConInicioRecorrido.has(t.id)
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
                            eventType.eventType.toLowerCase() !== "cierre de servicio"
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
              disabled={newEvent.nombre.toLowerCase() === "cierre de servicio"}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Fecha de registro</label>
            <input
              type="text"
              className="form-control"
              value={new Date().toLocaleString("es-MX", {hour12: false})}
              disabled
            />
          </div>

          <hr />

          <div>
            {newEvent.transportes?.map((t) => (
              <div key={t.id} className="border mb-2 rounded shadow-sm">
                <div
                  className="d-flex justify-content-between align-items-center p-2 bg-light border-bottom"
                  style={{cursor: "pointer"}}
                  onClick={() => toggleCollapse(t.id)}>
                  <div className="fw-bold">
                    {t.id.includes("_") ? `${t.id.split("_")[1]} - ${t.id.split("_")[2]}` : t.id}
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`badge ${t.id.startsWith("0_") ? "bg-secondary" : "bg-success"}`}>
                      {t.id.startsWith("0_") ? "Manual" : "GPS"}
                    </span>
                    <span className="ms-2 fs-5">{openTransportId === t.id ? "−" : "+"}</span>
                  </div>
                </div>

                {openTransportId === t.id && (
                  <div className="p-3">
                    {[
                      "duracion",
                      "ubicacion",
                      "velocidad",
                      "ultimo_posicionamiento",
                      "coordenadas",
                    ].map((field) => (
                      <div className="mb-3" key={field}>
                        <label className="form-label fw-bold text-capitalize">
                          {field.replace("_", " ")}{" "}
                          {t.id.startsWith("0_") && (
                            <span className="text-danger fw-normal ms-1">(Requerido)</span>
                          )}
                        </label>
                        <input
                          type="text"
                          className={`form-control ${t.id.startsWith("0_") ? "border-danger" : ""}`}
                          value={t.registro?.[field] || ""}
                          onChange={(e) => handleManualRegistroChange(t.id, field, e.target.value)}
                          required={t.id.startsWith("0_")}
                          placeholder={t.id.startsWith("0_") ? "Ingresa valor manualmente" : ""}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </form>
      </div>
    </ModalTemplate>
  );
};

export default NewEventModal;
