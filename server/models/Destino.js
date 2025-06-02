import mongoose from "mongoose";

const DestinoSchema = new mongoose.Schema({
    estado: { type: String, required: true },
    municipio: { type: String, required: true },
    nombre: { type: String, required: true }, // antes era `name`
}, { timestamps: true });

const Destino = mongoose.model("Destino", DestinoSchema);
export default Destino;
