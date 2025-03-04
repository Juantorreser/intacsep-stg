// utils/dateUtils.js

export const formatDate = (dateString) => {
    const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/Mexico_City",
    };
    return new Date(dateString).toLocaleDateString("es-MX", options);
};
