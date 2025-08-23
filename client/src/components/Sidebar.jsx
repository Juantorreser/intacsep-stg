import "bootstrap/dist/js/bootstrap.bundle.min";
import {NavLink} from "react-router-dom";
import {useAuth} from "../context/AuthContext.jsx";
import {useSidebar} from "../context/SidebarContext.jsx";

const Sidebar = () => {
  const {user} = useAuth();
  const {isSidebarCollapsed} = useSidebar();

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

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user?.role || "user"));

  return (
    <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/logoSpoty.png" alt="Logo" className="logo-img" />
          {!isSidebarCollapsed && <span className="logo-text">Intacsep</span>}
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {filteredMenuItems.map((item, index) => (
            <li key={index} className="nav-item">
              <NavLink
                to={item.path}
                className={({isActive}) =>
                  `nav-link ${isActive ? "active" : ""} ${isSidebarCollapsed ? "collapsed" : ""}`
                }
                title={isSidebarCollapsed ? item.label : ""}>
                <i className={`fa ${item.icon}`}></i>
                {!isSidebarCollapsed && <span className="nav-text">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
