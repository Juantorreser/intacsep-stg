import mongoose from "mongoose";

const OperadorSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
        },
        lineaTransporte: {
            type: String,
            required: true,
        }
    },
    { timestamps: true }
);

const Operador = mongoose.model("Operador", OperadorSchema);

export default Operador;
