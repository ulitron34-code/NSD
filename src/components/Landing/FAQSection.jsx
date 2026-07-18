import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { BRAND } from "../../config/brand";

export default function FAQSection() {
  const [openFaq, setOpenFaq] = useState(null);
  const { t } = useTranslation();
  const sections = t("faq.sections", { returnObjects: true, brand: BRAND.name, legalName: BRAND.legalName });

  return (
    <section style={{ padding: "5rem 2rem", background: COLORS.white, minHeight: "80vh" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h2 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "3rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          {t("faq.title")}
        </h2>

        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} style={{ marginBottom: "3rem" }}>
            <h3 style={{
              color: COLORS.navy,
              fontSize: "1.3rem",
              marginBottom: "1.5rem",
              fontWeight: "600",
            }}>
              {section.category}
            </h3>

            <div style={{ display: "grid", gap: "1rem" }}>
              {section.questions.map((faq, idx) => {
                const uniqueId = `${sectionIdx}-${idx}`;
                return (
                  <div key={uniqueId} style={{
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}>
                    <button
                      onClick={() => setOpenFaq(openFaq === uniqueId ? null : uniqueId)}
                      style={{
                        width: "100%",
                        padding: "1.5rem",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <p style={{ color: COLORS.navy, fontWeight: "600", fontSize: "1rem" }}>
                        {faq.q}
                      </p>
                      <span style={{
                        color: COLORS.gold,
                        fontWeight: "700",
                        fontSize: "1.2rem",
                        transition: "transform 0.3s",
                        transform: openFaq === uniqueId ? "rotate(180deg)" : "rotate(0deg)",
                      }}>
                        ▼
                      </span>
                    </button>

                    {openFaq === uniqueId && (
                      <div style={{
                        padding: "1.5rem",
                        background: COLORS.white,
                        borderTop: `1px solid ${COLORS.border}`,
                      }}>
                        <p style={{ color: COLORS.textMuted, lineHeight: "1.6" }}>
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
