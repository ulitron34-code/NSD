import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";

export default function HistorySection() {
  const { t } = useTranslation();
  const timeline = t("history.timeline", { returnObjects: true });
  const team = t("history.team", { returnObjects: true });

  return (
    <section style={{ padding: "5rem 2rem", background: COLORS.white, minHeight: "80vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h2 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "1.5rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          {t("history.title")}
        </h2>

        <div style={{ marginTop: "3rem", marginBottom: "3rem" }}>
          {timeline.map((item, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              gap: "2rem",
              marginBottom: "2rem",
              position: "relative",
            }}>
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: COLORS.gold,
                paddingTop: "0.5rem",
              }}>
                {item.year}
              </div>

              <div style={{
                padding: "1.5rem",
                background: COLORS.bg,
                borderRadius: "8px",
                borderLeft: `4px solid ${COLORS.gold}`,
              }}>
                <h3 style={{ color: COLORS.navy, marginBottom: "0.5rem", fontWeight: "600" }}>
                  {item.title}
                </h3>
                <p style={{ color: COLORS.textMuted, lineHeight: "1.6" }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "3rem" }}>
          <h3 style={{
            color: COLORS.navy, fontSize: "1.8rem", marginBottom: "2rem",
            borderLeft: `4px solid ${COLORS.gold}`, paddingLeft: "1rem",
          }}>
            {t("history.teamTitle")}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
            {team.map((member, i) => (
              <div key={i} style={{
                background: COLORS.white,
                padding: "2rem",
                borderRadius: "8px",
                border: `1px solid ${COLORS.border}`,
                textAlign: "center",
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: COLORS.gold,
                  margin: "0 auto 1rem",
                }} />
                <h4 style={{ color: COLORS.navy, fontWeight: "600", marginBottom: "0.25rem" }}>
                  {member.name}
                </h4>
                <p style={{ color: COLORS.gold, fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                  {member.role}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
