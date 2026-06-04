import mongoose from "mongoose";

const PatioExitEventSchema = new mongoose.Schema(
  {
    plate: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    exit_datetime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    gate_id: {
      type: String,
      trim: true,
    },
    camera_id: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

PatioExitEventSchema.index({ plate: 1 });
PatioExitEventSchema.index({ exit_datetime: -1 });

const PatioExitEvent = mongoose.model("PatioExitEvent", PatioExitEventSchema);
export default PatioExitEvent;
