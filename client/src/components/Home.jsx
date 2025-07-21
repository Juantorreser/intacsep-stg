import React, {useEffect} from "react";
import {useAuth} from "../context/AuthContext";
import {useSidebar} from "../context/SidebarContext";
import {useNavigate} from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Home = () => {
  const {user} = useAuth();
  const {isSidebarCollapsed} = useSidebar();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, []);

  return (
    <section id="homeScreen" className="vh-100">
      <div className="d-none d-lg-flex w-[15%] h-100">
        <Sidebar />
      </div>
      <div className={`content-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Header />
        {/* Your main content goes here */}
      </div>
    </section>
  );
};

export default Home;
