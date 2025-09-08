import mongoose from "mongoose";

const DestinoSchema = new mongoose.Schema({
    estado: { type: String, required: true },
    cliente: { type: String, required: true },
    nombre: { type: String, required: true }, // antes era `name`
    numericId: { type: Number, required: true },
}, { timestamps: true });

const Destino = mongoose.model("Destino", DestinoSchema);
export default Destino;
