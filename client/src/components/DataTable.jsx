import usePagination from "../hooks/usePagination";

/**
 * Builds the array of page numbers / ellipsis markers to render in the pager.
 * Always shows first, last, and a window of currentPage ± 1.
 * Gaps wider than 1 are replaced with the string "...".
 *
 * Examples (totalPages = 10):
 *   currentPage = 1  →  [1, 2, "...", 10]
 *   currentPage = 5  →  [1, "...", 4, 5, 6, "...", 10]
 *   currentPage = 9  →  [1, "...", 8, 9, 10]
 */
const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({length: totalPages}, (_, i) => i + 1);

  const visible = new Set([1, totalPages, currentPage]);
  if (currentPage > 1) visible.add(currentPage - 1);
  if (currentPage < totalPages) visible.add(currentPage + 1);

  const sorted = Array.from(visible).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
    result.push(sorted[i]);
  }
  return result;
};

/**
 * DataTable — reusable paginated table component.
 *
 * ─── Props ────────────────────────────────────────────────────────────────────
 *
 * data {Array}
 *   The items to display. Should already be filtered by the parent.
 *   The component only handles pagination internally.
 *
 * columns {Array<ColumnDef>}
 *   Column definitions rendered left-to-right.
 *
 *   ColumnDef shape:
 *   {
 *     key           {string}            – Unique key; used as React key and as fallback
 *                                         accessor on the row object (row[key]).
 *     header        {string|ReactNode}  – Content rendered in <th>.
 *     width         {string}            – Optional CSS width for the <th>/<td> (e.g. "60px").
 *     className     {string}            – CSS class(es) applied to every <td> in this column.
 *     headerClassName {string}          – CSS class(es) applied to the <th>.
 *     render        {Function}          – Optional custom cell renderer.
 *                                         Signature: (row, { rowIndex, currentPage, itemsPerPage }) => ReactNode
 *                                         When omitted, renders row[key] ?? "".
 *   }
 *
 * actions {Array<ActionDef>}
 *   Appends an "Acciones" column at the far right. Omit (or pass []) to hide it.
 *
 *   ActionDef shape:
 *   {
 *     icon      {string}           – Font Awesome class string (e.g. "fas fa-edit").
 *     label     {string}           – Optional text rendered next to the icon.
 *     className {string}           – CSS class(es) for the <button> (e.g. "btn btn-primary").
 *     title     {string}           – Optional tooltip via the title attribute.
 *     onClick   {Function}         – Called with the row object: (row) => void.
 *     show      {boolean|Function} – Controls visibility.
 *                                    • Omitted → always visible.
 *                                    • boolean / undefined / null → visible only when truthy.
 *                                    • (row) => boolean → evaluated per row.
 *   }
 *
 * emptyMessage {string}
 *   Text shown when data is empty (default: "No se encontraron elementos.").
 *
 * maxHeight {string}
 *   CSS max-height of the scrollable table wrapper (default: "60vh").
 *
 * itemsPerPageOptions {Array<number>}
 *   Options for the items-per-page selector (default: [25, 50, 100]).
 *
 * initialItemsPerPage {number}
 *   Initially selected items-per-page value (default: 25).
 *
 * rowKey {string|Function}
 *   Used as the React key for each row.
 *   • string  → row[rowKey]
 *   • function → rowKey(row)
 *   Default: (row) => row._id
 *
 * stickyHeader {boolean}
 *   Whether to pin the <thead> while scrolling (default: true).
 *
 * ─── Usage example ────────────────────────────────────────────────────────────
 *
 *   <DataTable
 *     data={filteredDestinos}
 *     columns={[
 *       {
 *         key: "numericId",
 *         header: "ID",
 *         width: "60px",
 *         className: "text-center fw-bold",
 *         render: (row) => row.numericId?.toString().padStart(4, "0") ?? "N/A",
 *       },
 *       { key: "nombre",  header: "Nombre"  },
 *       { key: "estado",  header: "Estado"  },
 *       { key: "cliente", header: "Cliente" },
 *     ]}
 *     actions={[
 *       {
 *         icon: "fas fa-edit",
 *         className: "btn btn-primary",
 *         onClick: (row) => handleEdit(row),
 *         show: roleData?.destinos?.update,
 *       },
 *       {
 *         icon: "fas fa-trash",
 *         className: "btn btn-danger",
 *         onClick: (row) => handleDelete(row._id),
 *         show: roleData?.destinos?.delete,
 *       },
 *     ]}
 *     emptyMessage="No se encontraron destinos que coincidan con los filtros."
 *   />
 */
const DataTable = ({
  data = [],
  columns = [],
  actions = [],
  emptyMessage = "No se encontraron elementos que coincidan con los filtros.",
  maxHeight = "60vh",
  itemsPerPageOptions = [25, 50, 100],
  initialItemsPerPage = 25,
  rowKey = (row) => row._id,
  stickyHeader = true,
}) => {
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    startItem,
    endItem,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination(data, initialItemsPerPage);

  const hasActions = actions.length > 0;
  const colCount = columns.length + (hasActions ? 1 : 0);

  const getRowKey = (row) =>
    typeof rowKey === "function" ? rowKey(row) : row[rowKey];

  const isActionVisible = (action, row) => {
    if (!("show" in action)) return true;
    if (typeof action.show === "function") return action.show(row);
    return !!action.show;
  };

  return (
    <>
      <div className="table-wrapper" style={{maxHeight, overflowY: "auto"}}>
        <div className="table-responsive">
          <table className="table">
            <thead
              className="table-light"
              style={
                stickyHeader
                  ? {position: "sticky", top: 0, zIndex: 1, backgroundColor: "#f8f9fa"}
                  : undefined
              }>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={col.headerClassName}
                    style={col.width ? {width: col.width} : undefined}>
                    {col.header}
                  </th>
                ))}
                {hasActions && <th className="text-end">Acciones</th>}
              </tr>
            </thead>

            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-4">
                    <p className="text-muted mb-0">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr key={getRowKey(row)}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={col.className}
                        data-label={typeof col.header === "string" ? col.header : col.key}>
                        {col.render
                          ? col.render(row, {rowIndex, currentPage, itemsPerPage})
                          : (row[col.key] ?? "")}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="text-end" data-label="Acciones">
                        <div className="action-buttons">
                          {actions.map((action, i) => {
                            if (!isActionVisible(action, row)) return null;
                            return (
                              <button
                                key={i}
                                type="button"
                                className={action.className}
                                title={action.title}
                                onClick={() => action.onClick(row)}>
                                {action.icon && <i className={action.icon}></i>}
                                {action.label && (
                                  <span className={action.icon ? "ms-1" : ""}>{action.label}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalItems > 0 && (
        <div className="pagination-container">
          <div className="pagination-content">
            <div className="pagination-info">
              <div className="items-per-page">
                <label htmlFor="dt-items-per-page" className="form-label">
                  Items por página:
                </label>
                <select
                  id="dt-items-per-page"
                  className="form-select form-select-sm modern-select"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}>
                  {itemsPerPageOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pagination-stats">
              <span className="stats-text">{`${startItem}-${endItem} de ${totalItems}`}</span>
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}>
                <i className="fa fa-chevron-left"></i>
              </button>

              <div className="page-numbers">
                {getPageNumbers(currentPage, totalPages).map((page, i) =>
                  page === "..." ? (
                    <span key={`ellipsis-${i}`} className="page-ellipsis">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      className={`page-btn ${page === currentPage ? "active" : ""}`}
                      onClick={() => handlePageChange(page)}>
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}>
                <i className="fa fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;
