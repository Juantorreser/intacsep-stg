import React, {useEffect, useState} from "react";
import {useAuth} from "../context/AuthContext";
import {useNavigate} from "react-router-dom";

const Login = () => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const navigate = useNavigate(); // Get the navigate function
    const {user, login} = useAuth();
    const [isRegistered, setIsRegistered] = useState(true);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
    });
    const [errorMessage, setErrorMessage] = useState(""); // For feedback messages

    const handleForm = (e) => {
        const {name, value} = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    useEffect(() => {
        console.log(user);
        console.log(isRegistered);
    }, []);

    const registerUser = async (e) => {
        e.preventDefault();
        setErrorMessage(""); // Clear previous error messages

        const response = await fetch(`${baseUrl}/register`, {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.status === 200) {
            setIsRegistered(true);
        } else {
            setErrorMessage(data.message || "Error registering user"); // Set error message
        }
    };

    const loginUser = async (e) => {
        e.preventDefault();
        setErrorMessage(""); // Clear previous error messages

        try {
            await login(formData.email, formData.password);
            navigate("/bitacoras");
        } catch (e) {
            setErrorMessage(e.message || "Email or password incorrect"); // Set error message
        }
    };

    const setForm = () => {
        // Register Form
        if (!isRegistered) {
            return (
                <section id="login">
                    <div className="container col justify-content-center align-items-center">
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
                            <button type="submit" className="btn btn-primary mt-3">
                                Registrarse
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

        // Login Form
        return (
            <section id="login">
                <div className="container col justify-content-center align-items-center">
                    <img src="./logo1.png" alt="logo" width={50} />
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
                        <div className="form-floating">
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
                        <a href="">Olvidaste tu contraseña?</a>
                        <button type="submit" className="btn btn-primary">
                            Iniciar sesión
                        </button>
                        {errorMessage && <p className="text-danger mt-3">{errorMessage}</p>}
                    </form>
                    <p className="mt-3 registerSwitch" onClick={() => setIsRegistered(false)}>
                        Registrarse
                    </p>
                    <p className="opacity-25 mt-5">© Spotynet 2024</p>
                </div>
            </section>
        );
    };

    return <> {setForm()} </>;
};

export default Login;
