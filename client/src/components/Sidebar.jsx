import React, {useState, useEffect} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import {useAuth} from "../context/AuthContext";
import {useNavigate} from "react-router-dom";
import ProfileModal from "./Profile/ProfilePage";
import InactivityModal from "./Settings/InactivityModal";
import Footer from "./Footer";

const Sidebar = () => {
  const {user, verifyToken, setUser, logout} = useAuth();
  const navigate = useNavigate();
  const [roleData, setRoleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false); // Track initialization
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [showModal, setShowModal] = useState(false);
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const [showInacModal, setShowInacModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const openInacModal = () => setShowInacModal(true);
  const closeInacModal = () => setShowInacModal(false);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken(); // Ensure user is verified
        setUser(data);
        setInitialized(true); // Set initialization as complete
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        navigate("/login");
      } finally {
        setLoading(false); // Set loading to false once initialization is done
      }
    };

    init();
  }, []); // Run only on mount

  useEffect(() => {
    const fetchRolePermissions = async () => {
      if (!user) return; // Ensure user is available before fetching role data

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
    integrationsCollapse: false,
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

  if (loading) {
    return (
      <div className="loading-placeholder text-center py-5 w-full h-full flex items-center justify-center">
        <i className="fa fa-spinner fa-spin me-1" style={{fontSize: "24px"}}></i> Cargando Menu...
      </div>
    ); // Add a loading indicator
  }

  return (
    <>
      <aside id="leftsidebar" className={isSidebarCollapsed ? "collapsed" : ""}>
        <div className="sidebar-wrapper">
          {/* <div className="sidebar-toggle text-end p-2">
            <button
              className="btn btn-sm text-white"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <i className={`fa fa-chevron-${isSidebarCollapsed ? "right" : "left"}`} />
            </button>
          </div> */}

          <div className="user-box" onClick={handleOpenModal}>
            <a className="navbar-brand" href="#">
              <img
                src="/logo1.png"
                alt="Logo"
                width="50"
                className="d-inline-block align-text-top"
              />
              <span className="ms-2">Intacsep</span>
            </a>
            <span className="mt-3">Bienvenido (a)</span>
            <h5>
              {user?.firstName} {user?.lastName}
            </h5>
            {user && (
              <>
                <span>{user.email}</span>
                <span>{user.role}</span>
              </>
            )}
          </div>

          {/* <div className="menu-title">Menú</div> */}
          <div className="scrollable-content">
            <ul className="nav">
              {roleData?.bitacoras?.read && (
                <li className="nav-item">
                  <div
                    className="nav-link-title"
                    onClick={() => toggleCollapse("bitacorasCollapse")}>
                    <div className="d-flex align-items-center">
                      {/* <i className="fa fa-book " /> */}
                      {!isSidebarCollapsed && <span>Monitoreo</span>}
                    </div>
                    <i className={`fa fa-${collapsedItems.bitacorasCollapse ? "minus" : "plus"}`} />
                  </div>

                  {collapsedItems.bitacorasCollapse && (
                    <ul className="submenu">
                      <li onClick={() => navigate("/bitacoras")}>Bitácoras</li>
                    </ul>
                  )}
                </li>
              )}

              {roleData && (
                <li className="nav-item">
                  <div
                    className="nav-link-title"
                    onClick={() => toggleCollapse("settingsCollapse")}>
                    Configuración
                    <i className={`fa fa-${collapsedItems.settingsCollapse ? "minus" : "plus"}`} />
                  </div>

                  {collapsedItems.settingsCollapse && (
                    <ul className="submenu">
                      {/* Catálogos */}
                      <li onClick={() => toggleCollapse("catalogosCollapse")}>
                        Catálogos
                        <i
                          className={`fa fa-${collapsedItems.catalogosCollapse ? "minus" : "plus"}`}
                        />
                      </li>
                      {collapsedItems.catalogosCollapse && (
                        <ul className="submenu">
                          {roleData.tipos_de_monitoreo.read && (
                            <li onClick={() => navigate("/tipos_monitoreo")}>Tipos Monitoreo</li>
                          )}
                          {roleData.eventos.read && (
                            <li onClick={() => navigate("/eventos")}>Eventos</li>
                          )}
                          {roleData.clientes.read && (
                            <li onClick={() => navigate("/clientes")}>Clientes</li>
                          )}
                          {roleData.origenes.read && (
                            <li onClick={() => navigate("/origenes")}>Origenes</li>
                          )}
                          {roleData.destinos.read && (
                            <li onClick={() => navigate("/destinos")}>Destinos</li>
                          )}
                        </ul>
                      )}

                      {/* Sistema */}
                      <li onClick={() => toggleCollapse("sistemaCollapse")}>
                        Sistema
                        <i
                          className={`fa fa-${collapsedItems.sistemaCollapse ? "minus" : "plus"}`}
                        />
                      </li>
                      {collapsedItems.sistemaCollapse && (
                        <ul className="submenu">
                          {roleData.usuarios.read && (
                            <li onClick={() => navigate("/usuarios")}>Usuarios</li>
                          )}
                          {roleData.roles.read && <li onClick={() => navigate("/roles")}>Roles</li>}
                          {roleData.inactividad.read && (
                            <li onClick={openInacModal}>Inactividad</li>
                          )}
                        </ul>
                      )}

                      {/* Auditoría */}
                      <li onClick={() => toggleCollapse("auditoriaCollapse")}>
                        Auditoría
                        <i
                          className={`fa fa-${collapsedItems.auditoriaCollapse ? "minus" : "plus"}`}
                        />
                      </li>
                      {collapsedItems.auditoriaCollapse && (
                        <ul className="submenu">
                          {roleData.auditoria_bitacora.read && (
                            <li onClick={() => navigate("/auditoria/bitacoras")}>Bitácoras</li>
                          )}
                        </ul>
                      )}
                    </ul>
                  )}
                </li>
              )}
            </ul>
          </div>
          <div className="footer-wrapper">
            <div className="logout-title" onClick={logout}>
              <p className="p-0 m-0">Cerrar Sesión</p>
              {/* <i className="fas fa-power-off"></i> */}
            </div>
          </div>
        </div>

        {/* Auditoria Collapsible */}
        <p className="">
          <a
            className="text-white-50 text-decoration-none d-flex justify-content-between align-items-center me-2 itemLine p-0 mb-0"
            role="button"
            onClick={() => toggleCollapse("auditoriaCollapse")}
            style={{fontSize: "0.92rem"}}>
            Auditoria
            <i
              className={`fa ${
                collapsedItems.auditoriaCollapse ? "fa-minus" : "fa-plus"
              } text-white-50 my-auto icon-toggle`}></i>
          </a>
        </p>

        <div className={`collapse mb-2 ${collapsedItems.auditoriaCollapse ? "show" : ""}`}>
          <ul className="nav flex-column w-75 ms-4 gap-2 itemLine2">
            {roleData?.auditoria_bitacora?.read && (
              <li
                className="text-white-50 cursor-pointer"
                onClick={() => navigate("/auditoria/bitacoras")}
                style={{fontSize: "0.85rem"}}>
                Bitacoras
              </li>
            )}
          </ul>
        </div>

        <Footer />
      </aside>

      <InactivityModal show={showInacModal} handleClose={closeInacModal} />
      <ProfileModal showModal={showModal} handleClose={handleCloseModal} />
    </>
  );
};

export default Sidebar;
