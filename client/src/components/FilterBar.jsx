/**
 * FilterBar — reusable filter panel used in settings/list pages.
 *
 * Props:
 *   onClear   {Function}  – Called when the "clear" button is clicked.
 *   children  {ReactNode} – Filter inputs/selects rendered inside the bar.
 *                           Each child should be a single <input> or <select>.
 */
const FilterBar = ({onClear, children}) => (
  <div className="filter-bar mx-3 mb-4">
    <div className="filter-bar__inner">
      <div className="filter-bar__label">
        <i className="fas fa-filter"></i>
        <span>Filtros</span>
      </div>

      <div className="filter-bar__inputs">{children}</div>

      <button
        type="button"
        className="filter-bar__clear"
        onClick={onClear}
        title="Limpiar filtros">
        <i className="fas fa-times"></i>
      </button>
    </div>
  </div>
);

export default FilterBar;
