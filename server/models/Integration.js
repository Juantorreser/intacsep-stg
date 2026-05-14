import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["direct-samsara", "direct-api", "inbound-rest"], default: "inbound-rest" },
    provider: { type: String, required: true, enum: ["samsara", "generic-rest"] },
    apiKey: { type: String }, // For direct-samsara
    inboundKey: { type: String, unique: true }, // URL slug
    inboundToken: { type: String }, // Secret Bearer token
    wialonToken: { type: String },
    wialonCreatorId: { type: String },
    wialonHwTypeId: { type: String },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    webhookUrl: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

const Integration = mongoose.model("Integration", integrationSchema);
export default Integration;
