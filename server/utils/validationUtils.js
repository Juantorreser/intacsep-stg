// validationUtils.js
import mongoose from 'mongoose';

/**
 * Valida si un string es un ObjectId válido de MongoDB
 * @param {string} id - El string a validar
 * @returns {boolean} - true si es un ObjectId válido, false en caso contrario
 */
export const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') {
        return false;
    }

    // Un ObjectId válido debe tener exactamente 24 caracteres hexadecimales
    // y no debe contener espacios
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id.trim());
};

/**
 * Convierte un ObjectId a mayúsculas si es válido
 * @param {string} id - El ObjectId a convertir
 * @returns {string} - El ObjectId en mayúsculas si es válido, null si no es válido
 */
export const convertObjectIdToUpperCase = (id) => {
    if (!isValidObjectId(id)) {
        return null;
    }
    return id.toUpperCase();
};

/**
 * Valida y convierte ObjectIds en un objeto
 * @param {Object} data - El objeto con los datos
 * @param {Array} objectIdFields - Array de campos que deben ser ObjectIds
 * @returns {Object} - Objeto con validaciones y conversiones aplicadas
 */
export const validateAndConvertObjectIds = (data, objectIdFields = ['origen', 'destino']) => {
    const result = { ...data };
    const errors = [];

    objectIdFields.forEach(field => {
        if (result[field]) {
            if (!isValidObjectId(result[field])) {
                errors.push(`El campo '${field}' debe ser un ID válido (24 caracteres hexadecimales sin espacios)`);
            } else {
                // Convertir a mayúsculas si es válido
                result[field] = result[field].toUpperCase();
            }
        }
    });

    return {
        data: result,
        errors: errors
    };
};

/**
 * Middleware para validar ObjectIds en el request body
 * @param {Array} objectIdFields - Campos que deben ser ObjectIds
 * @returns {Function} - Middleware function
 */
export const validateObjectIdsMiddleware = (objectIdFields = ['origen', 'destino']) => {
    return (req, res, next) => {
        if (req.body && Object.keys(req.body).length > 0) {
            const validation = validateAndConvertObjectIds(req.body, objectIdFields);

            if (validation.errors.length > 0) {
                return res.status(400).json({
                    error: 'Datos de entrada inválidos',
                    details: validation.errors
                });
            }

            req.body = validation.data;
        }
        next();
    };
};
