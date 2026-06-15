import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";

export default function Footer({ onNavigate }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleNavClick = (section) => {
    if (onNavigate) onNavigate(section);
  };

  return (
    <footer style={{
      background: COLORS.navy,
      color: COLORS.white,
      padding: "3rem 2rem 1rem",
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "2rem",
          marginBottom: "2rem",
        }}>
          {/* Empresa */}
          <div>
            <h4 style={{ color: COLORS.gold, marginBottom: "1rem", fontWeight: "600" }}>
              {t("footer.companyName")}
            </h4>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", lineHeight: "1.6" }}>
              {t("footer.companyDesc")}
            </p>
          </div>

          {/* Navegación */}
          <div>
            <h4 style={{ color: COLORS.gold, marginBottom: "1rem", fontWeight: "600" }}>
              {t("footer.navTitle")}
            </h4>
            <ul style={{ listStyle: "none" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <a href="#" onClick={() => handleNavClick("inicio")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>
                  {t("footer.nav.home")}
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a href="#" onClick={() => handleNavClick("servicios")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>
                  {t("footer.nav.services")}
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a href="#" onClick={() => handleNavClick("faq")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>
                  {t("footer.nav.faq")}
                </a>
              </li>
              <li>
                <a href="#" onClick={() => navigate("/login")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>
                  {t("footer.nav.access")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ color: COLORS.gold, marginBottom: "1rem", fontWeight: "600" }}>
              {t("footer.legalTitle")}
            </h4>
            <ul style={{ listStyle: "none" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <a onClick={() => navigate("/privacy")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", cursor: "pointer" }}>
                  {t("footer.legal.privacy")}
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a onClick={() => navigate("/terms")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", cursor: "pointer" }}>
                  {t("footer.legal.terms")}
                </a>
              </li>
              <li>
                <a onClick={() => navigate("/contact")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", cursor: "pointer" }}>
                  {t("footer.legal.contact")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 style={{ color: COLORS.gold, marginBottom: "1rem", fontWeight: "600" }}>
              {t("footer.contactTitle")}
            </h4>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              📧 contacto@nsd.mx
            </p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              📍 Ciudad de México
            </p>
          </div>
        </div>

        <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "2rem 0" }} />

        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
          <p>© 2026 NSD International Finance. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
