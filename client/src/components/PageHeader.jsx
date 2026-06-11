import React, { useState } from 'react';

const PageHeader = ({ title, count, children, filters, onToggleSidebar, defaultFiltersOpen = false }) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(defaultFiltersOpen);

  return (
    <div className="bits-header-container">
      <div className="bits-header">
        <div className="bits-header__left">
          {onToggleSidebar && (
            <button
              type="button"
              className="btn btn-sm bits-menu-toggle d-md-none me-2"
              onClick={onToggleSidebar}>
              <i className="fa fa-bars"></i>
            </button>
          )}
          <h1 className="bits-header__title">{title}</h1>
          {count !== undefined && count > 0 && (
            <span className="bits-header__count">{count}</span>
          )}
        </div>
        <div className="bits-header__right">
          {filters && (
            <button
              type="button"
              className={`btn btn-sm ${isFiltersOpen ? 'btn-primary' : 'btn-outline-primary'} filter-toggle-btn`}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              title={isFiltersOpen ? "Ocultar filtros" : "Mostrar filtros"}
            >
              <i className={`fa ${isFiltersOpen ? 'fa-filter-circle-xmark' : 'fa-filter'}`}></i>
            </button>
          )}
          {children}
        </div>
      </div>
      
      {filters && (
        <div className={`bits-header-filters ${isFiltersOpen ? 'is-open' : ''}`}>
          <div className="bits-header-filters__content">
            {filters}
          </div>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
