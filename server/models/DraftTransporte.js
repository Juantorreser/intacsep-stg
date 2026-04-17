import mongoose from "mongoose";

const DraftTransporteSchema = new mongoose.Schema(
  {
    bitacora_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bitacora", required: true },
    bitacora_num_id: { type: String, required: true },
    transporte_id: { type: String, required: true },
    cliente: { type: String, required: true },
    transporte: { type: String, default: null },
    lineaTransporte: { type: String, default: null },
    lineaTransporte_es_draft: { type: Boolean, default: false },
    operador: { type: String, default: null },
    operador_es_draft: { type: Boolean, default: false },
    telefono: { type: String, default: null },
    status: {
      type: String,
      enum: ["pendiente", "aceptado", "rechazado"],
      default: "pendiente",
    },
    creado_por: { type: String, required: true },
  },
  { timestamps: true }
);

const DraftTransporte = mongoose.model("DraftTransporte", DraftTransporteSchema);
export default DraftTransporte;
