import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BRAND } from "../../config/brand";

export default function Header({ isLanding = false }) {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowMenu(false);
  };

  const switchDemoProfile = (mode) => {
    localStorage.setItem("nsd_demo_profile", mode);
    window.dispatchEvent(new CustomEvent("nsd:demo-profile-change", { detail: { mode } }));
    navigate("/dashboard");
    setShowMenu(false);
  };

  const navLinks = [
    { label: t("navbar.home", "Home"), anchor: "/#inicio" },
    { label: t("navbar.about", "About"), anchor: "/#nosotros" },
    { label: t("navbar.profServices", "Services"), anchor: "/services" },
    { label: t("navbar.modules", "Modules"), anchor: "/#servicios" },
    { label: t("navbar.security", "Security"), anchor: "/security" },
    { label: t("navbar.international", "International"), anchor: "/international" },
    { label: t("navbar.prices", "Plans"), anchor: "/#precios" },
    { label: t("navbar.contact", "FAQ"), anchor: "/#faq" },
  ];

  return (
    <header style={{
      background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(250,250,249,0.95)",
      backdropFilter: "blur(20px)",
      borderBottom: `1px solid rgba(10,25,47,${scrolled ? "0.08" : "0.04"})`,
      padding: "0 1.25rem",
      height: scrolled ? "68px" : "78px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "0.75rem",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      transition: "all 0.4s ease",
    }}>
      {/* LEFT: Logo integrado en la barra, grande y sin borde/sombra */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "0.7rem", cursor: "pointer", flexShrink: 0 }}
        onClick={() => navigate("/")}
      >
        <img 
          src="/logo.jpeg" 
          alt={BRAND.logoAlt} 
          style={{
            height: scrolled ? "38px" : "48px",
            width: "auto",
            objectFit: "contain",
            transition: "all 0.4s ease",
            /* Sin borderRadius, sin boxShadow: integrado como marca corporativa */
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", borderLeft: "1px solid rgba(10,25,47,0.12)", paddingLeft: "0.75rem" }}>
          <div style={{ 
            fontSize: scrolled ? "0.82rem" : "0.98rem", 
            fontFamily: "'Playfair Display', serif", 
            fontWeight: 600, 
            color: "var(--navy)", 
            lineHeight: 1.1, 
            transition: "all 0.4s ease" 
          }}>
            {BRAND.productName}
          </div>
          <div style={{ fontSize: "0.55rem", color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "0.2rem", fontWeight: 600, whiteSpace: "nowrap" }}>
            {BRAND.tagline}
          </div>
        </div>
      </div>

      {/* CENTER: Nav links (solo en Landing) */}
      {isLanding && (
        <nav style={{
          display: "flex",
          gap: "clamp(0.35rem, 0.7vw, 0.8rem)",
          alignItems: "center",
          justifyContent: "center",
          flex: "1 1 auto",
          minWidth: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "0 0.25rem",
        }}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              onClick={() => navigate(link.anchor)}
              style={{
                color: "var(--text)",
                textDecoration: "none",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "clamp(0.58rem, 0.68vw, 0.68rem)",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                padding: "0.3rem 0",
                transition: "color 0.2s",
                whiteSpace: "nowrap",
                maxWidth: "9.25rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onMouseEnter={(e) => { e.target.style.color = "var(--gold)"; }}
              onMouseLeave={(e) => { e.target.style.color = "var(--text)"; }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}

      {/* RIGHT: Language selector + Platform/Login Button */}
      <div style={{ display: "flex", gap: "0.55rem", alignItems: "center", flexShrink: 0, minWidth: 0 }}>
        <select
          value={i18n.language}
          onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem("language", e.target.value); }}
          style={{
            padding: "0.35rem 0",
            background: "transparent",
            color: "var(--navy)",
            border: "none",
            borderBottom: "1px solid rgba(10,25,47,0.15)",
            fontWeight: 500,
            cursor: "pointer",
            fontSize: "0.8rem",
            minWidth: "44px",
            outline: "none",
            textTransform: "uppercase"
          }}
        >
          <option value="es">ES</option>
          <option value="en">EN</option>
        </select>

        {isLoggedIn && user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "0.45rem 1rem",
                color: "var(--navy)",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </span>
            </button>

            {showMenu && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                background: "white",
                borderRadius: "4px",
                minWidth: "220px",
                boxShadow: "var(--shadow-md)",
                zIndex: 200,
                border: "1px solid var(--border)",
              }}>
                <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.1rem" }}>
                    {t("messages.session", "Sesion activa")} {user.demo ? "(demo)" : ""}
                  </p>
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", wordBreak: "break-all" }}>{user.email}</p>
                </div>
                <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                    {t("dashboard.sidebar.switchDemo", "Cambiar perfil demo")}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.45rem" }}>
                    {[
                      ["solicitante", t("dashboard.sidebar.applicant", "Solicitante")],
                      ["otorgante", t("dashboard.sidebar.funder", "Otorgante")],
                      ["nsd_admin", t("dashboard.sidebar.admin", "NSD Admin")],
                    ].map(([mode, label]) => {
                      const active = (localStorage.getItem("nsd_demo_profile") || "solicitante") === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => switchDemoProfile(mode)}
                          style={{
                            width: "100%",
                            padding: "0.58rem 0.7rem",
                            border: active ? "1px solid var(--gold)" : "1px solid var(--border)",
                            borderRadius: "4px",
                            background: active ? "rgba(201,168,76,0.16)" : "var(--bg-subtle)",
                            color: "var(--navy)",
                            cursor: "pointer",
                            textAlign: "left",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = active ? "rgba(201,168,76,0.22)" : "rgba(10,25,47,0.04)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = active ? "rgba(201,168,76,0.16)" : "var(--bg-subtle)"; }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {[
                  { label: t("navbar.dashboard", "Dashboard"), action: () => { navigate("/dashboard"); setShowMenu(false); } },
                  { label: t("navbar.servicesFiles", "Servicios / Expedientes"), action: () => { navigate("/service-orders"); setShowMenu(false); } },
                  { label: t("dashboard.perfil", "Mi perfil"), action: () => { navigate("/profile"); setShowMenu(false); } },
                ].map((item) => (
                  <button key={item.label} onClick={item.action} style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: "transparent",
                    color: "var(--navy)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => e.target.style.background = "var(--bg-subtle)"}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                  >
                    {item.label}
                  </button>
                ))}
                <div style={{ height: "1px", background: "var(--border)" }} />
                <button onClick={handleLogout} style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "none",
                  background: "transparent",
                  color: "#C62828",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}>
                  {t("navbar.logout", "Cerrar sesion")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
            {/* Main Button: Compliance Platform / Access */}
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "0.55rem 0.75rem",
                fontWeight: 600,
                fontSize: "0.7rem",
                background: "var(--navy)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                maxWidth: "13rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onMouseEnter={(e) => { e.target.style.background = "var(--gold)"; e.target.style.color = "var(--navy)"; }}
              onMouseLeave={(e) => { e.target.style.background = "var(--navy)"; e.target.style.color = "white"; }}
            >
              {t("navbar.platform", "Access")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
