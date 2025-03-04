import mongoose, {mongo} from "mongoose";

const RemolqueSchema = new mongoose.Schema(
    {
        destino: {type: String, required: true},
        origen: {type: String, required: true},
        monitoreo: {type: String, required: true},
        cliente: {type: String, required: true},
        id_enlace: {type: String, required: true},
        id_remolque: {type: String, required: true},
        id_tracto: {type: String, required: true},
        operador: {type: String, required: true},
        telefono: {type: String, required: true},
        inicioMonitoreo: {type: Date},
        finalMonitoreo: {type: Date},
    },
    {timestamps: true}
);

const Remolque = mongoose.model("Remolque", RemolqueSchema);
export default Remolque;
