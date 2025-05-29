import React, {useState, useEffect} from "react";
import ModalTemplate from "../ModalTemplate";

const InactivityModal = ({show, handleClose}) => {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [newTimeout, setNewTimeout] = useState(0);

  const getTimeoutTime = async () => {
    try {
      const response = await fetch(`${baseUrl}/inactividad`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      setNewTimeout(data[0].value);
    } catch (e) {
      console.error("Error fetching timeout:", e.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${baseUrl}/inactividad`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({newTimeout}),
      });
      handleClose();
    } catch (e) {
      console.error("Error saving timeout:", e.message);
    }
  };

  useEffect(() => {
    if (show) getTimeoutTime();
  }, [show]);

  return (
    <ModalTemplate
      show={show}
      title="Configurar tiempo de inactividad"
      onClose={handleClose}
      onSubmit={handleSave}>
      <label>
        Tiempo de inactividad (Minutos)
        <input
          type="number"
          min={0}
          max={60}
          value={newTimeout}
          onChange={(e) => setNewTimeout(Number(e.target.value))}
          required
        />
      </label>
    </ModalTemplate>
  );
};

export default InactivityModal;
