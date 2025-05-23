import mongoose, { mongo } from "mongoose";

const permissionSchema = new mongoose.Schema({
  create: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
}, { _id: false });

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bitacoras: permissionSchema,
  eventos: permissionSchema,
  clientes: permissionSchema,
  usuarios: permissionSchema,
  roles: permissionSchema,
  origenes: permissionSchema,
  destinos: permissionSchema,
  operadores: permissionSchema,
  tipos_de_monitoreo: permissionSchema,
  inactividad: permissionSchema,
  bitacora_abierta: permissionSchema,
  bitacora_cerrada: permissionSchema,
  bit_detalles: permissionSchema,
  bit_transportes: permissionSchema,
  bit_eventos: permissionSchema,
  auditoria_bitacora: permissionSchema,

}, { timestamps: true });

export default mongoose.model("Role", RoleSchema);
