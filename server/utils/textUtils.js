// textUtils.js

/**
 * Convierte campos de texto de un objeto a mayúsculas
 * @param {Object} data - El objeto con los datos
 * @param {Array} excludeFields - Array de campos que NO deben convertirse a mayúsculas
 * @returns {Object} - El objeto con los campos de texto convertidos a mayúsculas
 */
export const convertToUpperCase = (data, excludeFields = []) => {
    if (!data || typeof data !== 'object') return data;

    // Campos que por defecto NO deben convertirse a mayúsculas
    const defaultExcludeFields = [
        '_id', 'id', 'createdAt', 'updatedAt', '__v',
        'inicioMonitoreo', 'finalMonitoreo', 'timestamp',
        'telefono', 'password', 'email', 'status',
        'sequence_value', 'bitacora_id', 'client_id',
        'capacidad', 'tipo', 'eco', 'placa',
        'origen', 'destino'  // ObjectIds no deben convertirse a mayúsculas como strings
    ];

    const allExcludeFields = [...defaultExcludeFields, ...excludeFields];

    const convertedData = { ...data };

    for (const [key, value] of Object.entries(convertedData)) {
        // Si el campo está en la lista de exclusión, no convertir
        if (allExcludeFields.includes(key)) {
            continue;
        }

        if (typeof value === 'string' && value.trim() !== '') {
            // Convertir string a mayúsculas
            convertedData[key] = value.toUpperCase();
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Si es un objeto anidado, aplicar recursivamente
            convertedData[key] = convertToUpperCase(value, excludeFields);
        } else if (Array.isArray(value)) {
            // Si es un array, procesar cada elemento
            convertedData[key] = value.map(item => {
                if (typeof item === 'string') {
                    return allExcludeFields.includes(key) ? item : item.toUpperCase();
                } else if (typeof item === 'object' && item !== null) {
                    return convertToUpperCase(item, excludeFields);
                }
                return item;
            });
        }
    }

    return convertedData;
};

/**
 * Middleware para aplicar conversión a mayúsculas automáticamente
 * @param {Array} excludeFields - Campos adicionales a excluir
 * @returns {Function} - Middleware function
 */
export const uppercaseMiddleware = (excludeFields = []) => {
    return (req, res, next) => {
        if (req.body && Object.keys(req.body).length > 0) {
            req.body = convertToUpperCase(req.body, excludeFields);
        }
        next();
    };
};
