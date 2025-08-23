import "./App.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "@fortawesome/fontawesome-free/css/solid.min.css";
import {Route, Routes} from "react-router-dom";
import {SidebarProvider} from "./context/SidebarContext";
import Login from "./components/LoginPage";
import Home from "./components/Home";
import DashboardPage from "./components/DashboardPage";
import AnomaliasDashboardPage from "./components/AnomaliasDashboardPage";
import TiposMonitoreo from "./components/Settings/TiposMonitoreo";
import UsersPage from "./components/Settings/UsersPage";
import UserRolePage from "./components/Settings/RolePage";
import ClientsPage from "./components/Settings/ClientsPage";
import EventsPage from "./components/Settings/EventsPage";
import BitacorasPage from "./components/Bitacoras/BitacorasPage";
import OrigenPage from "./components/Settings/OrigenPage";
import DestinoPage from "./components/Settings/DestinoPage";
import OperadorPage from "./components/Settings/OperadorPage";
import ProfilePage from "./components/Profile/ProfilePage";
import ResetPassword from "./components/ResetPassword";
import WialonTracker from "./components/wialon/WialonTracker";
import WialonUnits from "./components/wialon/WialonUnits";
import BitacoraRouter from "./components/Bitacoras/BitacoraRouter";
import AuditoriasPage from "./components/Auditorias/AuditoriasPage";

function App() {
  return (
    <SidebarProvider>
      <Routes>
        <Route path="/" element={<Login />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/inicio" element={<Home />}></Route>
        <Route path="/dashboard/general" element={<DashboardPage />}></Route>
        <Route path="/dashboard/anomalias" element={<AnomaliasDashboardPage />}></Route>
        <Route path="/bitacoras" element={<BitacorasPage />}></Route>
        <Route path="/bitacora/:id" element={<BitacoraRouter edited={false} />} />
        <Route path="/bitacoras/:id/editada" element={<BitacoraRouter edited={true} />} />
        <Route path="/tipos_monitoreo" element={<TiposMonitoreo />}></Route>
        <Route path="/usuarios" element={<UsersPage />}></Route>
        <Route path="/roles" element={<UserRolePage />}></Route>
        <Route path="/clientes" element={<ClientsPage />}></Route>
        <Route path="/eventos" element={<EventsPage />}></Route>
        <Route path="/origenes" element={<OrigenPage />}></Route>
        <Route path="/destinos" element={<DestinoPage />}></Route>
        <Route path="/operadores" element={<OperadorPage />}></Route>
        <Route path="/perfil" element={<ProfilePage />}></Route>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/wialon" element={<WialonTracker />} />
        <Route path="/units" element={<WialonUnits />} />
        <Route path="/auditoria/bitacoras" element={<AuditoriasPage />} />
      </Routes>
    </SidebarProvider>
  );
}

export default App;
