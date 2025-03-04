import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import {BrowserRouter} from "react-router-dom";
import {AuthProvider} from "./context/AuthContext.jsx";
import {WialonProvider} from "./context/WialonProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <WialonProvider>
        <App />
      </WialonProvider>
    </AuthProvider>
  </BrowserRouter>
);
