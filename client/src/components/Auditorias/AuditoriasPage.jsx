import React, {useEffect, useState} from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import * as XLSX from "xlsx";
import {saveAs} from "file-saver";
import {useAuth} from "../../context/AuthContext";
import {useSidebar} from "../../context/SidebarContext";

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

  const {user, verifyToken, setUser} = useAuth();
  const [roleData, setRoleData] = useState(null);
  const {isSidebarCollapsed} = useSidebar();

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken(); // Ensure user is verified
        setUser(data);
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        navigate("/login");
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchRolePermissions = async () => {
      try {
        const response = await fetch(`${baseUrl}/roles/${user.role}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        setRoleData(data);
      } catch (e) {
        console.log("Error fetching role permissions:", e);
      }
    };

    fetchRolePermissions();
  }, [user]);

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
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="page-header">
            <div className="">
              <h1 className="fs-3 fw-semibold text-black m-0">Auditoría - Bitácoras</h1>
            </div>
            <div style={{width: "120px"}}></div> {/* Invisible spacer to balance button width */}
            <div>
              <button className="btn btn-export" onClick={exportToExcel}>
                Exportar a Excel
              </button>
            </div>
          </div>

          {roleData?.auditoria_bitacora?.read && (
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

              {/* Pagination Controls - estilo Bitácoras */}
              <div className="d-flex justify-content-between align-items-center mx-3 my-3 gap-4">
                <div className="d-flex align-items-center justify-content-start">
                  <label htmlFor="itemsPerPage" className="form-label p-0 m-0 s-font fw-bold">
                    Items Por Página:
                  </label>
                  <select
                    id="itemsPerPage"
                    className="form-select itemsSelector s-font ms-2"
                    value={rowsPerPage}
                    onChange={(e) => {
                      const newLimit = Number(e.target.value);
                      // Deberás crear este state y lógica si quieres hacerlo dinámico
                      // setRowsPerPage(newLimit); // Si decides hacerlo editable
                      setCurrentPage(1);
                    }}
                    disabled>
                    <option value={25}>25</option>
                  </select>
                </div>

                <div>
                  <span className="m-font">
                    {`${(currentPage - 1) * rowsPerPage + 1}-${Math.min(
                      currentPage * rowsPerPage,
                      filteredData.length
                    )} de ${filteredData.length}`}
                  </span>
                </div>

                <div className="d-flex align-items-center">
                  <button
                    className="btn border-0"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}>
                    <i className="fa fa-chevron-left s-font"></i>
                  </button>

                  <div className="mx-0 s-font">
                    {Array.from({length: Math.min(3, totalPages)}).map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          className={`btn pageLink s-font ${
                            pageNum === currentPage ? "fw-bold fs-6" : "opacity-75"
                          }`}
                          onClick={() => setCurrentPage(pageNum)}>
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 3 && (
                      <>
                        <span className="mx-1">...</span>
                        <button
                          className={`btn pageLink s-font ${
                            totalPages === currentPage ? "fw-bold" : ""
                          }`}
                          onClick={() => setCurrentPage(totalPages)}>
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    className="btn border-0"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}>
                    <i className="fa fa-chevron-right s-font"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AuditoriasPage;
