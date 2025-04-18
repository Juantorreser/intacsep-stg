import React, {useEffect, useState} from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import {createAuditoria} from "../../utils/auditoria";

const AuditoriasPage = () => {
  const [auditorias, setAuditorias] = useState([]);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchAuditorias = async () => {
      try {
        const response = await fetch(`${baseUrl}/auditoria/bitacoras`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setAuditorias(data);
        } else {
          console.error("Failed to fetch auditorias:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching auditorias:", e);
      }
    };

    fetchAuditorias();
  }, [baseUrl]);

  return (
    <section id="auditorias">
      <Header />
      <div className="w-100 d-flex">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="content-wrapper">
          <h1 className="text-center fs-3 fw-semibold text-black">Auditorías</h1>

          {/* Tabla de auditorías */}
          <div className="mx-3 my-4">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Bitácora ID</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Sección</th>
                    <th>Campo</th>
                    <th>Valor Original</th>
                    <th>Valor Nuevo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {auditorias.map((a) => (
                    <tr key={a._id}>
                      <td>{a.tipo}</td>
                      <td>{a.bitacora_id}</td>
                      <td>{a.email}</td>
                      <td>{a.rol}</td>
                      <td>{a.seccion}</td>
                      <td>{a.campo}</td>
                      <td>{a.ValOriginal}</td>
                      <td>{a.ValNuevo}</td>
                      <td>{new Date(a.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuditoriasPage;
