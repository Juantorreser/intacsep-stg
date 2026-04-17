import mongoose from "mongoose";

const LineaTransporteSchema = new mongoose.Schema({
    numericId: { type: Number, required: true },
    nombre: { type: String, required: true },
    cliente: { type: String, required: true }
}, { timestamps: true });

LineaTransporteSchema.index({ cliente: 1 });

const LineaTransporte = mongoose.model("LineaTransporte", LineaTransporteSchema);
export default LineaTransporte;


