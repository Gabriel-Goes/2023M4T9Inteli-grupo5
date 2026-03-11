import { NavLink } from "react-router-dom";

export const NavBar = () => {
  return (
    <header className="top-nav">
      <div className="brand-block">
        <span className="brand-eyebrow">SITEC / IPT</span>
        <h1>Ibirapitanga Copy</h1>
      </div>

      <nav>
        <NavLink to="/dashboards" className={({ isActive }) => (isActive ? "active" : "")}>Dashboards</NavLink>
        <NavLink to="/showroom" className={({ isActive }) => (isActive ? "active" : "")}>Showroom</NavLink>
        <NavLink to="/devices" className={({ isActive }) => (isActive ? "active" : "")}>Dispositivos</NavLink>
      </nav>
    </header>
  );
};
