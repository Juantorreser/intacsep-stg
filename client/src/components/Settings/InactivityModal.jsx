import React, {useState, useEffect} from "react";
import {Modal, Button, Form} from "react-bootstrap";

const InactivityModal = ({show, handleClose}) => {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const timeout = 60;
  // Convert the initial timeout from ms to seconds
  const [newTimeout, setNewTimeout] = useState(0);

  const getTimeoutTime = async () => {
    try {
      const response = await fetch(`${baseUrl}/inactividad`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      console.log(data);

      setNewTimeout(data[0].value);
    } catch (e) {
      console.log(e.message);
    }
  };

  const handleSave = () => {
    // Convert the timeout back to milliseconds before saving

    const response = fetch(`${baseUrl}/inactividad`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      credentials: "include",
      body: JSON.stringify({newTimeout}),
    });
    handleClose();
  };

  useEffect(() => {
    // Update the state when the timeout or show prop changes
    getTimeoutTime();
  }, [timeout, show]);

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Configurar tiempo de inactividad</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formTimeout">
            <Form.Label>Tiempo de inactividad (Minutos)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              max={60}
              value={newTimeout}
              onChange={(e) => setNewTimeout(Number(e.target.value))}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleSave}>
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InactivityModal;
