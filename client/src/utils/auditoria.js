// helper that flattens nested changes into {campo, ValOriginal, ValNuevo}
const collectChanges = (oldObj, newObj, prefix = "") => {
    const changes = [];
    for (const key in newObj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const oldVal = oldObj?.[key];
        const newVal = newObj[key];

        if (
            newVal != null &&
            typeof newVal !== "object" &&
            String(oldVal).trim() !== String(newVal).trim()
        ) {
            changes.push({ campo: fullKey, ValOriginal: oldVal, ValNuevo: newVal });
        }
        else if (
            newVal != null &&
            typeof newVal === "object" &&
            !Array.isArray(newVal)
        ) {
            changes.push(...collectChanges(oldVal, newVal, fullKey));
        }
    }
    return changes;
};

export const generateAuditoriasFromChanges = async ({
    oldData, newData, bitacoraId, user, seccion = "Bitácora"
}) => {
    const diffs = collectChanges(oldData, newData);
    for (const { campo, ValOriginal, ValNuevo } of diffs) {
        await createAuditoria({
            tipo: "Edición",
            bitacora_id: bitacoraId,
            email: user.email,
            rol: user.role,
            seccion,
            campo,
            ValOriginal: String(ValOriginal),
            ValNuevo: String(ValNuevo),
        });
    }
};

export const createAuditoria = async (auditoriaData) => {
    const baseUrl = import.meta.env.VITE_BASE_URL;

    try {
        const response = await fetch(`${baseUrl}/auditoria/bitacoras`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include", // incluye cookies/sesiones si aplica
            body: JSON.stringify(auditoriaData),
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error("Error creating auditoria:", error);
        return { success: false, error: error.message };
    }
};

export const generateAuditoriaForCreation = async ({ newData, bitacoraId, user }) => {
    const camposIniciales = Object.keys(newData);

    for (const campo of camposIniciales) {
        await createAuditoria({
            tipo: "Creación",
            bitacora_id: bitacoraId,
            email: user.email,
            rol: user.role,
            seccion: "Bitácora",
            campo,
            ValOriginal: "",
            ValNuevo: String(newData[campo]),
        });
    }
};

export const generateAuditoriaForDeletion = async ({ oldData, bitacoraId, user }) => {
    const camposEliminados = Object.keys(oldData);

    for (const campo of camposEliminados) {
        await createAuditoria({
            tipo: "Eliminación",
            bitacora_id: bitacoraId,
            email: user.email,
            rol: user.role,
            seccion: "Bitácora",
            campo,
            ValOriginal: String(oldData[campo]),
            ValNuevo: "",
        });
    }
};