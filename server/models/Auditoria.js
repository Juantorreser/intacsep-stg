import mongoose from "mongoose";

const AuditoriaSchema = new mongoose.Schema({
    tipo: { type: String, required: true },
    bitacora_id: { type: String },
    email: { type: String },
    rol: {type:String},
    seccion: {type: String},
    campo: {type: String},
    ValOriginal: {type: String},
    ValNuevo: {type: String}
}, { timestamps: true })

const Auditoria = mongoose.model("Auditoria", AuditoriaSchema);
export default Auditoria;