import mongoose from "mongoose";

const ControlPatiosSchema = new mongoose.Schema(
  {
    placa: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    linea_transporte: {
      type: String,
      required: true,
      trim: true,
    },
    fecha_hora_inicio: {
      type: Date,
      required: true,
      default: Date.now,
    },
    fecha_hora_salida: {
      type: Date,
      default: null,
    },
    cliente: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["En patio", "Finalizado"],
      default: "En patio",
    },
    usuario_registro: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      default: null,
    },
    image_preview: {
      type: String,
      default: null,
    },
    stay_seconds: {
      type: Number,
      default: null,
    },
    anomaly_flag: {
      type: Boolean,
      default: false,
    },
    movement_type: {
      type: String,
      enum: ["entry", "exit", "cycle"],
      default: "cycle",
    },
  },
  { timestamps: true }
);

ControlPatiosSchema.index({ placa: 1 });
ControlPatiosSchema.index({ cliente: 1 });
ControlPatiosSchema.index({ fecha_hora_inicio: -1 });

// Ensure status is consistent with timestamps
ControlPatiosSchema.pre("save", function (next) {
  if (this.fecha_hora_inicio && this.fecha_hora_salida) {
    this.status = "Finalizado";
  } else if (this.fecha_hora_inicio && !this.fecha_hora_salida) {
    this.status = "En patio";
  }
  next();
});

const ControlPatios = mongoose.model("ControlPatios", ControlPatiosSchema);
export default ControlPatios;
