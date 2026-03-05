import { NavLink } from "react-router-dom";

export const NavBar = () => {
  return (
    <header className="top-nav">
      <div className="brand-block">
        <span className="brand-eyebrow">SITEC / IPT</span>
        <h1>Ibirapitanga Copy</h1>
      </div>

      <nav>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>Dashboard</NavLink>
        <NavLink to="/devices" className={({ isActive }) => (isActive ? "active" : "")}>Dispositivos</NavLink>
      </nav>
    </header>
  );
};
