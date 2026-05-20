import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Hero() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [counter, setCounter] = useState({ projects: 0, success: 0, lenders: 0 });

  // Animated counters
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
    { value: `${counter.projects}+`, label: "Proyectos Estructurados" },
    { value: `${counter.success}%`,  label: "Tasa de Éxito" },
    { value: `${counter.lenders}+`,  label: "Lenders Globales" },
  ];

  return (
    <section style={{
      background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 55%, #2A527A 100%)",
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
      {/* Background decoration */}
      <div style={{
        position: "absolute", top: "-20%", right: "-10%",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "-10%",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(42,82,122,0.4) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center", position: "relative" }}>
        {/* Eyebrow tag */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)",
          borderRadius: "999px", padding: "0.4rem 1.1rem",
          fontSize: "0.8rem", fontWeight: 600, color: "#E4C878",
          letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "2rem",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4CAF50", display: "inline-block" }} />
          Plataforma Activa — Fintech Boutique
        </div>

        <h1 style={{
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          fontWeight: 800, lineHeight: 1.1,
          marginBottom: "1.5rem", color: "white",
        }}>
          {t("hero.title") || "Estructura, presenta y financia"}<br />
          <span style={{ color: "#C9A84C" }}>proyectos de alto impacto</span>
        </h1>

        <p style={{
          fontSize: "clamp(1rem, 2vw, 1.2rem)",
          maxWidth: "700px", margin: "0 auto 3rem",
          color: "rgba(255,255,255,0.75)", lineHeight: 1.8,
        }}>
          {t("hero.description") || "Conectamos empresas y proyectos con inversionistas internacionales mediante análisis automatizado, cumplimiento regulatorio y una red de 120+ lenders globales."}
        </p>

        {/* CTAs */}
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
            Comenzar Ahora →
          </button>
          <button
            onClick={() => navigate("/contact")}
            style={{
              padding: "0.9rem 2.5rem", fontSize: "1rem", fontWeight: 600,
              background: "rgba(255,255,255,0.07)", color: "white",
              border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: "8px",
              cursor: "pointer", backdropFilter: "blur(8px)",
              transition: "all 0.25s",
            }}
            onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.14)"; e.target.style.borderColor = "rgba(255,255,255,0.5)"; }}
            onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.07)"; e.target.style.borderColor = "rgba(255,255,255,0.25)"; }}
          >
            Hablar con un Experto
          </button>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          overflow: "hidden", backdropFilter: "blur(12px)",
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              padding: "1.75rem",
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.1)" : "none",
              textAlign: "center",
            }}>
              <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "#E4C878", lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginTop: "0.5rem", letterSpacing: "0.04em" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
