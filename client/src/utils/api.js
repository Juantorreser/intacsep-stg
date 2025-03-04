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

export const fetchBitacoras = async (page, limit) => {
  try {
    const response = await fetch(`${baseUrl}/bitacoras?page=${page}&limit=${limit}`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch bitacoras");
    return await response.json();
  } catch (e) {
    console.error("Error fetching bitacoras:", e);
    return {bitacoras: [], totalItems: 0, totalPages: 1};
  }
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


