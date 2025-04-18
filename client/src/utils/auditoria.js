export const generateAuditoriasFromChanges = async ({
    oldData,
    newData,
    bitacoraId,
    user,
    seccion = "Bitácora",
}) => {
    const changes = [];

    for (const key in newData) {
        const oldValue = oldData[key];
        const newValue = newData[key];

        if (
            oldValue !== undefined &&
            newValue !== undefined &&
            String(oldValue).trim() !== String(newValue).trim()
        ) {
            changes.push({
                tipo: "Edición",
                bitacora_id: bitacoraId,
                email: user.email,
                rol: user.role,
                seccion,
                campo: key,
                ValOriginal: String(oldValue),
                ValNuevo: String(newValue),
            });
        }
    }

    for (const auditoria of changes) {
        await createAuditoria(auditoria);
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
