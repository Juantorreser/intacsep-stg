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

