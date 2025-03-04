import React, {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";

const ResetPassword = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token"); // Extract token from query params

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    console.log(token);

    const response = await fetch(`${baseUrl}/reset-password`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({token, newPassword: password}),
    });

    if (response.ok) {
      navigate("/login");
    } else {
      const data = await response.json();
      setMessage(data.message || "Error resetting password");
    }
  };

  return (
    <section id="resetPwd">
      <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100">
        <img src="./logo1.png" alt="logo" width={80} />
        <p className="text-white">Cambiar Contraseña</p>
        <form
          onSubmit={handleSubmit}
          className="d-flex flex-column justify-content-center align-items-center">
          <div className="form-floating mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label htmlFor="floatingInput">Nueva Contraseña</label>
          </div>
          <div className="form-floating mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label htmlFor="floatingInput">Confirmar Contraseña</label>
          </div>
          {message && <p className="text-danger">{message}</p>}
          <button type="submit" className="btn btn-primary">
            Cambiar Contraseña
          </button>
        </form>
      </div>
    </section>
  );
};

export default ResetPassword;
