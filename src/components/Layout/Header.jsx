import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BRAND } from "../../config/brand";
import { COLORS } from "../../utils/constants";
import Icon from "../common/icons";

export default function Header({ isLanding = false }) {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowMenu(false);
    setShowMobileNav(false);
  };

  const navLinks = [
    { label: t("navbar.home"),         anchor: "/" },
    { label: t("navbar.platform"),     anchor: "/plataforma" },
    { label: t("navbar.coverage"),     anchor: "/cobertura-global" },
    { label: t("navbar.industries"),   anchor: "/industrias" },
    { label: t("navbar.integrations"), anchor: "/integraciones" },
    { label: t("navbar.modalities"),   anchor: "/modalidades" },
  ];

  const linkStyle = {
    color: "rgba(255,255,255,0.85)",
    textDecoration: "none",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.88rem",
    letterSpacing: "0.01em",
    padding: "0.3rem 0",
    borderBottom: "2px solid transparent",
    transition: "all 0.2s",
  };

  return (
    <>
      <header style={{
        background: scrolled
          ? "rgba(15,31,46,0.97)"
          : "linear-gradient(180deg, rgba(15,31,46,0.95) 0%, rgba(27,58,92,0.9) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        color: "white",
        padding: "0 2rem",
        height: "72px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.3)" : "none",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        transition: "all 0.3s",
      }}>
        {/* Logo */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.7rem", cursor: "pointer" }}
          onClick={() => { navigate("/"); setShowMobileNav(false); }}
        >
          {BRAND.logoMarkSrc ? (
            <>
              <img
                src={BRAND.logoMarkSrc}
                alt={BRAND.logoAlt}
                style={{ height: "52px", width: "auto", display: "block" }}
              />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
                <span style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "#D9BB6B",
                }}>
                  {BRAND.name}
                </span>
                <span style={{
                  fontSize: "0.56rem",
                  fontWeight: 500,
                  letterSpacing: "0.16em",
                  color: "rgba(217,187,107,0.75)",
                  textTransform: "uppercase",
                }}>
                  {BRAND.tagline}
                </span>
              </div>
            </>
          ) : (
            <img
              src={BRAND.logoSrc}
              alt={BRAND.logoAlt}
              style={{ height: "68px", width: "auto", display: "block" }}
            />
          )}
        </div>

        {/* Nav links — desktop only */}
        {isLanding && !isMobile && (
          <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            {navLinks.map((link) => (
              <a
                key={link.label}
                onClick={() => navigate(link.anchor)}
                style={linkStyle}
                onMouseEnter={e => { e.target.style.color = "#E4C878"; e.target.style.borderBottomColor = "#C9A84C"; }}
                onMouseLeave={e => { e.target.style.color = "rgba(255,255,255,0.85)"; e.target.style.borderBottomColor = "transparent"; }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {/* Language toggle — hidden on very small screens */}
          {!isMobile && (
            <select
              value={i18n.language}
              onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem("language", e.target.value); }}
              style={{
                padding: "0.4rem 0.6rem",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "6px",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "0.82rem",
                outline: "none",
              }}
            >
              <option value="es" style={{ background: "#1B3A5C" }}>🇲🇽 ES</option>
              <option value="en" style={{ background: "#1B3A5C" }}>🇺🇸 EN</option>
            </select>
          )}

          {/* User menu — desktop */}
          {!isMobile && isLoggedIn && user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px", padding: "0.45rem 0.875rem",
                  color: "white", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              >
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #C9A84C, #E4C878)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontWeight: 800, color: "#1B3A5C",
                }}>
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
                <span style={{ opacity: 0.5, fontSize: "0.65rem" }}>▼</span>
              </button>

              {showMenu && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "white", borderRadius: "14px",
                  minWidth: "200px", boxShadow: COLORS.shadowLg,
                  zIndex: 200, overflow: "hidden",
                  border: "1px solid rgba(27,58,92,0.1)",
                }}>
                  <div style={{ padding: "0.75rem 1rem", background: "#F2EFE9", borderBottom: "1px solid rgba(27,58,92,0.08)" }}>
                    <p style={{ fontSize: "0.7rem", color: "#6B6560", marginBottom: "0.1rem" }}>{t("dashboard.sesionActiva")}</p>
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1B3A5C", wordBreak: "break-all" }}>{user.email}</p>
                  </div>
                  {[
                    { icon: "home", label: t("dashboard.title"), action: () => { navigate("/dashboard"); setShowMenu(false); } },
                    { icon: "user", label: t("dashboard.miPerfil"),  action: () => { navigate("/profile");   setShowMenu(false); } },
                  ].map((item, i) => (
                    <button key={i} onClick={item.action} style={{
                      width: "100%", padding: "0.75rem 1rem", border: "none",
                      background: "transparent", color: "#1B3A5C", cursor: "pointer",
                      textAlign: "left", fontSize: "0.88rem", fontWeight: 500,
                      display: "flex", alignItems: "center", gap: "0.6rem",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F2EFE9"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <Icon name={item.icon} size={16} color="#1B3A5C" />
                      {item.label}
                    </button>
                  ))}
                  <div style={{ height: "1px", background: "rgba(27,58,92,0.08)" }} />
                  <button onClick={handleLogout} style={{
                    width: "100%", padding: "0.75rem 1rem", border: "none",
                    background: "transparent", color: "#B45309", cursor: "pointer",
                    textAlign: "left", fontSize: "0.88rem", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FEF3C7"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Icon name="logout" size={16} color="#B45309" />
                    {t("dashboard.cerrarSesion")}
                  </button>
                </div>
              )}
            </div>
          ) : !isMobile && (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "0.5rem 1.1rem", fontWeight: 500, fontSize: "0.88rem",
                  background: "transparent", color: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => e.target.style.borderColor = "rgba(255,255,255,0.5)"}
                onMouseLeave={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
              >
                {t("navbar.login")}
              </button>
              <button
                onClick={() => navigate("/signup")}
                style={{
                  padding: "0.5rem 1.25rem", fontWeight: 700, fontSize: "0.88rem",
                  background: "linear-gradient(135deg, #C9A84C, #E4C878)",
                  color: "#1B3A5C", border: "none", borderRadius: "6px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(201,168,76,0.35)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.target.style.boxShadow = "0 4px 14px rgba(201,168,76,0.5)"}
                onMouseLeave={e => e.target.style.boxShadow = "0 2px 8px rgba(201,168,76,0.35)"}
              >
                {t("navbar.signup")}
              </button>
            </div>
          )}

          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                padding: "0.5rem 0.7rem",
                fontSize: "1.2rem",
                lineHeight: 1,
              }}
            >
              {showMobileNav ? "✕" : "☰"}
            </button>
          )}
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {isMobile && showMobileNav && (
        <div style={{
          position: "fixed",
          top: "72px",
          left: 0,
          right: 0,
          background: "rgba(15,31,46,0.98)",
          backdropFilter: "blur(16px)",
          zIndex: 999,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "1rem 0 1.5rem",
        }}>
          {/* Language toggle */}
          <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "0.5rem" }}>
            <select
              value={i18n.language}
              onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem("language", e.target.value); }}
              style={{
                padding: "0.4rem 0.6rem",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "6px",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "0.82rem",
                outline: "none",
              }}
            >
              <option value="es" style={{ background: "#1B3A5C" }}>🇲🇽 ES</option>
              <option value="en" style={{ background: "#1B3A5C" }}>🇺🇸 EN</option>
            </select>
          </div>

          {/* Nav links */}
          {isLanding && navLinks.map((link) => (
            <a
              key={link.label}
              onClick={() => { navigate(link.anchor); setShowMobileNav(false); }}
              style={{
                display: "block",
                padding: "0.9rem 1.5rem",
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 500,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {link.label}
            </a>
          ))}

          {/* Auth buttons */}
          {isLoggedIn && user ? (
            <>
              <button onClick={() => { navigate("/dashboard"); setShowMobileNav(false); }}
                style={{ width: "100%", padding: "0.9rem 1.5rem", background: "transparent", border: "none", color: "rgba(255,255,255,0.85)", cursor: "pointer", textAlign: "left", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Icon name="home" size={17} color="rgba(255,255,255,0.85)" />
                {t("dashboard.title")}
              </button>
              <button onClick={handleLogout}
                style={{ width: "100%", padding: "0.9rem 1.5rem", background: "transparent", border: "none", color: "#E4C878", cursor: "pointer", textAlign: "left", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Icon name="logout" size={17} color="#E4C878" />
                {t("dashboard.cerrarSesion")}
              </button>
            </>
          ) : (
            <div style={{ padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button onClick={() => { navigate("/login"); setShowMobileNav(false); }}
                style={{ padding: "0.75rem", fontWeight: 600, background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem" }}>
                {t("navbar.login")}
              </button>
              <button onClick={() => { navigate("/signup"); setShowMobileNav(false); }}
                style={{ padding: "0.75rem", fontWeight: 700, background: "linear-gradient(135deg, #C9A84C, #E4C878)", color: "#1B3A5C", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem" }}>
                {t("navbar.signup")}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
