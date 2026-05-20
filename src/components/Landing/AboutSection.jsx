import React from "react";
import { COLORS } from "../../utils/constants";

export default function AboutSection() {
  return (
    <section style={{padding: "5rem 2rem", background: COLORS.white, minHeight: "80vh"}}>
      <div style={{maxWidth: "1400px", margin: "0 auto"}}>
        <h2 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "1.5rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          Sobre NSD International Finance
        </h2>
        
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "3rem"}}>
          <div>
            <h3 style={{color: COLORS.navy, fontSize: "1.5rem", marginBottom: "1rem"}}>
              ¿Quiénes somos?
            </h3>
            <p style={{color: COLORS.textMuted, lineHeight: "1.8", marginBottom: "1.5rem"}}>
              NSD International Finance es una firma boutique independiente que ayuda a convertir proyectos, 
              empresas y oportunidades de inversión en expedientes financieramente presentables, documentados 
              y defendibles ante fuentes de capital nacionales e internacionales.
            </p>
            <p style={{color: COLORS.textMuted, lineHeight: "1.8"}}>
              Nuestro equipo combina expertise en finanzas corporativas, estructuración de capital, 
              cumplimiento regulatorio y negocios internacionales.
            </p>
          </div>

          <div>
            <h3 style={{color: COLORS.navy, fontSize: "1.5rem", marginBottom: "1rem"}}>
              Nuestra Misión
            </h3>
            <p style={{
              color: COLORS.textMuted,
              lineHeight: "1.8",
              marginBottom: "2rem",
              fontStyle: "italic",
              borderLeft: `4px solid ${COLORS.gold}`,
              paddingLeft: "1rem",
            }}>
              Preparar, estructurar y acompañar empresas, proyectos e inversionistas para lograr 
              financiamientos de calidad, bajo procesos de rigor, cumplimiento y debida diligencia internacional.
            </p>

            <h3 style={{color: COLORS.navy, fontSize: "1.5rem", marginBottom: "1rem"}}>
              Nuestra Visión
            </h3>
            <p style={{
              color: COLORS.textMuted,
              lineHeight: "1.8",
              fontStyle: "italic",
              borderLeft: `4px solid ${COLORS.gold}`,
              paddingLeft: "1rem",
            }}>
              Ser la firma de referencia en México y Latinoamérica para preparación de proyectos 
              de inversión y acceso a capital privado, distinguida por rigor, transparencia y resultados.
            </p>
          </div>
        </div>

        {/* Valores */}
        <div style={{background: COLORS.bg, padding: "2.5rem", borderRadius: "8px", marginBottom: "2rem"}}>
          <h3 style={{color: COLORS.navy, fontSize: "1.3rem", marginBottom: "1.5rem"}}>
            Nuestros Valores
          </h3>
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem"}}>
            {["Rigor Técnico", "Confidencialidad", "Cumplimiento", "Transparencia", "Excelencia", "Independencia"].map((valor, i) => (
              <div key={i} style={{
                background: COLORS.white,
                padding: "1.5rem",
                borderRadius: "6px",
                textAlign: "center",
                borderLeft: `3px solid ${COLORS.gold}`,
              }}>
                <p style={{color: COLORS.navy, fontWeight: "600"}}>{valor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
