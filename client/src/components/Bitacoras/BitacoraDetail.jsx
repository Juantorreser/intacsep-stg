import React from "react";
import {formatDate} from "../../utils/dateUtils"; // Ensure you have a utility to format dates
import {Container, Row, Col} from "react-bootstrap";

const BitacoraDetail = React.forwardRef(({bitacora, transporteId = ""}, ref) => {
  // Filter transportes based on transporteId
  const filteredTransportes = transporteId
    ? bitacora.transportes.filter((transporte) => transporte.id === transporteId)
    : bitacora.transportes;

  // If a transporteId is selected, filter events based on that transporte
  const filteredEventos = transporteId
    ? bitacora.eventos.filter((evento) =>
        evento.transportes.some((transporte) => transporte.id === transporteId)
      )
    : bitacora.eventos;

  return (
    <Container ref={ref} id="pdfBitacora">
      <Container className="my-4">
        <Container className="header">
          <Row className="flex-center">
            <img src="/intacespTextLogo.jpeg" alt="IntacsepLogo" />
          </Row>
          <Row>
            <h1>Bitácora de monitoreo {bitacora.id}</h1>
          </Row>
          <Row>
            <Col>
              <p>
                <strong>Inicio Monitoreo:</strong>{" "}
                {`${formatDate(bitacora.inicioMonitoreo)}, ${new Date(
                  bitacora.inicioMonitoreo
                ).toLocaleTimeString("es-MX", {
                  timeZone: "America/Mexico_City",
                })}`}
              </p>
            </Col>
            <Col>
              <p>
                <strong>Final Monitoreo:</strong>{" "}
                {`${formatDate(bitacora.finalMonitoreo)}, ${new Date(
                  bitacora.finalMonitoreo
                ).toLocaleTimeString("es-MX", {
                  timeZone: "America/Mexico_City",
                })}`}
              </p>
            </Col>
          </Row>
        </Container>

        <Container className="body">
          <Row>
            <div className="card-body">
              <div className="row ">
                {/* Column 1 */}
                <div className="col-md-6">
                  <h6 className="card-subtitle mb-2">
                    <strong>Folio Servicio:</strong> {bitacora.folio_servicio}
                  </h6>
                  <h6 className="card-subtitle mb-2">
                    <strong>No. Bitácora:</strong> {bitacora.bitacora_id}
                  </h6>
                  <h6 className="card-subtitle mb-2">
                    <strong>Cliente:</strong> {bitacora.cliente}
                  </h6>
                  <h6 className="card-subtitle mb-2">
                    <strong>Tipo Monitoreo:</strong> {bitacora.monitoreo}
                  </h6>

                  {/* <h6 className="card-subtitle mb-2">
                    <strong>Linea Transporte:</strong> {bitacora.linea_transporte}
                  </h6> */}
                </div>

                {/* Column 4 */}
                <div className="col-md-6">
                  <h6 className="card-subtitle mb-2">
                    <strong>Origen:</strong> {bitacora.origen}
                  </h6>
                  <h6 className="card-subtitle mb-2">
                    <strong>Destino:</strong> {bitacora.destino}
                  </h6>
                  {/* <h6 className="card-subtitle mb-2">
                    <strong>Operador:</strong> {bitacora.operador}
                  </h6>
                  <h6 className="card-subtitle mb-2">
                    <strong>Teléfono:</strong> {bitacora.telefono}
                  </h6> */}
                </div>
              </div>
            </div>
          </Row>
        </Container>
      </Container>

      <Container className="transportes">
        <Row className="justify-content-center w-100 text-center">
          <h2>Transportes</h2>
          <h6>
            {filteredTransportes.length > 1
              ? `${filteredTransportes.length} Transportes registrados`
              : filteredTransportes.length === 1
              ? `${filteredTransportes.length} Transporte registrado`
              : "No transportes registrados"}
          </h6>
        </Row>
        <Col className="mt-3">
          {filteredTransportes.map((transporte, index) => (
            <Row key={index}>
              <div className="card-body transportCard">
                <div className="d-flex flex-row title text-white fw-bolder fs-5">{`${
                  transporte.id.includes("_") ? transporte.id.split("_")[1] : transporte.id
                }`}</div>
                <Row>
                  <Col>
                    <p>
                      <strong>Inicio Monitoreo:</strong>{" "}
                      {`${formatDate(transporte.inicioMonitoreo)}, ${new Date(
                        transporte.inicioMonitoreo
                      ).toLocaleTimeString("es-MX", {
                        timeZone: "America/Mexico_City",
                      })}`}
                    </p>
                  </Col>
                  <Col>
                    <p>
                      <strong>Final Monitoreo:</strong>{" "}
                      {`${formatDate(transporte.finalMonitoreo)}, ${new Date(
                        transporte.finalMonitoreo
                      ).toLocaleTimeString("es-MX", {
                        timeZone: "America/Mexico_City",
                      })}`}
                    </p>
                  </Col>
                </Row>
                <div className="row px-4 py-3">
                  {/* Column 1 */}
                  <div className="col-md-6 text-center">
                    <h5 className="fw-bold">Tracto</h5>
                    <div className="row">
                      <div className="col-4">
                        <h6 className="card-subtitle mb-2">
                          <strong>Eco:</strong> {transporte.tracto.eco}
                        </h6>
                        <h6 className="card-subtitle mb-2">
                          <strong>placa:</strong> {transporte.tracto.placa}
                        </h6>
                      </div>
                      <div className="col-4">
                        <h6 className="card-subtitle mb-2">
                          <strong>Modelo:</strong> {transporte.tracto.modelo}
                        </h6>
                        <h6 className="card-subtitle mb-2">
                          <strong>Color:</strong> {transporte.tracto.color}
                        </h6>
                      </div>
                      <div className="col-4">
                        <h6 className="card-subtitle mb-2">
                          <strong>Marca:</strong> {transporte.tracto.marca}
                        </h6>
                        <h6 className="card-subtitle mb-2">
                          <strong>Tipo:</strong> {transporte.tracto.tipo}
                        </h6>
                      </div>
                    </div>
                  </div>
                  <div className=" col-md-1">
                    <div className="divider"></div>
                  </div>
                  {/* Column 4 */}
                  <div className="col-md-5 text-center">
                    <h5 className="fw-bold">Remolque</h5>
                    <div className="row">
                      <div className="col-4">
                        <h6 className="card-subtitle mb-2">
                          <strong>Eco:</strong> {transporte.remolque.eco}
                        </h6>
                        <h6 className="card-subtitle mb-2">
                          <strong>Placa:</strong> {transporte.remolque.placa}
                        </h6>
                      </div>
                      <div className="col-4">
                        <h6 className="card-subtitle mb-2">
                          <strong>Color:</strong> {transporte.remolque.color}
                        </h6>
                        <h6 className="card-subtitle mb-2">
                          <strong>Capacidad:</strong> {transporte.remolque.capacidad}
                        </h6>
                      </div>
                      <div className="col-4">
                        <h6 className="card-subtitle mb-2">
                          <strong>Sello:</strong> {transporte.remolque.sello}
                        </h6>
                      </div>
                    </div>
                  </div>
                  <div className="row text-center mt-2">
                    <div className="col-4">
                      <h6 className="card-subtitle mb-2">
                        <strong>Linea Transporte:</strong> {transporte.lineaTransporte}
                      </h6>
                    </div>
                    <div className="col-4">
                      <h6 className="card-subtitle mb-2">
                        <strong>Operador:</strong> {transporte.operador}
                      </h6>
                    </div>
                    <div className="col-4">
                      <h6 className="card-subtitle mb-2">
                        <strong>Telefono:</strong> {transporte.telefono}
                      </h6>
                    </div>
                  </div>
                </div>
              </div>
            </Row>
          ))}
        </Col>
      </Container>

      <Container className="eventos">
        <Row className="justify-content-center w-100 text-center">
          <h2>Eventos</h2>
          <h6>{`${filteredEventos.length} Eventos registrados`}</h6>
        </Row>
        <Col className="mt-3">
          {filteredEventos.map((evento, index) => (
            <Row md={12} key={index}>
              <Container className="mb-4 event-card">
                <Row>
                  <Col md={6} className="title">
                    <h3>{evento.nombre}</h3>
                    <p>
                      <strong>Descripción:</strong>
                    </p>
                    <p>{evento.descripcion}</p>
                    <p className="mt-4">
                      <strong>Registrado por: </strong> {evento.registrado_por}
                    </p>
                    <p className="mt-4">
                      <strong>Frecuencia: </strong> {`${evento.frecuencia} min`}
                    </p>
                  </Col>
                  <Col md={1} className="line">
                    <div className="circle"></div>
                    <div className="line"></div>
                  </Col>
                  <Col md={5} className="fields">
                    <p className="mt-4">
                      <strong>Ubicación: </strong> {evento.ubicacion}
                    </p>
                    <p className="mt-4">
                      <strong>Último Posicionamiento: </strong> {evento.ultimo_posicionamiento}
                    </p>
                    <p className="mt-4">
                      <strong>Velocidad: </strong> {evento.velocidad}
                    </p>
                    <p className="mt-4">
                      <strong>Coordenadas: </strong> {evento.coordenadas}
                    </p>
                    <p className="mt-4">
                      <strong>Fecha:</strong>{" "}
                      {new Date(evento.createdAt).toLocaleDateString("es-MX", {
                        timeZone: "America/Mexico_City",
                      })}
                    </p>
                    <p className="mt-4">
                      <strong>Hora:</strong>{" "}
                      {new Date(evento.createdAt).toLocaleTimeString("es-MX", {
                        timeZone: "America/Mexico_City",
                      })}
                    </p>
                  </Col>
                </Row>
              </Container>
            </Row>
          ))}
        </Col>
      </Container>
    </Container>
  );
});

export default BitacoraDetail;
