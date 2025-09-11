// src/services/api.js

const baseUrl = import.meta.env.VITE_BASE_URL;

export const fetchOrigenes = async (cliente = null) => {
  try {
    let url = `${baseUrl}/origenes`;
    if (cliente && cliente !== "all") {
      url += `?cliente=${encodeURIComponent(cliente)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch origenes");
    return await response.json();
  } catch (e) {
    console.error("Error fetching origenes:", e.message);
    return [];
  }
};

export const fetchDestinos = async (cliente = null) => {
  try {
    let url = `${baseUrl}/destinos`;
    if (cliente && cliente !== "all") {
      url += `?cliente=${encodeURIComponent(cliente)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch destinos");
    return await response.json();
  } catch (e) {
    console.error("Error fetching destinos:", e);
    return [];
  }
};

export const fetchOperadores = async (lineaTransporte = null) => {
  try {
    let url = `${baseUrl}/operadores`;
    if (lineaTransporte && lineaTransporte !== "all") {
      url += `?lineaTransporte=${encodeURIComponent(lineaTransporte)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch operadores");
    return await response.json();
  } catch (e) {
    console.error("Error fetching operadores:", e);
    return [];
  }
};

export const fetchLineasTransporte = async (cliente = null) => {
  try {
    let url = `${baseUrl}/lineas-transporte`;
    if (cliente && cliente !== "all") {
      url += `?cliente=${encodeURIComponent(cliente)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch lineas transporte");
    return await response.json();
  } catch (e) {
    console.error("Error fetching lineas transporte:", e);
    return [];
  }
};

export const fetchUsers = async () => {
  try {
    const response = await fetch(`${baseUrl}/users/`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    const data = await response.json();
    return data.filter((user) => user.role === "Monitorista");
  } catch (e) {
    console.error("Error fetching users:", e);
    return [];
  }
};

export const fetchBitacoras = async (
  page = 1,
  limit = 25,
  operador = "",
  filters = {},
  userRoleData = null
) => {
  const params = new URLSearchParams({ page, limit });
  if (operador) params.append("operador", operador);

  // Add client permissions filter if user has specific client access
  if (userRoleData && userRoleData.client_access === 'specific' && userRoleData.allowed_clients) {
    const allowedClientNames = userRoleData.allowed_clients.map(ac => ac.client_name);
    params.append("allowed_clients", allowedClientNames.join(','));
  }

  // Add all filter parameters
  if (filters.statusFilter) params.append("statusFilter", filters.statusFilter);
  if (filters.creationDateFilter) params.append("creationDateFilter", filters.creationDateFilter);
  if (filters.clienteFilter) params.append("clienteFilter", filters.clienteFilter);
  if (filters.monitoreoFilter) params.append("monitoreoFilter", filters.monitoreoFilter);
  if (filters.operadorFilter) params.append("operadorFilter", filters.operadorFilter);
  if (filters.idFilter) params.append("idFilter", filters.idFilter);
  if (filters.sortField) params.append("sortField", filters.sortField);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

  const response = await fetch(`${baseUrl}/bitacoras?${params.toString()}`, {
    credentials: "include",
  });

  const data = await response.json();
  return data;
};


export const fetchClients = async (userRoleData = null) => {
  try {
    const response = await fetch(`${baseUrl}/clients`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch clients");
    const allClients = await response.json();

    // Apply client permissions filtering
    if (userRoleData && userRoleData.client_access === 'specific' && userRoleData.allowed_clients) {
      const allowedClientIds = userRoleData.allowed_clients.map(ac => ac.client_id);
      return allClients.filter(client => allowedClientIds.includes(client._id));
    }

    return allClients;
  } catch (e) {
    console.error("Error fetching clients:", e);
    return [];
  }
};

export const fetchMonitoreos = async () => {
  try {
    const response = await fetch(`${baseUrl}/monitoreos`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch monitoreos");
    return await response.json();
  } catch (e) {
    console.error("Error fetching monitoreos:", e);
    return [];
  }
};

export const getLocationText = (field, list) => {
  if (!field) return "No especificado";

  // If field is already a plain text (resolved name), return it
  if (typeof field === "string" && !field.match(/^[0-9a-f]{24}$/i)) {
    return field; // plain text (legacy or already resolved)
  }

  // If field is an ObjectId string, try to find it in the list
  if (typeof field === "string" && field.match(/^[0-9a-f]{24}$/i)) {
    const found = list.find((l) => {
      // Handle both string and ObjectId _id fields
      const idToCompare = typeof l._id === 'string' ? l._id : l._id.toString();
      return idToCompare === field;
    });
    return found
      ? `${found.nombre}, ${found.estado}`
      : "Ubicación no encontrada";
  }

  // If field is an ObjectId object, convert to string and find
  if (typeof field === "object" && field._id) {
    const found = list.find((l) => {
      const fieldId = typeof field._id === 'string' ? field._id : field._id.toString();
      const listId = typeof l._id === 'string' ? l._id : l._id.toString();
      return listId === fieldId;
    });
    return found
      ? `${found.nombre}, ${found.estado}`
      : "Ubicación no encontrada";
  }

  // Fallback
  return "Ubicación no encontrada";
};