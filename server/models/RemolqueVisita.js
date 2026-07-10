import mongoose from "mongoose";

const RemolqueVisitaSchema = new mongoose.Schema(
  {
    placa: { type: String, required: true, uppercase: true, trim: true },
    linea_transporte: { type: String, trim: true, default: null },
    cliente: { type: String, trim: true, default: null },
    fecha_hora_entrada: { type: Date, required: true, default: Date.now },
    fecha_hora_salida: { type: Date, default: null },
    status: { type: String, enum: ["En patio", "Finalizado"], default: "En patio" },
    tractor_entrada_id: { type: mongoose.Schema.Types.ObjectId, ref: "ControlPatios", default: null },
    tractor_entrada_placa: { type: String, uppercase: true, default: null },
    tractor_salida_id: { type: mongoose.Schema.Types.ObjectId, ref: "ControlPatios", default: null },
    tractor_salida_placa: { type: String, uppercase: true, default: null },
    hubo_cambio_tractor: { type: Boolean, default: null },
    stay_seconds: { type: Number, default: null },
  },
  { timestamps: true }
);

RemolqueVisitaSchema.index({ placa: 1 });
RemolqueVisitaSchema.index({ cliente: 1 });
RemolqueVisitaSchema.index({ fecha_hora_entrada: -1 });
RemolqueVisitaSchema.index({ status: 1 });

RemolqueVisitaSchema.pre("save", function (next) {
  if (this.fecha_hora_entrada && this.fecha_hora_salida) {
    this.status = "Finalizado";
    this.stay_seconds = Math.floor(
      (new Date(this.fecha_hora_salida) - new Date(this.fecha_hora_entrada)) / 1000
    );
    if (this.tractor_entrada_id && this.tractor_salida_id) {
      this.hubo_cambio_tractor =
        this.tractor_entrada_id.toString() !== this.tractor_salida_id.toString();
    }
  } else {
    this.status = "En patio";
  }
  next();
});

const RemolqueVisita = mongoose.model("RemolqueVisita", RemolqueVisitaSchema);
export default RemolqueVisita;
