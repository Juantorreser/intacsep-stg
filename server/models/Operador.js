import mongoose from "mongoose";

const OperadorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
    },
    {timestamps: true}
);

const Operador = mongoose.model("Operador", OperadorSchema);

export default Operador;
