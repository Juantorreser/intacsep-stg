// src/services/api.js

const baseUrl = import.meta.env.VITE_BASE_URL;

export const fetchOrigenes = async () => {
  try {
    const response = await fetch(`${baseUrl}/origenes`, {
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

export const fetchDestinos = async () => {
  try {
    const response = await fetch(`${baseUrl}/destinos`, {
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

export const fetchOperadores = async () => {
  try {
    const response = await fetch(`${baseUrl}/operadores`, {
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
  filters = {}
) => {
  const params = new URLSearchParams({ page, limit });
  if (operador) params.append("operador", operador);

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


export const fetchClients = async () => {
  try {
    const response = await fetch(`${baseUrl}/clients`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch clients");
    return await response.json();
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

  if (typeof field === "string" && !field.match(/^[0-9a-f]{24}$/i)) {
    return field; // plain text (legacy)
  }

  const found = list.find((l) => l._id === field);
  return found
    ? `${found.nombre}, ${found.estado}`
    : "Ubicación no encontrada";
};