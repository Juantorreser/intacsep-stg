// clientPermissions.js

/**
 * Obtiene los clientes permitidos para un usuario basado en su rol
 * @param {Object} userRoleData - Datos del rol del usuario
 * @param {Array} allClients - Lista de todos los clientes
 * @returns {Array} - Lista de clientes permitidos
 */
export const getAllowedClients = (userRoleData, allClients) => {
    if (!userRoleData || !allClients) return [];

    // Si el rol tiene acceso a todos los clientes
    if (userRoleData.client_access === 'all') {
        return allClients;
    }

    // Si el rol tiene acceso solo a clientes específicos
    if (userRoleData.client_access === 'specific' && userRoleData.allowed_clients) {
        const allowedClientIds = userRoleData.allowed_clients.map(ac => ac.client_id);
        return allClients.filter(client => allowedClientIds.includes(client._id));
    }

    // Por defecto, devolver todos los clientes (comportamiento anterior)
    return allClients;
};

/**
 * Verifica si un usuario puede acceder a un cliente específico
 * @param {Object} userRoleData - Datos del rol del usuario
 * @param {string} clientId - ID del cliente a verificar
 * @returns {boolean} - true si puede acceder, false si no
 */
export const canAccessClient = (userRoleData, clientId) => {
    if (!userRoleData || !clientId) return false;

    // Si el rol tiene acceso a todos los clientes
    if (userRoleData.client_access === 'all') {
        return true;
    }

    // Si el rol tiene acceso solo a clientes específicos
    if (userRoleData.client_access === 'specific' && userRoleData.allowed_clients) {
        const allowedClientIds = userRoleData.allowed_clients.map(ac => ac.client_id);
        return allowedClientIds.includes(clientId);
    }

    // Por defecto, permitir acceso (comportamiento anterior)
    return true;
};

/**
 * Filtra bitácoras basado en los clientes permitidos del usuario
 * @param {Array} bitacoras - Lista de bitácoras
 * @param {Object} userRoleData - Datos del rol del usuario
 * @returns {Array} - Bitácoras filtradas
 */
export const filterBitacorasByClientPermissions = (bitacoras, userRoleData) => {
    if (!userRoleData || !bitacoras) return bitacoras;

    // Si el rol tiene acceso a todos los clientes, no filtrar
    if (userRoleData.client_access === 'all') {
        return bitacoras;
    }

    // Si el rol tiene acceso solo a clientes específicos
    if (userRoleData.client_access === 'specific' && userRoleData.allowed_clients) {
        const allowedClientNames = userRoleData.allowed_clients.map(ac => ac.client_name.toUpperCase());
        return bitacoras.filter(bitacora => {
            const clienteName = (bitacora.cliente || '').toUpperCase();
            return allowedClientNames.includes(clienteName);
        });
    }

    // Por defecto, devolver todas las bitácoras (comportamiento anterior)
    return bitacoras;
};

/**
 * Crea parámetros de consulta para filtrar por cliente en el backend
 * @param {Object} userRoleData - Datos del rol del usuario
 * @returns {Object} - Parámetros de consulta
 */
export const getClientFilterParams = (userRoleData) => {
    if (!userRoleData) return {};

    // Si el rol tiene acceso a todos los clientes, no agregar filtros
    if (userRoleData.client_access === 'all') {
        return {};
    }

    // Si el rol tiene acceso solo a clientes específicos
    if (userRoleData.client_access === 'specific' && userRoleData.allowed_clients) {
        const allowedClientNames = userRoleData.allowed_clients.map(ac => ac.client_name);
        return {
            allowed_clients: allowedClientNames
        };
    }

    return {};
};
