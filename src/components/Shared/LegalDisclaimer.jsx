import React from "react";
import { COLORS } from "../../utils/constants";

export default function LegalDisclaimer() {
  return (
    <section
      style={{
        background: "#F8F7F4",
        border: "1px solid rgba(27,58,92,0.12)",
        borderRadius: "10px",
        padding: "1.75rem 2rem",
        marginTop: "2.5rem",
        maxWidth: "860px",
      }}
    >
      <p
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: COLORS.textMuted,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "0.9rem",
        }}
      >
        AVISO LEGAL — NSD GLOBAL COMPLIANCE PLATFORM
      </p>
      <p
        style={{
          fontSize: "0.85rem",
          color: COLORS.textMuted,
          lineHeight: 1.7,
          marginBottom: "0.75rem",
        }}
      >
        NSD Global Compliance Platform es una solución tecnológica de apoyo para la gestión de información,
        debida diligencia, cumplimiento, riesgo y revisión de expedientes. La plataforma no sustituye el criterio
        profesional, las políticas internas, la asesoría legal local, las obligaciones regulatorias ni las decisiones
        de los órganos facultados de sus clientes.
      </p>
      <p
        style={{
          fontSize: "0.85rem",
          color: COLORS.textMuted,
          lineHeight: 1.7,
          marginBottom: "0.75rem",
        }}
      >
        Los resultados, alertas, puntajes, resúmenes y recomendaciones generados por NSD no constituyen por sí mismos
        una certificación de cumplimiento, aprobación de cliente, dictamen legal, autorización regulatoria,
        recomendación de inversión ni decisión crediticia. Toda decisión debe ser revisada y autorizada por las personas
        responsables de la organización usuaria.
      </p>
      <p
        style={{
          fontSize: "0.85rem",
          color: COLORS.textMuted,
          lineHeight: 1.7,
          marginBottom: "0.75rem",
        }}
      >
        La disponibilidad de verificaciones, registros, listas, noticias, biometría, identificadores fiscales y otras
        fuentes depende de la jurisdicción, cobertura, permisos, calidad de datos, proveedores y módulos contratados.
        NSD identifica qué capacidades se encuentran disponibles, integradas, en prueba o sujetas a configuración.
      </p>
      <p
        style={{
          fontSize: "0.85rem",
          color: COLORS.textMuted,
          lineHeight: 1.7,
        }}
      >
        NSD no es una institución de crédito, no capta recursos del público, no opera como autoridad, no emite
        licencias y no garantiza financiamiento, inversión o aceptación regulatoria.
      </p>
    </section>
  );
}
