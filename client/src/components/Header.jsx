import React, {useEffect} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import {useAuth} from "../context/AuthContext";
import Sidebar from "./Sidebar";

const Header = () => {
  const {logout, verifyToken} = useAuth();
  useEffect(() => {
    verifyToken();
  }, []);

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary ps-3 pe-3 pt-2 pb-2 fixed-top">
        <div className="container-fluid">
          <button
            className="btn d-md-block d-lg-none"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasWithBothOptions"
            aria-controls="offcanvasWithBothOptions">
            <a className="navbar-brand text-white" href="#">
              <img
                src="/logo1.png"
                alt="Logo"
                width="30"
                className="d-inline-block align-text-top"
              />
              <span className="ms-2">Intacsep</span>
            </a>
          </button>
          <a className="navbar-brand text-white d-none d-lg-flex" href="#">
            <img src="/logo1.png" alt="Logo" width="30" className="d-inline-block align-text-top" />
            <span className="ms-2">Intacsep</span>
          </a>
          <div className="d-flex flex-row" id="navbarNav">
            <ul className="navbar-nav ms-auto gap-4 d-flex flex-row">
              <li className="nav-item">
                <a className="nav-link active text-white" aria-current="page" href="">
                  <i className="fas fa-envelope"></i>
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link active text-white" aria-current="page" href="">
                  <i className="fas fa-bell"></i>
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link active text-white"
                  aria-current="page"
                  href="#"
                  onClick={logout}>
                  <i className="fas fa-power-off"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div
        className="offcanvas offcanvas-start d-md-none"
        data-bs-scroll="true"
        id="offcanvasWithBothOptions"
        aria-labelledby="offcanvasWithBothOptionsLabel">
        <Sidebar />
      </div>
    </>
  );
};

export default Header;
