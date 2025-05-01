import React, {useEffect, useState} from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import * as XLSX from "xlsx";
import {saveAs} from "file-saver";

const AuditoriasPage = () => {
  const [auditorias, setAuditorias] = useState([]);
  const [filters, setFilters] = useState({
    tipo: "",
    bitacora_id: "",
    email: "",
    rol: "",
    seccion: "",
    campo: "",
    ValOriginal: "",
    ValNuevo: "",
    createdAt: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({key: null, direction: "asc"});
  const rowsPerPage = 25;
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchAuditorias = async () => {
      try {
        const response = await fetch(`${baseUrl}/auditoria/bitacoras`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setAuditorias(data);
        } else {
          console.error("Failed to fetch auditorias:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching auditorias:", e);
      }
    };

    fetchAuditorias();
  }, [baseUrl]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({key, direction});
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({...prev, [key]: value}));
    setCurrentPage(1); // reset to page 1 on filter
  };

  const filteredData = auditorias
    .filter((item) =>
      Object.entries(filters).every(([key, value]) =>
        item[key]?.toString().toLowerCase().includes(value.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (sortConfig.key) {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item) => ({
      Tipo: item.tipo,
      "Bitácora ID": item.bitacora_id,
      Email: item.email,
      Rol: item.rol,
      Sección: item.seccion,
      Campo: item.campo,
      "Valor Original": item.ValOriginal,
      "Valor Nuevo": item.ValNuevo,
      Fecha: new Date(item.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auditorias");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {type: "application/octet-stream"});
    saveAs(fileData, "auditorias_export.xlsx");
  };

  return (
    <section id="auditorias">
      <Header />
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <div className="d-flex justify-content-between align-items-center mx-3 mb-1">
            <div className="flex-grow-1 text-center">
              <h1 className="fs-3 fw-semibold text-black m-0">Auditorías</h1>
            </div>
            <div style={{width: "120px"}}></div> {/* Invisible spacer to balance button width */}
            <div>
              <button className="btn btn-export" onClick={exportToExcel}>
                Exportar a Excel
              </button>
            </div>
          </div>
          <div className="mx-3 my-0">
            <div className="table-wrapper">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("tipo")}>Tipo {getSortIcon("tipo")}</th>
                      <th onClick={() => handleSort("bitacora_id")}>
                        Bitácora ID {getSortIcon("bitacora_id")}
                      </th>
                      <th onClick={() => handleSort("email")}>Email {getSortIcon("email")}</th>
                      <th onClick={() => handleSort("rol")}>Rol {getSortIcon("rol")}</th>
                      <th onClick={() => handleSort("seccion")}>
                        Sección {getSortIcon("seccion")}
                      </th>
                      <th onClick={() => handleSort("campo")}>Campo {getSortIcon("campo")}</th>
                      <th onClick={() => handleSort("ValOriginal")}>
                        Valor Original {getSortIcon("ValOriginal")}
                      </th>
                      <th onClick={() => handleSort("ValNuevo")}>
                        Valor Nuevo {getSortIcon("ValNuevo")}
                      </th>
                      <th onClick={() => handleSort("createdAt")}>
                        Fecha {getSortIcon("createdAt")}
                      </th>
                    </tr>
                    <tr>
                      <th>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Filtrar..."
                          value={filters.tipo}
                          onChange={(e) => handleFilterChange("tipo", e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Filtrar..."
                          value={filters.bitacora_id}
                          onChange={(e) => handleFilterChange("bitacora_id", e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Filtrar..."
                          value={filters.email}
                          onChange={(e) => handleFilterChange("email", e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Filtrar..."
                          value={filters.rol}
                          onChange={(e) => handleFilterChange("rol", e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Filtrar..."
                          value={filters.seccion}
                          onChange={(e) => handleFilterChange("seccion", e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Filtrar..."
                          value={filters.campo}
                          onChange={(e) => handleFilterChange("campo", e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Filtrar..."
                          value={filters.ValOriginal}
                          onChange={(e) => handleFilterChange("ValOriginal", e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Filtrar..."
                          value={filters.ValNuevo}
                          onChange={(e) => handleFilterChange("ValNuevo", e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Filtrar..."
                          value={filters.createdAt}
                          onChange={(e) => handleFilterChange("createdAt", e.target.value)}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((a) => (
                      <tr key={a._id}>
                        <td>{a.tipo}</td>
                        <td>{a.bitacora_id}</td>
                        <td>{a.email}</td>
                        <td>{a.rol}</td>
                        <td>{a.seccion}</td>
                        <td>{a.campo}</td>
                        <td>{a.ValOriginal}</td>
                        <td>{a.ValNuevo}</td>
                        <td>{new Date(a.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 📄 Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-1 pagination-controls">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}>
                ◀
              </button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}>
                ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuditoriasPage;
