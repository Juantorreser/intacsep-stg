import {useState, useEffect} from "react";

/**
 * Encapsulates all pagination state and logic.
 *
 * @param {Array}  data                - The (already-filtered) array to paginate.
 * @param {number} initialItemsPerPage - Items shown per page on first render (default 25).
 *
 * Resets to page 1 automatically whenever `data` reference changes
 * (e.g. after a filter is applied in the parent).
 */
const usePagination = (data = [], initialItemsPerPage = 25) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  // Guard against currentPage going out of bounds when data shrinks
  const safePage = Math.min(currentPage, totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safePage * itemsPerPage, totalItems);
  const paginatedData = data.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  // Reset to page 1 whenever the data array reference changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return {
    currentPage: safePage,
    itemsPerPage,
    totalItems,
    totalPages,
    startItem,
    endItem,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange,
  };
};

export default usePagination;
