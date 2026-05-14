import mongoose from "mongoose";

const inboundMessageSchema = new mongoose.Schema(
  {
    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Integration",
    },
    inboundKey: { type: String, index: true },
    ident: { type: String, index: true },
    position: { type: mongoose.Schema.Types.Mixed },
    vehicleMappingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleMapping",
      default: null,
    },
    status: {
      type: String,
      enum: ["ok", "no_mapping", "error"],
      default: "ok",
    },
    errorMessage: { type: String },
    rawBody: { type: mongoose.Schema.Types.Mixed },

    // Wialon push pipeline state. "skipped" = no Wialon link; "pending" = ready to flush;
    // "pushed" = delivered; "failed" = exhausted retries (or last attempt failed before retry).
    wialonStatus: {
      type: String,
      enum: ["skipped", "pending", "pushed", "failed"],
      default: "skipped",
      index: true,
    },
    wialonAttempts: { type: Number, default: 0 },
    wialonError: { type: String },
    wialonPushedAt: { type: Date },
  },
  { timestamps: true }
);

// Composite index used by the flush worker to find pending messages per integration.
inboundMessageSchema.index({ integrationId: 1, wialonStatus: 1, createdAt: 1 });

const InboundMessage = mongoose.model("InboundMessage", inboundMessageSchema);
export default InboundMessage;
