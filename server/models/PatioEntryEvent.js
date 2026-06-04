import mongoose from "mongoose";

const PatioEntryEventSchema = new mongoose.Schema(
  {
    plate: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    entry_datetime: {
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

PatioEntryEventSchema.index({ plate: 1 });
PatioEntryEventSchema.index({ entry_datetime: -1 });

const PatioEntryEvent = mongoose.model("PatioEntryEvent", PatioEntryEventSchema);
export default PatioEntryEvent;
