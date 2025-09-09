import mongoose from "mongoose";

const eventTypeSchema = new mongoose.Schema({
    numericId: { type: Number, required: true },
    evento: { type: String, required: true },
    categoria: { type: String, required: true },
    calificacion: { type: Number, required: true }
}, { timestamps: true });

const EventType = mongoose.model("EventType", eventTypeSchema);
export default EventType;
