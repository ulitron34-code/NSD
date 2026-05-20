import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Header({ isLanding = false }) {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll-aware header
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

  const navLinks = [
    { label: "Inicio",    anchor: "/#inicio" },
    { label: "Nosotros",  anchor: "/#nosotros" },
    { label: "Servicios", anchor: "/#servicios" },
    { label: "Precios",   anchor: "/#precios" },
    { label: "FAQ",       anchor: "/#faq" },
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
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        <div style={{
          width: "38px", height: "38px", borderRadius: "8px",
          background: "linear-gradient(135deg, #C9A84C, #E4C878)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: "0.95rem", color: "#1B3A5C",
          boxShadow: "0 2px 8px rgba(201,168,76,0.4)",
        }}>
          NSD
        </div>
        <div>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "white", lineHeight: 1.2 }}>
            NSD International
          </div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Boutique Finance
          </div>
        </div>
      </div>

      {/* Nav links — Landing only */}
      {isLanding && (
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
        {/* Language toggle */}
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

        {/* User menu */}
        {isLoggedIn && user ? (
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
                background: "white", borderRadius: "10px",
                minWidth: "200px", boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
                zIndex: 200, overflow: "hidden",
                border: "1px solid rgba(27,58,92,0.1)",
              }}>
                <div style={{ padding: "0.75rem 1rem", background: "#F2EFE9", borderBottom: "1px solid rgba(27,58,92,0.08)" }}>
                  <p style={{ fontSize: "0.7rem", color: "#6B6560", marginBottom: "0.1rem" }}>Sesión activa</p>
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1B3A5C", wordBreak: "break-all" }}>{user.email}</p>
                </div>
                {[
                  { label: "🏠 Dashboard", action: () => { navigate("/dashboard"); setShowMenu(false); } },
                  { label: "👤 Mi Perfil",  action: () => { navigate("/profile");   setShowMenu(false); } },
                ].map((item, i) => (
                  <button key={i} onClick={item.action} style={{
                    width: "100%", padding: "0.75rem 1rem", border: "none",
                    background: "transparent", color: "#1B3A5C", cursor: "pointer",
                    textAlign: "left", fontSize: "0.88rem", fontWeight: 500,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.target.style.background = "#F2EFE9"}
                  onMouseLeave={e => e.target.style.background = "transparent"}>
                    {item.label}
                  </button>
                ))}
                <div style={{ height: "1px", background: "rgba(27,58,92,0.08)" }} />
                <button onClick={handleLogout} style={{
                  width: "100%", padding: "0.75rem 1rem", border: "none",
                  background: "transparent", color: "#B45309", cursor: "pointer",
                  textAlign: "left", fontSize: "0.88rem", fontWeight: 600,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.target.style.background = "#FEF3C7"}
                onMouseLeave={e => e.target.style.background = "transparent"}>
                  🚪 Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        ) : (
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
              Entrar
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
              Crear Cuenta
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
