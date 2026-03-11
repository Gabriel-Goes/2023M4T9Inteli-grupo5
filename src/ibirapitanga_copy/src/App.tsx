import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardPage } from "./pages/DashboardPage";
import { DashboardsPage } from "./pages/DashboardsPage";
import { DevicesPage } from "./pages/DevicesPage";
import { NavBar } from "./components/NavBar";

export default function App() {
  return (
    <div className="main-shell">
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboards" replace />} />
        <Route path="/dashboard" element={<Navigate to="/showroom" replace />} />
        <Route path="/dashboards" element={<DashboardsPage />} />
        <Route path="/showroom" element={<DashboardPage />} />
        <Route path="/devices" element={<DevicesPage />} />
      </Routes>
    </div>
  );
}
