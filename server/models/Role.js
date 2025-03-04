// models/Role.js
import mongoose, {mongo} from "mongoose";

const RoleSchema = new mongoose.Schema(
    {
        bitacoras: {
            type: Boolean,
            required: true,
            default: false,
        },
        edit_bitacora_abierta: {
            type: Boolean,
            required: true,
            default: false,
        },
        edit_bitacora_cerrada: {
            type: Boolean,
            required: true,
            default: false,
        },
        edit_eventos_a: {
            type: Boolean,
            required: true,
            default: false,
        },
        edit_eventos_c: {
            type: Boolean,
            required: true,
            default: false,
        },
        edit_transportes_a: {
            type: Boolean,
            required: true,
            default: false,
        },
        edit_transportes_c: {
            type: Boolean,
            required: true,
            default: false,
        },
        tipos_de_monitoreo: {
            type: Boolean,
            required: true,
            default: false,
        },
        eventos: {
            type: Boolean,
            required: true,
            default: false,
        },
        clientes: {
            type: Boolean,
            required: true,
            default: false,
        },
        usuarios: {
            type: Boolean,
            required: true,
            default: false,
        },
        roles: {
            type: Boolean,
            required: true,
            default: false,
        },
        inactividad: {
            type: Boolean,
            required: true,
            default: false,
        },
        origenes: {
            type: Boolean,
            required: true,
            default: false,
        },
        destinos: {
            type: Boolean,
            required: true,
            default: false,
        },
        operadores: {
            type: Boolean,
            required: true,
            default: false,
        },
        name: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Role = mongoose.model("Role", RoleSchema);
export default Role;
