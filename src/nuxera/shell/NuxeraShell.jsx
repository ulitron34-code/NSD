import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { navigationByRole } from "../navigation/navigationByRole";
import "../styles/tokens.css";
import "../styles/shell.css";

export default function NuxeraShell({ workspaceRole, onExit }) {
  const items = navigationByRole[workspaceRole] || navigationByRole.applicant;

  return (
    <div className="nuxera-shell">
      <aside className="nuxera-sidebar" aria-label="Navegacion NUXERA">
        <div className="nuxera-brand">
          <strong>NUXERA</strong>
          <span>Financial Intelligence</span>
        </div>

        <nav className="nuxera-nav">
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) => isActive ? "nuxera-nav-link is-active" : "nuxera-nav-link"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="nuxera-exit" onClick={onExit}>
          Volver a vista actual
        </button>
      </aside>

      <main className="nuxera-main">
        <Outlet />
      </main>
    </div>
  );
}