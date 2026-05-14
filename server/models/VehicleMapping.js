import mongoose from "mongoose";

const vehicleMappingSchema = new mongoose.Schema(
  {
    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Integration",
      required: true,
    },
    imei: { type: String, required: true },
    economico: { type: String, required: true },
    placa: { type: String, required: true },
    providerIdent: { type: String }, // External ID used by provider (e.g. Samsara vehicle ID)
    wialonUnitId: { type: String },
    wialonUniqueId: { type: String },
    status: {
      type: String,
      enum: ["pending", "receiving", "linkedToWialon", "error"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const VehicleMapping = mongoose.model("VehicleMapping", vehicleMappingSchema);
export default VehicleMapping;
