import mongoose from "mongoose";

const TransporteSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    remolque: {
      eco: String,
      placa: String,
      color: String,
      capacidad: String,
      sello: String,
    },
    tracto: {
      eco: String,
      placa: String,
      marca: String,
      modelo: String,
      color: String,
      tipo: String,
    },
    lineaTransporte: String,
    operador: String,
    telefono: String,
    inicioMonitoreo: { type: Date },
    finalMonitoreo: { type: Date },
    gpsUnits: [{
      wialonId: { type: String, required: true },
      name: { type: String },
      data: { type: Object } // Para almacenar datos en tiempo real de Wialon
    }],
    gpsData: [{
      wialonId: { type: String },
      name: { type: String },
      data: { type: Object } // Para almacenar datos de GPS en eventos
    }],
    registro: {
      ubicacion: { type: String, default: "" },
      ultimo_posicionamiento: { type: String, default: "" },
      duracion: { type: String, default: "" },
      velocidad: { type: String, default: "" },
      coordenadas: { type: String, default: "" },
    },
  },
  { timestamps: true } // Esto agregará automáticamente los campos `createdAt` y `updatedAt`
);

const EventoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    registrado_por: { type: String, default: "Nombre Usuario" },
    frecuencia: { type: Number, default: 0 },
    isFrecuenciaMet: { type: Boolean, default: null },
    transportes: [TransporteSchema],
  },
  { timestamps: true } // Esto agregará automáticamente los campos `createdAt` y `updatedAt`
);

const BitSchema = new mongoose.Schema(
  {
    bitacora_id: { type: String, required: true, unique: true },
    folio_servicio: { type: String, required: true },
    linea_transporte: { type: String, required: true },
    destino: { type: String, required: true },
    origen: { type: String, required: true },
    monitoreo: { type: String, required: true },
    cliente: { type: String, required: true },
    enlace: { type: String, required: true },
    id_acceso: { type: String, required: true },
    contra_acceso: { type: String, required: true },
    remolque: {
      eco: String,
      placa: String,
      color: String,
      capacidad: String,
      sello: String,
    },
    tracto: {
      eco: String,
      placa: String,
      marca: String,
      modelo: String,
      color: String,
      tipo: String,
    },
    custodia: {
      custodio1_nombre: { type: String },
      custodio1_telefono: { type: String },
      custodio2_nombre: { type: String },
      custodio2_telefono: { type: String },
      placa: { type: String },
      modelo: { type: String },
      color: { type: String },
      marca: { type: String },
    },
    operador: { type: String, required: true },
    telefono: { type: String, required: true },
    inicioMonitoreo: { type: Date },
    finalMonitoreo: { type: Date },
    status: { type: String, default: "creada", required: true },
    transportes: [TransporteSchema],
    eventos: [EventoSchema],
    edited: { type: Boolean, required: true, default: false },
    edited_bitacora: Object, // Reference to Bitacora model
    deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
    deleted_by: { type: String }
  },
  { timestamps: true }
);

const Bitacora = mongoose.model("Bitacora", BitSchema);
export default Bitacora;
