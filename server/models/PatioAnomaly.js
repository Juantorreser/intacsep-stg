import mongoose from "mongoose";

const PatioAnomalySchema = new mongoose.Schema(
  {
    movement_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ControlPatios",
    },
    plate: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    anomaly_type: {
      type: String,
      required: true,
      enum: ["missing_entry", "missing_exit", "duplicate_plate", "unusual_duration"],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    description: {
      type: String,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

PatioAnomalySchema.index({ plate: 1 });
PatioAnomalySchema.index({ resolved: 1 });

const PatioAnomaly = mongoose.model("PatioAnomaly", PatioAnomalySchema);
export default PatioAnomaly;
