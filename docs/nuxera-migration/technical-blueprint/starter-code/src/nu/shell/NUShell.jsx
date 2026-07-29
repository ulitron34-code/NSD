import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { navigationByRole } from "../navigation/navigationByRole";
import "./../styles/tokens.css";
import "./../styles/shell.css";

export default function NUShell({ workspaceRole, onExitNU }) {
  const items = navigationByRole[workspaceRole] || navigationByRole.applicant;

  return (
    <div className="nu-shell">
      <aside className="nu-sidebar" aria-label="Navegación principal N&U">
        <div className="nu-brand">
          <strong>N&U</strong>
          <span>Financial Intelligence</span>
        </div>

        <nav className="nu-nav">
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                isActive ? "nu-nav-link is-active" : "nu-nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="nu-exit" onClick={onExitNU}>
          Volver a la vista actual
        </button>
      </aside>

      <main className="nu-main">
        <Outlet />
      </main>
    </div>
  );
}
