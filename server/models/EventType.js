import mongoose from "mongoose";

const eventTypeSchema = new mongoose.Schema({
    evento: { type: String, required: true },
    categoria: { type: String, required: true },
    calificacion: { type: String, required: true }
}, { timestamps: true });

const EventType = mongoose.model("EventType", eventTypeSchema);
export default EventType;
