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
  const toggleLanguage = () => {
    const nextLanguage = isEnglish ? "es" : "en";
    i18n.changeLanguage(nextLanguage);
    localStorage.setItem("language", nextLanguage);
  };

  const roleLabel = {
    applicant: isEnglish ? "Applicant" : "Solicitante",
    grantor: isEnglish ? "Funding provider" : "Otorgante",
    admin: isEnglish ? "Administrator" : "Administrador",
  }[workspaceRole];
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="nuxera-shell">
      <aside id="nuxera-mobile-navigation" className={`nuxera-sidebar ${mobileOpen ? "is-open" : ""}`} aria-label={isEnglish ? "NUXERA navigation" : "Navegación NUXERA"}>
        <div className="nuxera-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="logo-mark" aria-hidden="true" style={{
            width: '38px',
            height: '38px',
            border: '1px solid rgba(198, 166, 106, 0.45)',
            borderRadius: '11px',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(145deg, rgba(198, 166, 106, 0.14), rgba(67, 184, 196, 0.04))',
            flexShrink: 0
          }}>
            <svg viewBox="0 0 40 40" fill="none" width="24" height="24">
              <path d="M8 31V9l24 22V9" stroke="#C6A66A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 9l24 22" stroke="#43B8C4" strokeWidth="1" opacity=".7"/>
            </svg>
          </span>
          <div>
            <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', letterSpacing: '2px', color: '#fff' }}>NUXERA</strong>
            <span style={{ display: 'block', fontSize: '0.66rem', letterSpacing: '0.18em', color: 'var(--nuxera-gold)', textTransform: 'uppercase', fontWeight: 700 }}>Financial Intelligence</span>
          </div>
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
            <button type="button" onClick={toggleLanguage} aria-label={isEnglish ? "Cambiar idioma a español" : "Switch language to English"}>
              {isEnglish ? "ES" : "EN"}
            </button>
            <a href="/contact" className="nuxera-help">{isEnglish ? "Help" : "Ayuda"}</a>
            <span className="nuxera-profile" title={user?.email || roleLabel}>{user?.email || roleLabel}</span>
          </div>
        </header>
        <section key={location.pathname} className="nuxera-route-transition" aria-live="polite">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
