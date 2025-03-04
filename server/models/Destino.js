import mongoose from "mongoose";

const DestinoSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
    },
    {timestamps: true}
);

const Destino = mongoose.model("Destino", DestinoSchema);

export default Destino;
