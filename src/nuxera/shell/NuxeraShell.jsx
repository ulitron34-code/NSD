import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getNavigationByRole } from "../navigation/navigationByRole";
import "../styles/tokens.css";
import "../styles/shell.css";

export default function NuxeraShell({ workspaceRole, onExit, demoMode, onDemoModeChange }) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isEnglish = i18n.language?.startsWith("en");
  const isDev = import.meta.env.DEV;
  const items = getNavigationByRole(workspaceRole, isEnglish);
  const current = items.find((item) => item.path === location.pathname) || items[0];

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
  const goTo = (path) => {
    closeMobile();
    navigate(path);
    window.setTimeout(() => {
      if (window.location.pathname !== path) {
        window.location.assign(path);
      }
    }, 80);
  };
  const exitToHome = () => {
    if (onExit) {
      onExit();
      window.setTimeout(() => {
        if (window.location.pathname !== "/") {
          window.location.assign("/");
        }
      }, 80);
      return;
    }
    goTo("/");
  };

  return (
    <div className="nuxera-shell" data-nuxera-build="grantor-navigation-rebuild-20260820">
      {mobileOpen && (
        <button
          type="button"
          className="nuxera-mobile-backdrop"
          aria-label={isEnglish ? "Close navigation" : "Cerrar navegacion"}
          onClick={closeMobile}
        />
      )}
      <aside id="nuxera-mobile-navigation" className={`nuxera-sidebar ${mobileOpen ? "is-open" : ""}`} aria-label={isEnglish ? "NUXERA navigation" : "Navegación NUXERA"}>
        <button type="button" className="nuxera-brand" onClick={exitToHome} aria-label={isEnglish ? "Return to main page" : "Volver a la pagina principal"} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        </button>

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

        {/* Vista Selector - Para Testing */}
        {demoMode && onDemoModeChange && (
          <div className="nuxera-demo-switcher" style={{ padding: "1rem", borderTop: "1px solid #e0e0e0" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.5rem", color: "#666" }}>
              {isEnglish ? "Testing View" : "Vista Testing"}
            </label>
            <select
              value={demoMode}
              onChange={(e) => onDemoModeChange(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "2px solid #D4AF37",
                backgroundColor: "#FFFACD",
                color: "#333",
                fontSize: "0.9rem",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              <option value="solicitante">{isEnglish ? "Applicant" : "Solicitante"}</option>
              <option value="otorgante">{isEnglish ? "Funding Provider" : "Otorgante"}</option>
              <option value="nsd_admin">{isEnglish ? "Administrator" : "Admin"}</option>
            </select>
          </div>
        )}
        <button type="button" className="nuxera-exit" onClick={exitToHome}>
          {isEnglish ? "Main page" : "Pagina principal"}
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
            <button type="button" onClick={exitToHome}>
              {isEnglish ? "Main page" : "Pagina principal"}
            </button>
            <button type="button" onClick={toggleLanguage} aria-label={isEnglish ? "Cambiar idioma a español" : "Switch language to English"}>
              {isEnglish ? "ES" : "EN"}
            </button>
            <a href="/contact" className="nuxera-help">{isEnglish ? "Help" : "Ayuda"}</a>
            <span className="nuxera-profile" title={roleLabel}>Demo</span>
          </div>
        </header>
        <section key={location.pathname} className="nuxera-route-transition" aria-live="polite">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
