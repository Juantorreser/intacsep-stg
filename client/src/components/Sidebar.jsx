import "bootstrap/dist/js/bootstrap.bundle.min";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext.jsx";
import {useSidebar} from "../context/SidebarContext.jsx";
import InactivityModal from "./Settings/InactivityModal.jsx";
import Footer from "./Footer.jsx";

const Sidebar = () => {
  const {user, logout} = useAuth();
  const {isSidebarCollapsed, toggleSidebar} = useSidebar();
  const navigate = useNavigate();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showInacModal, setShowInacModal] = useState(false);
  const [collapsedItems, setCollapsedItems] = useState({
    dashboardCollapse: false,
    bitacorasCollapse: false,
    settingsCollapse: false,
    catalogosCollapse: false,
    sistemaCollapse: false,
    auditoriaCollapse: false,
  });
  const [roleData] = useState({});

  // Functions
  const openInacModal = () => {
    setShowInacModal(true);
  };

  const closeInacModal = () => {
    setShowInacModal(false);
  };

  const toggleCollapse = (itemKey) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const handleIconClick = (callback, itemKey) => {
    if (isSidebarCollapsed) {
      toggleCollapse(itemKey);
    } else {
      callback();
    }
  };

  const menuItems = [
    {
      path: "/inicio",
      icon: "fa-home",
      label: "Inicio",
      roles: ["admin", "user", "supervisor"],
    },
    {
      path: "/dashboard/general",
      icon: "fa-tachometer-alt",
      label: "Dashboard General",
      roles: ["admin", "user", "supervisor"],
    },
    {
      path: "/dashboard/anomalias",
      icon: "fa-exclamation-triangle",
      label: "Dashboard Anomalías",
      roles: ["admin", "user", "supervisor"],
    },
    {
      path: "/bitacoras",
      icon: "fa-book",
      label: "Bitácoras",
      roles: ["admin", "user", "supervisor"],
    },
    {
      path: "/auditoria/bitacoras",
      icon: "fa-search",
      label: "Auditoría",
      roles: ["admin", "supervisor"],
    },
    {
      path: "/wialon",
      icon: "fa-map-marker-alt",
      label: "Wialon Tracker",
      roles: ["admin", "user", "supervisor"],
    },
    {
      path: "/units",
      icon: "fa-satellite-dish",
      label: "Wialon Units",
      roles: ["admin", "user", "supervisor"],
    },
    {
      path: "/tipos_monitoreo",
      icon: "fa-cogs",
      label: "Tipos de Monitoreo",
      roles: ["admin"],
    },
    {
      path: "/usuarios",
      icon: "fa-users",
      label: "Usuarios",
      roles: ["admin"],
    },
    {
      path: "/roles",
      icon: "fa-user-shield",
      label: "Roles",
      roles: ["admin"],
    },
    {
      path: "/clientes",
      icon: "fa-building",
      label: "Clientes",
      roles: ["admin"],
    },
    {
      path: "/eventos",
      icon: "fa-calendar",
      label: "Eventos",
      roles: ["admin"],
    },
    {
      path: "/origenes",
      icon: "fa-map-pin",
      label: "Orígenes",
      roles: ["admin"],
    },
    {
      path: "/destinos",
      icon: "fa-map-marker",
      label: "Destinos",
      roles: ["admin"],
    },
    {
      path: "/operadores",
      icon: "fa-user-tie",
      label: "Operadores",
      roles: ["admin"],
    },
    {
      path: "/perfil",
      icon: "fa-user",
      label: "Perfil",
      roles: ["admin", "user", "supervisor"],
    },
  ];

  return (
    <>
      <button
        className="sidebar-toggle-btn d-md-none"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}>
        <i className="fa fa-bars"></i>
      </button>

      <aside
        id="leftsidebar"
        className={`${isSidebarCollapsed ? "collapsed" : ""} ${
          isMobileSidebarOpen ? "mobile-open" : ""
        }`}>
        {/* Floating Collapse Button (only when collapsed) */}
        {isSidebarCollapsed && (
          <div className="floating-collapse-btn">
            <button onClick={toggleSidebar} className="collapse-btn">
              <i className="fa fa-chevron-right"></i>
            </button>
          </div>
        )}

        <div className="sidebar-wrapper">
          {/* Mobile close button */}
          {isMobileSidebarOpen && (
            <div className="mobile-close-btn">
              <button onClick={() => setIsMobileSidebarOpen(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
          )}

          {/* User Profile Section */}
          <div className="user-profile">
            {/* Collapse/Expand Button (only when expanded) */}
            {!isSidebarCollapsed && (
              <div className="sidebar-toggle" onClick={(e) => e.stopPropagation()}>
                <button onClick={toggleSidebar} className="collapse-btn">
                  <i className="fa fa-chevron-left"></i>
                </button>
              </div>
            )}

            <div className="user-avatar">
              <img src="/logo1.png" alt="Logo" />
            </div>
            {!isSidebarCollapsed && (
              <div className="user-info">
                <h6 className="user-name">
                  {user?.firstName} {user?.lastName}
                </h6>
                <span className="user-role">{user?.role}</span>
                <span className="user-email">{user?.email}</span>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="sidebar-nav">
            <ul className="nav-menu">
              {/* Dashboard */}
              <li className="nav-item">
                <div
                  className="nav-link has-submenu"
                  onClick={() =>
                    handleIconClick(() => toggleCollapse("dashboardCollapse"), "dashboardCollapse")
                  }>
                  <div className="nav-link-content">
                    <i className="fa fa-tachometer-alt"></i>
                    {!isSidebarCollapsed && <span>Dashboard</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <i
                      className={`fa fa-chevron-${
                        collapsedItems.dashboardCollapse ? "up" : "down"
                      }`}
                    />
                  )}
                </div>

                {collapsedItems.dashboardCollapse && !isSidebarCollapsed && (
                  <ul className="submenu">
                    <li onClick={() => navigate("/dashboard/general")}>
                      <i className="fa fa-chart-bar"></i>
                      <span>General</span>
                    </li>
                    <li onClick={() => navigate("/dashboard/anomalias")}>
                      <i className="fa fa-exclamation-triangle"></i>
                      <span>Anomalías</span>
                    </li>
                  </ul>
                )}
              </li>

              {/* Monitoreo */}
              {roleData?.bitacoras?.read && (
                <li className="nav-item">
                  <div
                    className="nav-link has-submenu"
                    onClick={() =>
                      handleIconClick(
                        () => toggleCollapse("bitacorasCollapse"),
                        "bitacorasCollapse"
                      )
                    }>
                    <div className="nav-link-content">
                      <i className="fa fa-chart-line"></i>
                      {!isSidebarCollapsed && <span>Monitoreo</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <i
                        className={`fa fa-chevron-${
                          collapsedItems.bitacorasCollapse ? "up" : "down"
                        }`}
                      />
                    )}
                  </div>

                  {collapsedItems.bitacorasCollapse && !isSidebarCollapsed && (
                    <ul className="submenu">
                      <li onClick={() => navigate("/bitacoras")}>
                        <i className="fa fa-book"></i>
                        <span>Bitácoras</span>
                      </li>
                    </ul>
                  )}
                </li>
              )}

              {/* Configuración */}
              {roleData && (
                <li className="nav-item">
                  <div
                    className="nav-link has-submenu"
                    onClick={() =>
                      handleIconClick(() => toggleCollapse("settingsCollapse"), "settingsCollapse")
                    }>
                    <div className="nav-link-content">
                      <i className="fa fa-cog"></i>
                      {!isSidebarCollapsed && <span>Configuración</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <i
                        className={`fa fa-chevron-${
                          collapsedItems.settingsCollapse ? "up" : "down"
                        }`}
                      />
                    )}
                  </div>

                  {collapsedItems.settingsCollapse && !isSidebarCollapsed && (
                    <ul className="submenu">
                      {/* Catálogos */}
                      <li className="submenu-item">
                        <div
                          className="submenu-link has-submenu"
                          onClick={() => toggleCollapse("catalogosCollapse")}>
                          <div className="submenu-link-content">
                            <i className="fa fa-list"></i>
                            <span>Catálogos</span>
                          </div>
                          <i
                            className={`fa fa-chevron-${
                              collapsedItems.catalogosCollapse ? "up" : "down"
                            }`}
                          />
                        </div>

                        {collapsedItems.catalogosCollapse && (
                          <ul className="sub-submenu">
                            {roleData.tipos_de_monitoreo?.read && (
                              <li onClick={() => navigate("/tipos_monitoreo")}>
                                <i className="fa fa-tags"></i>
                                <span>Tipos Monitoreo</span>
                              </li>
                            )}
                            {roleData.eventos?.read && (
                              <li onClick={() => navigate("/eventos")}>
                                <i className="fa fa-calendar-alt"></i>
                                <span>Eventos</span>
                              </li>
                            )}
                            {roleData.clientes?.read && (
                              <li onClick={() => navigate("/clientes")}>
                                <i className="fa fa-building"></i>
                                <span>Clientes</span>
                              </li>
                            )}
                            {roleData.origenes?.read && (
                              <li onClick={() => navigate("/origenes")}>
                                <i className="fa fa-map-marker-alt"></i>
                                <span>Origenes</span>
                              </li>
                            )}
                            {roleData.destinos?.read && (
                              <li onClick={() => navigate("/destinos")}>
                                <i className="fa fa-map-pin"></i>
                                <span>Destinos</span>
                              </li>
                            )}
                            <li onClick={() => navigate("/lineas-transporte")}>
                              <i className="fa fa-truck"></i>
                              <span>Líneas de Transporte</span>
                            </li>
                            <li onClick={() => navigate("/operadores")}>
                              <i className="fa fa-user-tie"></i>
                              <span>Operadores</span>
                            </li>
                          </ul>
                        )}
                      </li>

                      {/* Sistema */}
                      <li className="submenu-item">
                        <div
                          className="submenu-link has-submenu"
                          onClick={() => toggleCollapse("sistemaCollapse")}>
                          <div className="submenu-link-content">
                            <i className="fa fa-server"></i>
                            <span>Sistema</span>
                          </div>
                          <i
                            className={`fa fa-chevron-${
                              collapsedItems.sistemaCollapse ? "up" : "down"
                            }`}
                          />
                        </div>

                        {collapsedItems.sistemaCollapse && (
                          <ul className="sub-submenu">
                            {roleData.usuarios?.read && (
                              <li onClick={() => navigate("/usuarios")}>
                                <i className="fa fa-users"></i>
                                <span>Usuarios</span>
                              </li>
                            )}
                            {roleData.roles?.read && (
                              <li onClick={() => navigate("/roles")}>
                                <i className="fa fa-user-shield"></i>
                                <span>Roles</span>
                              </li>
                            )}
                            {roleData.inactividad?.read && (
                              <li onClick={openInacModal}>
                                <i className="fa fa-clock"></i>
                                <span>Inactividad</span>
                              </li>
                            )}
                          </ul>
                        )}
                      </li>

                      {/* Auditoría */}
                      <li className="submenu-item">
                        <div
                          className="submenu-link has-submenu"
                          onClick={() => toggleCollapse("auditoriaCollapse")}>
                          <div className="submenu-link-content">
                            <i className="fa fa-shield-alt"></i>
                            <span>Auditoría</span>
                          </div>
                          <i
                            className={`fa fa-chevron-${
                              collapsedItems.auditoriaCollapse ? "up" : "down"
                            }`}
                          />
                        </div>

                        {collapsedItems.auditoriaCollapse && (
                          <ul className="sub-submenu">
                            {roleData.auditoria_bitacora?.read && (
                              <li onClick={() => navigate("/auditoria/bitacoras")}>
                                <i className="fa fa-history"></i>
                                <span>Bitácoras</span>
                              </li>
                            )}
                          </ul>
                        )}
                      </li>
                    </ul>
                  )}
                </li>
              )}
            </ul>
          </nav>

          {/* Logout Section */}
          <div className="sidebar-footer">
            <div className="logout-btn" onClick={logout}>
              <i className="fa fa-sign-out-alt"></i>
              {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
            </div>
          </div>
        </div>

        {!isSidebarCollapsed && <Footer />}
      </aside>

      <InactivityModal show={showInacModal} handleClose={closeInacModal} />
    </>
  );
};

export default Sidebar;
