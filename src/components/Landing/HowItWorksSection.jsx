import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Icon from "../common/icons";

const STEPS_ES = [
  {
    number: "01",
    icon: "search",
    title: "Diagnóstico",
    desc: "Analizamos tu proyecto, empresa y documentación existente. Identificamos fortalezas, brechas y el perfil de inversionista ideal.",
  },
  {
    number: "02",
    icon: "ruler",
    title: "Estructuración",
    desc: "Preparamos el expediente financiero, narrativa de inversión y cumplimiento regulatorio para que tu proyecto sea presentable ante capital internacional.",
  },
  {
    number: "03",
    icon: "globe",
    title: "Presentación",
    desc: "Te conectamos con nuestra red de 120+ financiadores globales — family offices, fondos de deuda, capital privado y organismos multilaterales.",
  },
];

const STEPS_EN = [
  {
    number: "01",
    icon: "search",
    title: "Diagnosis",
    desc: "We analyze your project, company and existing documentation. We identify strengths, gaps and the ideal investor profile.",
  },
  {
    number: "02",
    icon: "ruler",
    title: "Structuring",
    desc: "We prepare the financial dossier, investment narrative, and regulatory compliance so your project is ready for international capital.",
  },
  {
    number: "03",
    icon: "globe",
    title: "Presentation",
    desc: "We connect you with our network of 120+ global lenders — family offices, debt funds, private equity, and multilateral organizations.",
  },
];

export default function HowItWorksSection() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const steps = i18n.language === "en" ? STEPS_EN : STEPS_ES;
  const isEn = i18n.language === "en";

  return (
    <section style={{ padding: "6rem 2rem", background: "#0F1F2E", position: "relative", overflow: "hidden" }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "800px", height: "400px",
        background: "radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "4.5rem" }}>
          <p style={{
            color: "#C9A84C", fontWeight: 700, fontSize: "0.8rem",
            letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.75rem",
          }}>
            {isEn ? "HOW IT WORKS" : "CÓMO FUNCIONA"}
          </p>
          <h2 style={{
            fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "white", fontWeight: 800,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            {isEn ? "Three steps to your financing" : "Tres pasos hacia tu financiamiento"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", maxWidth: "520px", margin: "1rem auto 0", fontSize: "1.05rem", lineHeight: 1.7 }}>
            {isEn
              ? "A proven process that has helped 500+ projects access international capital."
              : "Un proceso probado que ha ayudado a 500+ proyectos a acceder a capital internacional."}
          </p>
        </div>

        {/* Steps */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                padding: "2.5rem 2rem",
                background: "rgba(15,31,46,0.8)",
                position: "relative",
                transition: "background 0.3s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(27,58,92,0.6)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(15,31,46,0.8)"}
            >
              {/* Connector line between steps */}
              {i < 2 && (
                <div style={{
                  position: "absolute",
                  top: "2.5rem",
                  right: "-1px",
                  width: "1px",
                  height: "40px",
                  background: "linear-gradient(to bottom, rgba(201,168,76,0.4), transparent)",
                  display: "none",
                }} />
              )}

              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "12px",
                  width: "3rem", height: "3rem",
                  flexShrink: 0,
                }}>
                  <Icon name={step.icon} size={24} color="#E4C878" />
                </span>
                <p style={{
                  fontSize: "3rem", fontWeight: 900, lineHeight: 1,
                  color: "rgba(201,168,76,0.15)",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}>
                  {step.number}
                </p>
              </div>

              <h3 style={{
                color: "#E4C878",
                fontWeight: 700,
                fontSize: "1.15rem",
                marginBottom: "0.75rem",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>
                {step.title}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.92rem", lineHeight: 1.75 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA inline */}
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <button
            onClick={() => navigate("/signup")}
            style={{
              padding: "0.9rem 2.5rem", fontWeight: 700, fontSize: "1rem",
              background: "linear-gradient(135deg, #C9A84C, #E4C878)",
              color: "#1B3A5C", border: "none", borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(201,168,76,0.3)",
              transition: "all 0.25s",
            }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 12px 32px rgba(201,168,76,0.45)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 24px rgba(201,168,76,0.3)"; }}
          >
            {isEn ? "Start your diagnosis →" : "Iniciar mi diagnóstico →"}
          </button>
        </div>
      </div>
    </section>
  );
}
