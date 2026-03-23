import "bootstrap/dist/js/bootstrap.bundle.min";
import React, {useState, useEffect} from "react";
import {useAuth} from "../context/AuthContext.jsx";
import {useSidebar} from "../context/SidebarContext.jsx";
import {useNavigate} from "react-router-dom";
import Sidebar from "./Sidebar";

const Header = () => {
  const {user, logout} = useAuth();
  const {isSidebarCollapsed, toggleSidebar} = useSidebar();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? "Expandir sidebar" : "Contraer sidebar"}>
            <i className={`fa fa-${isSidebarCollapsed ? "bars" : "times"}`}></i>
          </button>
          <div className="header-title">
            <h1 className="m-0">Intacsep</h1>
          </div>
        </div>
        <div className="header-right">
          <div className="header-info">
            <div className="current-time">
              <i className="fa fa-clock me-2"></i>
              {currentTime.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
            <div className="user-info">
              <span className="user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
                <i className="fa fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
