import React, {useState} from "react";
import {useAuth} from "../context/AuthContext";
import {useNavigate} from "react-router-dom";

const Login = () => {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();
  const {login} = useAuth();
  const [isRegistered, setIsRegistered] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  //RESET PWD
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const requestPasswordReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/request-reset-password`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({email: resetEmail}),
      });
      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        setResetSuccess("Email de cambio de contraseña enviado!");
      } else {
        setResetError(data.message || "Error al enviar link");
      }
    } catch (error) {
      setIsLoading(false);
      setResetError("Failed to send reset email");
    }
  };

  const handleForm = (e) => {
    const {name, value} = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const registerUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true); // Set loading state

    const response = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    setIsLoading(false); // Reset loading state

    if (response.status === 200) {
      setIsRegistered(true);
    } else {
      setErrorMessage(data.message || "Error registering user");
    }
  };

  const loginUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true); // Set loading state

    try {
      await login(formData.email, formData.password); // Ensure this throws an error on failure
      // Only navigate if login is successful
      // navigate("/bitacoras");
    } catch (e) {
      // Handle the error and navigate to the appropriate page
      navigate("/"); // Navigate only if there's an error
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  const setForm = () => {
    if (!isRegistered) {
      return (
        <section id="login">
          <div className="container col justify-content-center align-items-center bg-white">
            <img src="./logo1.png" alt="logo" width={50} />
            <p>Registrarse</p>
            <form
              onSubmit={registerUser}
              className="d-flex flex-column justify-content-center align-items-center">
              <div className="form-floating mb-3">
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  id="email"
                  placeholder="name@example.com"
                  required
                  onChange={handleForm}
                  value={formData.email}
                />
                <label htmlFor="email">Email</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  id="firstName"
                  placeholder="nombre"
                  required
                  onChange={handleForm}
                  value={formData.firstName}
                />
                <label htmlFor="firstName">Nombre</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  id="lastName"
                  placeholder="Apellido"
                  required
                  onChange={handleForm}
                  value={formData.lastName}
                />
                <label htmlFor="lastName">Apellidos</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  id="phone"
                  placeholder="Teléfono"
                  required
                  onChange={handleForm}
                  value={formData.phone}
                />
                <label htmlFor="phone">Teléfono</label>
              </div>

              <div className="form-floating">
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  id="password"
                  placeholder="Password"
                  required
                  onChange={handleForm}
                  value={formData.password}
                />
                <label htmlFor="password">Contraseña</label>
              </div>
              <button type="submit" className="btn btn-primary mt-3" disabled={isLoading}>
                {isLoading ? "..." : "Registrarse"}
              </button>
              {errorMessage && <p className="text-danger mt-3">{errorMessage}</p>}
            </form>

            <p className="mt-3 registerSwitch" onClick={() => setIsRegistered(true)}>
              Iniciar sesión
            </p>
            <p className="opacity-25 mt-3">© Spotynet 2024</p>
          </div>
        </section>
      );
    }

    return (
      <section id="login">
        <div className="container col justify-content-center align-items-center">
          <img src="./logo1.png" alt="logo" width={80} />
          <p>Inicio de sesión</p>
          <form
            onSubmit={loginUser}
            className="d-flex flex-column justify-content-center align-items-center">
            <div className="form-floating mb-3">
              <input
                type="email"
                name="email"
                className="form-control"
                id="floatingInput"
                placeholder="name@example.com"
                required
                value={formData.email}
                onChange={handleForm}
              />
              <label htmlFor="floatingInput">Email</label>
            </div>
            <div className="form-floating mb-2">
              <input
                type="password"
                name="password"
                className="form-control"
                id="floatingPassword"
                placeholder="Password"
                required
                value={formData.password}
                onChange={handleForm}
              />
              <label htmlFor="floatingPassword">Contraseña</label>
            </div>
            <p id="errorMsg" className="text-danger m-1 visually-hidden">
              Email o Contraseña incorrectos. Intente de nuevo
            </p>
            <a href="" className="mt-0">
              Olvidaste tu contraseña?
            </a>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Iniciando Sesión ..." : "Iniciar sesión"}
            </button>
          </form>
          <a
            href="https://www.spotynet.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-25 mt-5">
            Powered by © Spotynet 2024
          </a>
        </div>
      </section>
    );
  };

  return (
    <section id="login">
      <div className="col justify-content-center align-items-center ">
        {isResettingPassword ? (
          <div className="flex flex-col justify-content-center align-items-center p-5 text-center loginCard">
            <img src="./logo1.png" alt="logo" width={80} />
            <p>Cambiar Contraseña</p>
            <form
              onSubmit={requestPasswordReset}
              className="d-flex flex-column justify-content-center align-items-center">
              <div className="form-floating mb-3">
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="name@example.com"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <label htmlFor="floatingInput">Email</label>
              </div>
              {resetError && <p className="text-danger">{resetError}</p>}
              {resetSuccess && <p className="text-success">{resetSuccess}</p>}
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? "Cargando..." : "Recuperar"}
              </button>
              <button
                type="button"
                className="btn btn-link mt-3"
                onClick={() => setIsResettingPassword(false)}>
                Volver a Inicio de Sesión
              </button>
            </form>
          </div>
        ) : (
          <div className=" flex flex-col justify-content-center align-items-center w-full p-5 text-center loginCard">
            <img src="./logo1.png" alt="logo" width={80} />
            <p>Inicio de sesión</p>
            <form
              onSubmit={loginUser}
              className="d-flex flex-column justify-content-center align-items-center mb-5 pb-3">
              <div className="form-floating mb-3">
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  id="floatingInput"
                  placeholder="name@example.com"
                  required
                  value={formData.email}
                  onChange={handleForm}
                />
                <label htmlFor="floatingInput">Email</label>
              </div>
              <div className="form-floating mb-2">
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  id="floatingPassword"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={handleForm}
                />
                <label htmlFor="floatingPassword">Contraseña</label>
              </div>
              <p id="errorMsg" className="text-danger m-1 visually-hidden">
                Email o Contraseña incorrectos. Intente de nuevo
              </p>
              <a
                href=""
                className="mt-0"
                onClick={(e) => {
                  e.preventDefault();
                  setIsResettingPassword(true);
                }}>
                Olvidaste tu contraseña?
              </a>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? "Iniciando Sesión ..." : "Iniciar sesión"}
              </button>
            </form>
            <a
              href="https://www.spotynet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-25 mt-5 pt-5">
              Powered by © Spotynet 2024 on AWS
            </a>
          </div>
        )}
      </div>
      <div className="backdrop"></div>
    </section>
  );
};

export default Login;
