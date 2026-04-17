import mongoose from "mongoose";

const OperadorSchema = new mongoose.Schema(
    {
        numericId: { type: Number, required: true },
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

OperadorSchema.index({ lineaTransporte: 1 });

const Operador = mongoose.model("Operador", OperadorSchema);

export default Operador;
