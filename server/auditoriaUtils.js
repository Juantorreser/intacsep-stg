import Auditoria from "./models/Auditoria.js";

// Helper para comparar objetos y obtener cambios campo a campo
function collectChanges(oldObj, newObj, prefix = "") {
    const changes = [];
    for (const key in newObj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const oldVal = oldObj?.[key];
        const newVal = newObj[key];
        if (
            newVal != null &&
            typeof newVal !== "object" &&
            String(oldVal ?? "").trim() !== String(newVal ?? "").trim()
        ) {
            changes.push({ campo: fullKey, ValOriginal: oldVal, ValNuevo: newVal });
        } else if (
            newVal != null &&
            typeof newVal === "object" &&
            !Array.isArray(newVal)
        ) {
            changes.push(...collectChanges(oldVal, newVal, fullKey));
        }
    }
    return changes;
}

// Auditar creación: un registro por campo creado
export async function auditCreation({
    newData,
    modelId = "",
    user = {},
    seccion = "",
    tipo = "Creación",
}) {
    const campos = Object.keys(newData);
    for (const campo of campos) {
        await Auditoria.create({
            tipo,
            bitacora_id: modelId,
            email: user.email || "",
            rol: user.role || "",
            seccion,
            campo,
            ValOriginal: "",
            ValNuevo: String(newData[campo]),
        });
    }
}

// Auditar edición: un registro por campo cambiado
export async function auditUpdate({
    oldData,
    newData,
    modelId = "",
    user = {},
    seccion = "",
    tipo = "Edición",
}) {
    const diffs = collectChanges(oldData, newData);
    for (const { campo, ValOriginal, ValNuevo } of diffs) {
        await Auditoria.create({
            tipo,
            bitacora_id: modelId,
            email: user.email || "",
            rol: user.role || "",
            seccion,
            campo,
            ValOriginal: String(ValOriginal ?? ""),
            ValNuevo: String(ValNuevo ?? ""),
        });
    }
}

// Auditar eliminación: un registro por campo eliminado
export async function auditDeletion({
    oldData,
    modelId = "",
    user = {},
    seccion = "",
    tipo = "Eliminación",
}) {
    const campos = Object.keys(oldData);
    for (const campo of campos) {
        await Auditoria.create({
            tipo,
            bitacora_id: modelId,
            email: user.email || "",
            rol: user.role || "",
            seccion,
            campo,
            ValOriginal: String(oldData[campo]),
            ValNuevo: "",
        });
    }
} 