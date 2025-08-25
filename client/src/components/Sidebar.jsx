import {useState, useEffect} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import {useAuth} from "../context/AuthContext";
import {useSidebar} from "../context/SidebarContext";
import {useNavigate} from "react-router-dom";
import ProfileModal from "./Profile/ProfilePage";
import InactivityModal from "./Settings/InactivityModal";
import Footer from "./Footer";

const Sidebar = () => {
  const {user, verifyToken, setUser, logout} = useAuth();
  const {isSidebarCollapsed, toggleSidebar} = useSidebar();
  const navigate = useNavigate();
  const [roleData, setRoleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showModal, setShowModal] = useState(false);
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const [showInacModal, setShowInacModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const openInacModal = () => setShowInacModal(true);
  const closeInacModal = () => setShowInacModal(false);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken();
        setUser(data);
        setInitialized(true);
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const fetchRolePermissions = async () => {
      if (!user) return;

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

    if (initialized) {
      fetchRolePermissions();
    }
  }, [initialized, user, baseUrl]);

  const [collapsedItems, setCollapsedItems] = useState({
    dashboardCollapse: false,
    bitacorasCollapse: false,
    settingsCollapse: false,
    catalogosCollapse: false,
    sistemaCollapse: false,
    auditoriaCollapse: false,
  });

  const toggleCollapse = (item) => {
    setCollapsedItems((prevState) => ({
      ...prevState,
      [item]: !prevState[item],
    }));
  };

  // Handle icon clicks in collapsed state
  const handleIconClick = (action, submenuToExpand = null) => {
    if (isSidebarCollapsed) {
      // Expand sidebar first
      toggleSidebar();

      // If there's a submenu to expand, do it after a short delay
      if (submenuToExpand) {
        setTimeout(() => {
          setCollapsedItems((prev) => ({
            ...prev,
            [submenuToExpand]: true,
          }));
        }, 300); // Wait for sidebar expansion animation
      }
    } else {
      // Execute the original action only if sidebar is not collapsed
      action();
    }
  };

  if (loading) {
    return (
      <div className="sidebar-loading">
        <div className="loading-spinner">
          <i className="fa fa-spinner fa-spin"></i>
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

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
          <div className="user-profile" onClick={handleOpenModal}>
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
      <ProfileModal showModal={showModal} handleClose={handleCloseModal} />
    </>
  );
};

export default Sidebar;
