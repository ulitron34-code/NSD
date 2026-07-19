import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getNavigationByRole } from "../navigation/navigationByRole";
import "../styles/tokens.css";
import "../styles/shell.css";

export default function NuxeraShell({ workspaceRole, onExit }) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isEnglish = i18n.language?.startsWith("en");
  const items = getNavigationByRole(workspaceRole, isEnglish);
  const current = items.find((item) => item.path === location.pathname) || items[0];
  const roleLabel = {
    applicant: isEnglish ? "Applicant" : "Solicitante",
    grantor: isEnglish ? "Funding provider" : "Otorgante",
    admin: isEnglish ? "Administrator" : "Administrador",
  }[workspaceRole];
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="nuxera-shell">
      <aside id="nuxera-mobile-navigation" className={`nuxera-sidebar ${mobileOpen ? "is-open" : ""}`} aria-label={isEnglish ? "NUXERA navigation" : "Navegación NUXERA"}>
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
              onClick={closeMobile}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="nuxera-exit" onClick={onExit}>
          {isEnglish ? "Return to current view" : "Volver a vista actual"}
        </button>
      </aside>

      <main className="nuxera-main">
        <header className="nuxera-workspace-header">
          <div className="nuxera-header-primary">
            <button type="button" className="nuxera-mobile-menu" aria-expanded={mobileOpen} aria-controls="nuxera-mobile-navigation" onClick={() => setMobileOpen((value) => !value)}>
              {isEnglish ? "Menu" : "Menú"}
            </button>
            <div>
              <span className="nuxera-breadcrumb">NUXERA / {roleLabel}</span>
              <strong>{current?.label}</strong>
            </div>
          </div>
          <div className="nuxera-header-actions">
            <span className="nuxera-agent-status"><i aria-hidden="true" />{isEnglish ? "Agents guarded" : "Agentes protegidos"}</span>
            <button type="button" onClick={() => i18n.changeLanguage(isEnglish ? "es" : "en")} aria-label={isEnglish ? "Cambiar idioma a español" : "Switch language to English"}>
              {isEnglish ? "ES" : "EN"}
            </button>
            <a href="/contact" className="nuxera-help">{isEnglish ? "Help" : "Ayuda"}</a>
            <span className="nuxera-profile" title={user?.email || roleLabel}>{user?.email || roleLabel}</span>
          </div>
        </header>
        <Outlet />
      </main>
      {mobileOpen && <button type="button" className="nuxera-mobile-backdrop" aria-label={isEnglish ? "Close menu" : "Cerrar menú"} onClick={closeMobile} />}
    </div>
  );
}
