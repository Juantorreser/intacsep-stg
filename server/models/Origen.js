import mongoose from "mongoose";

const origenSchema = new mongoose.Schema({
    estado: { type: String, required: true },
    cliente: { type: String, required: true },
    nombre: { type: String, required: true }, // antes era `name`
    numericId: { type: Number, required: true },
}, { timestamps: true });

const Origen = mongoose.model("Origen", origenSchema);
export default Origen;
