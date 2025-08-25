import mongoose from "mongoose";

const LineaTransporteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    cliente: { type: String, required: true }
}, { timestamps: true });

const LineaTransporte = mongoose.model("LineaTransporte", LineaTransporteSchema);
export default LineaTransporte;

