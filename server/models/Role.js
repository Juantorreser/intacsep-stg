import mongoose, { mongo } from "mongoose";

const permissionSchema = new mongoose.Schema({
  create: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  read_all: { type: Boolean, default: false },
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
  gps_id: permissionSchema,
  remolque: permissionSchema,
  tracto: permissionSchema,
  operador: permissionSchema,
  auditoria_bitacora: permissionSchema,
  dashboard: permissionSchema,

  ver_bitacoras_cerradas: { type: Boolean, default: true },

  // Sistema de permisos de clientes
  client_access: {
    type: String,
    enum: ['all', 'specific'], // 'all' = acceso a todos los clientes, 'specific' = solo clientes específicos
    default: 'all'
  },
  allowed_clients: [{
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true
    },
    client_name: {
      type: String,
      required: true
    } // Guardamos también el nombre para facilitar consultas
  }]

}, { timestamps: true });

export default mongoose.model("Role", RoleSchema);
