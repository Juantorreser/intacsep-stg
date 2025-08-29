// utils.js

// Function to handle pagination
export const getPaginatedBitacoras = (bitacoras, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return bitacoras.slice(startIndex, endIndex);
};

// Function to handle sorting
export const sortBitacoras = (bitacoras, field, order) => {
    return bitacoras.sort((a, b) => {
        const valueA = a[field];
        const valueB = b[field];

        if (valueA < valueB) return order === "asc" ? -1 : 1;
        if (valueA > valueB) return order === "asc" ? 1 : -1;
        return 0;
    });
};

/**
 * Converts all string fields in an object to uppercase
 * @param {Object} obj - The object to convert
 * @param {Array} excludeFields - Array of field names to exclude from conversion
 * @returns {Object} - New object with string fields converted to uppercase
 */
export const convertToUpperCase = (obj, excludeFields = []) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const converted = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (excludeFields.includes(key)) {
            // Keep excluded fields as-is
            converted[key] = value;
        } else if (typeof value === 'string') {
            // Convert strings to uppercase
            converted[key] = value.toUpperCase();
        } else if (Array.isArray(value)) {
            // Recursively convert array elements
            converted[key] = value.map(item => 
                typeof item === 'object' ? convertToUpperCase(item, excludeFields) : 
                typeof item === 'string' ? item.toUpperCase() : item
            );
        } else if (value && typeof value === 'object') {
            // Recursively convert nested objects
            converted[key] = convertToUpperCase(value, excludeFields);
        } else {
            // Keep other types as-is (numbers, booleans, null, etc.)
            converted[key] = value;
        }
    }
    
    return converted;
};

/**
 * Converts specific string fields to uppercase while preserving others
 * @param {Object} obj - The object to convert
 * @param {Array} fieldsToConvert - Array of field names to convert to uppercase
 * @returns {Object} - New object with specified fields converted to uppercase
 */
export const convertSpecificFieldsToUpperCase = (obj, fieldsToConvert = []) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const converted = { ...obj };
    
    fieldsToConvert.forEach(field => {
        if (converted[field] && typeof converted[field] === 'string') {
            converted[field] = converted[field].toUpperCase();
        }
    });
    
    return converted;
};

