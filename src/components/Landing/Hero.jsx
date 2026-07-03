import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";

export default function Hero() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [counter, setCounter] = useState({ projects: 0, success: 0, lenders: 0 });

  useEffect(() => {
    const targets = { projects: 500, success: 98, lenders: 120 };
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounter({
        projects: Math.floor(targets.projects * ease),
        success: Math.floor(targets.success * ease),
        lenders: Math.floor(targets.lenders * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { value: `${counter.projects}+`, label: t("hero.stat1Label") },
    { value: `${counter.success}%`,  label: t("hero.stat2Label") },
    { value: `${counter.lenders}+`,  label: t("hero.stat3Label") },
  ];

  return (
    <section style={{
      color: "white",
      padding: "7rem 2rem 5rem",
      minHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(/hero-bg.jpg)",
        backgroundSize: "cover", backgroundPosition: "center",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(15,31,46,0.86) 0%, rgba(27,58,92,0.68) 55%, rgba(42,82,122,0.5) 100%)",
        zIndex: 1,
      }} />
      <div style={{
        position: "absolute", top: "-20%", right: "-10%",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 2,
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "-10%",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(42,82,122,0.35) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 2,
      }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 3 }}>
        <div style={{
          background: "rgba(249,247,242,0.74)",
          borderRadius: "20px",
          padding: "3rem 3.5rem",
          boxShadow: COLORS.shadowLg,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          textAlign: "center",
        }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)",
          borderRadius: "999px", padding: "0.4rem 1.1rem",
          fontSize: "0.8rem", fontWeight: 600, color: "#9C7A24",
          letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "2rem",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4CAF50", display: "inline-block" }} />
          {t("hero.badge")}
        </div>

        <h1 style={{
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          fontWeight: 800, lineHeight: 1.1,
          marginBottom: "1.5rem", color: COLORS.navy,
        }}>
          {t("hero.title")}<br />
          <span style={{ color: "#C9A84C" }}>{t("hero.titleHighlight")}</span>
        </h1>

        <p style={{
          fontSize: "clamp(1rem, 2vw, 1.2rem)",
          maxWidth: "700px", margin: "0 auto 3rem",
          color: COLORS.textMuted, lineHeight: 1.8,
        }}>
          {t("hero.description")}
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "5rem" }}>
          <button
            onClick={() => navigate("/signup")}
            style={{
              padding: "0.9rem 2.5rem", fontSize: "1rem", fontWeight: 700,
              background: "linear-gradient(135deg, #C9A84C, #E4C878)",
              color: "#1B3A5C", border: "none", borderRadius: "8px",
              cursor: "pointer", letterSpacing: "0.01em",
              boxShadow: "0 8px 24px rgba(201,168,76,0.4)",
              transition: "all 0.25s",
            }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 12px 32px rgba(201,168,76,0.5)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 24px rgba(201,168,76,0.4)"; }}
          >
            {t("hero.cta1")}
          </button>
          <button
            onClick={() => navigate("/contact")}
            style={{
              padding: "0.9rem 2.5rem", fontSize: "1rem", fontWeight: 600,
              background: "rgba(27,58,92,0.05)", color: COLORS.navy,
              border: `1.5px solid rgba(27,58,92,0.2)`, borderRadius: "8px",
              cursor: "pointer", transition: "all 0.25s",
            }}
            onMouseEnter={e => { e.target.style.background = "rgba(27,58,92,0.1)"; e.target.style.borderColor = "rgba(27,58,92,0.4)"; }}
            onMouseLeave={e => { e.target.style.background = "rgba(27,58,92,0.05)"; e.target.style.borderColor = "rgba(27,58,92,0.2)"; }}
          >
            {t("hero.cta2")}
          </button>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(27,58,92,0.1)",
          borderRadius: "16px",
          overflow: "hidden",
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              padding: "1.75rem",
              borderRight: i < 2 ? "1px solid rgba(27,58,92,0.1)" : "none",
              textAlign: "center",
            }}>
              <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "#9C7A24", lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: "0.82rem", color: COLORS.textMuted, marginTop: "0.5rem", letterSpacing: "0.04em" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
