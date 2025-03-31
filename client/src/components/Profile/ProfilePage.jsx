import React, {useState, useEffect} from "react";
import {useAuth} from "../../context/AuthContext";
import {useNavigate} from "react-router-dom";

const ProfileModal = ({showModal, handleClose}) => {
  const {user, verifyToken, setUser} = useAuth();
  const [pwd, setPwd] = useState("");
  const [id, setId] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [modalData, setModalData] = useState({});
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const fetchUser = async () => {
    try {
      const data = await verifyToken();
      setUser(data);
      const response = await fetch(`${baseUrl}/user/${data.email}`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPwd(data.password);
        setId(data._id);
        setModalData({
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        });
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyToken();
        setUser(data);
        setInitialized(true);
      } catch (e) {
        console.log("Error verifying token or fetching user:", e);
        navigate("/login");
      }
    };

    fetchUser();
    init();
  }, []);

  if (!initialized || !user) {
    return <div>Loading...</div>;
  }

  const handleChange = (e) => {
    const {name, value} = e.target;
    setModalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Saving...");
    console.log(id);

    try {
      const response = await fetch(`${baseUrl}/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(modalData),
        credentials: "include",
      });

      if (response.ok) {
        await verifyToken();
        setUser((prevUser) => ({
          ...prevUser,
          firstName: modalData.firstName,
          lastName: modalData.lastName,
          phone: modalData.phone,
        }));
        setShowToast(true);
      } else {
        console.error("Failed to update user:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
    handleClose(); // Close the modal after submission
  };

  return (
    <>
      {showToast && (
        <div className="toast position-fixed bottom-0 end-0 p-3 bg-success" style={{zIndex: 11}}>
          <div className="toast-header">
            <strong className="me-auto">Éxito</strong>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowToast(false)}></button>
          </div>
          <div className="toast-body text-white">Los cambios se han guardado correctamente.</div>
        </div>
      )}

      {showModal && (
        <section id="profileModal">
          <div className="pm-backdrop" onClick={handleClose}></div>
          <div className="pm-container">
            <div className="pm-header">
              <h2>Editar Perfil</h2>
              <button className="pm-close" onClick={handleClose}>
                ×
              </button>
            </div>
            <hr />
            <form className="pm-body" onSubmit={handleSubmit}>
              <label>
                Nombre
                <input
                  type="text"
                  name="firstName"
                  value={modalData.firstName || ""}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Apellido
                <input
                  type="text"
                  name="lastName"
                  value={modalData.lastName || ""}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Teléfono
                <input
                  type="tel"
                  name="phone"
                  value={modalData.phone || ""}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Email
                <input type="text" name="email" value={user.email} disabled />
              </label>
              <label>
                Rol
                <input type="text" name="role" value={user.role} disabled />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  name="password"
                  value={modalData.password || ""}
                  onChange={handleChange}
                  required
                />
              </label>

              <div className="pm-footer">
                <button type="button" className="btn btn-danger" onClick={handleClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </>
  );
};

export default ProfileModal;
