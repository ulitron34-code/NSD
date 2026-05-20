import React from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../utils/constants";

export default function Footer({ onNavigate }) {
  const navigate = useNavigate();

  const handleNavClick = (section) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  return (
    <footer style={{
      background: COLORS.navy,
      color: COLORS.white,
      padding: "3rem 2rem 1rem",
    }}>
      <div style={{maxWidth: "1400px", margin: "0 auto"}}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "2rem",
          marginBottom: "2rem",
        }}>
          {/* Empresa */}
          <div>
            <h4 style={{color: COLORS.gold, marginBottom: "1rem", fontWeight: "600"}}>
              NSD International Finance
            </h4>
            <p style={{color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", lineHeight: "1.6"}}>
              Preparamos empresas y proyectos para inversionistas globales.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{color: COLORS.gold, marginBottom: "1rem", fontWeight: "600"}}>
              Navegación
            </h4>
            <ul style={{listStyle: "none"}}>
              <li style={{marginBottom: "0.5rem"}}>
                <a href="#" onClick={() => handleNavClick("inicio")} style={{color: "rgba(255,255,255,0.8)", textDecoration: "none"}}>
                  Inicio
                </a>
              </li>
              <li style={{marginBottom: "0.5rem"}}>
                <a href="#" onClick={() => handleNavClick("servicios")} style={{color: "rgba(255,255,255,0.8)", textDecoration: "none"}}>
                  Servicios
                </a>
              </li>
              <li style={{marginBottom: "0.5rem"}}>
                <a href="#" onClick={() => handleNavClick("faq")} style={{color: "rgba(255,255,255,0.8)", textDecoration: "none"}}>
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" onClick={() => navigate("/login")} style={{color: "rgba(255,255,255,0.8)", textDecoration: "none"}}>
                  Acceso
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{color: COLORS.gold, marginBottom: "1rem", fontWeight: "600"}}>
              Legal
            </h4>
            <ul style={{listStyle: "none"}}>
              <li style={{marginBottom: "0.5rem"}}>
                <a onClick={() => navigate("/privacy")} style={{color: "rgba(255,255,255,0.8)", textDecoration: "none", cursor: "pointer"}}>
                  Privacidad
                </a>
              </li>
              <li style={{marginBottom: "0.5rem"}}>
                <a onClick={() => navigate("/terms")} style={{color: "rgba(255,255,255,0.8)", textDecoration: "none", cursor: "pointer"}}>
                  Términos
                </a>
              </li>
              <li>
                <a onClick={() => navigate("/contact")} style={{color: "rgba(255,255,255,0.8)", textDecoration: "none", cursor: "pointer"}}>
                  Contacto Legal
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 style={{color: COLORS.gold, marginBottom: "1rem", fontWeight: "600"}}>
              Contacto
            </h4>
            <p style={{color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "0.5rem"}}>
              📧 info@nsd.com
            </p>
            <p style={{color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "0.5rem"}}>
              📱 +52 XX XXXX XXXX
            </p>
            <p style={{color: "rgba(255,255,255,0.8)", fontSize: "0.9rem"}}>
              📍 Ciudad de México
            </p>
          </div>
        </div>

        <hr style={{borderColor: "rgba(255,255,255,0.2)", margin: "2rem 0"}} />

        <div style={{textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem"}}>
          <p>© 2026 NSD International Finance. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
