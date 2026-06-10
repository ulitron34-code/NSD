import React from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../utils/constants";
import { BRAND } from "../../config/brand";

export default function Footer({ onNavigate }) {
  const navigate = useNavigate();

  const handleNavClick = (section) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  return (
    <footer style={{
      background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 58%, #2A527A 100%)",
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
          <div>
            <h4 style={{ color: COLORS.gold, marginBottom: "1rem", fontWeight: "600" }}>
              {BRAND.productName}
            </h4>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", lineHeight: "1.6" }}>
              {BRAND.category} and professional services by {BRAND.shortName} for credit, capital and institutional funding.
            </p>
          </div>

          <div>
            <h4 style={{ color: COLORS.gold, marginBottom: "1rem", fontWeight: "600" }}>
              Navigation
            </h4>
            <ul style={{ listStyle: "none" }}>
              {[
                { label: "Home", section: "inicio" },
                { label: "Modules", section: "servicios" },
                { label: "FAQ", section: "faq" },
              ].map((item) => (
                <li key={item.label} style={{ marginBottom: "0.5rem" }}>
                  <a href="#" onClick={() => handleNavClick(item.section)} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#" onClick={() => navigate("/login")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>
                  Access
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: COLORS.gold, marginBottom: "1rem", fontWeight: "600" }}>
              Platform
            </h4>
            <ul style={{ listStyle: "none" }}>
              {[
                { label: "Applicants", path: "/for-applicants" },
                { label: "Funders", path: "/for-funders" },
                { label: "International", path: "/international" },
                { label: "Security", path: "/security" },
              ].map((item) => (
                <li key={item.label} style={{ marginBottom: "0.5rem" }}>
                  <a onClick={() => navigate(item.path)} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", cursor: "pointer" }}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: COLORS.gold, marginBottom: "1rem", fontWeight: "600" }}>
              Legal
            </h4>
            <ul style={{ listStyle: "none" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <a onClick={() => navigate("/privacy")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", cursor: "pointer" }}>
                  Privacy
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a onClick={() => navigate("/terms")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", cursor: "pointer" }}>
                  Terms
                </a>
              </li>
              <li>
                <a onClick={() => navigate("/contact")} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", cursor: "pointer" }}>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: COLORS.gold, marginBottom: "1rem", fontWeight: "600" }}>
              Contact
            </h4>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              {BRAND.contactEmail}
            </p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              {BRAND.contactPhone}
            </p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
              {BRAND.location}
            </p>
          </div>
        </div>

        <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "2rem 0" }} />

        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
          <p>© 2026 {BRAND.productName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
