export const formatDate = (dateStr) => {
  if (!dateStr) {
    return "No disponible";
  }
  const date = new Date(dateStr);
  return !isNaN(date.getTime())
    ? date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Mexico_City",
      }) +
        " " +
        date.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "America/Mexico_City",
        })
    : "No disponible";
};
