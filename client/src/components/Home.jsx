import React, {useEffect} from "react";
import {useAuth} from "../context/AuthContext";
import {useNavigate} from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Home = () => {
  const {user} = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, []);
  return (
    <section id="homeScreen" className="vh-100">
      <Header />
      <div className="d-none d-lg-flex w-[15%] h-100">
        <Sidebar />
      </div>
    </section>
  );
};

export default Home;
