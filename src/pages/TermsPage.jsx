import React from "react";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

export default function TermsPage() {
  return (
    <div style={{background: COLORS.bg, minHeight: "100vh"}}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "4rem 2rem 2rem",
        background: COLORS.white,
        minHeight: "80vh",
      }}>
        <h1 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "1rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          Términos y Condiciones
        </h1>

        <p style={{color: COLORS.textMuted, marginBottom: "2rem"}}>
          Última actualización: 19 de Mayo 2026
        </p>

        <div style={{lineHeight: "1.8", color: COLORS.text}}>
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            1. Aceptación de Términos
          </h2>
          <p style={{marginBottom: "1rem"}}>
            Al acceder y usar la plataforma NSD International Finance, aceptas estos términos. 
            Si no estás de acuerdo, no uses la plataforma.
          </p>

          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            2. Descripción del Servicio
          </h2>
          <p style={{marginBottom: "1rem"}}>
            NSD International Finance proporciona una plataforma de análisis automático de 
            solicitantes de financiamiento, evaluación de riesgo crediticio, y preparación 
            de expedientes para inversionistas. Los análisis son informativos y no constituyen 
            garantía de financiamiento.
          </p>

          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            3. Elegibilidad
          </h2>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>Debes ser mayor de 18 años</li>
            <li style={{marginBottom: "0.5rem"}}>Debes ser residente legal en México o Latinoamérica</li>
            <li style={{marginBottom: "0.5rem"}}>No puedes estar sancionado por OFAC</li>
            <li style={{marginBottom: "0.5rem"}}>Debes proporcionar información veraz</li>
          </ul>

          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            4. Responsabilidades del Usuario
          </h2>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>Proporcionar información veraz y completa</li>
            <li style={{marginBottom: "0.5rem"}}>No usar la plataforma para fines ilícitos</li>
            <li style={{marginBottom: "0.5rem"}}>No compartir tu cuenta con terceros</li>
            <li style={{marginBottom: "0.5rem"}}>No hacer scraping o acceso no autorizado</li>
            <li style={{marginBottom: "0.5rem"}}>Mantener confidencialidad de contraseñas</li>
          </ul>

          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            5. Responsabilidades de NSD
          </h2>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>Proporcionar servicio con máximo esfuerzo</li>
            <li style={{marginBottom: "0.5rem"}}>Mantener confidencialidad de datos</li>
            <li style={{marginBottom: "0.5rem"}}>Cumplir regulaciones aplicables</li>
            <li style={{marginBottom: "0.5rem"}}>
              NO somos responsables de decisiones de lenders, cambios de mercado, o resultados
            </li>
          </ul>

          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            6. Limitación de Responsabilidad
          </h2>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>NSD no es responsable por daños indirectos o consecuentes</li>
            <li style={{marginBottom: "0.5rem"}}>Responsabilidad limitada al monto pagado</li>
            <li style={{marginBottom: "0.5rem"}}>Análisis "tal cual" sin garantías</li>
          </ul>

          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            7. Pagos y Facturación
          </h2>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>Planes mensuales con renovación automática</li>
            <li style={{marginBottom: "0.5rem"}}>Facturación al inicio de cada período</li>
            <li style={{marginBottom: "0.5rem"}}>Período de prueba: 7 días gratuitos</li>
            <li style={{marginBottom: "0.5rem"}}>Reembolsos: No aplica después de 7 días</li>
          </ul>

          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            8. Suspensión o Cancelación
          </h2>
          <p style={{marginBottom: "1rem"}}>
            NSD puede suspender o cancelar tu cuenta si:
          </p>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>Violas estos términos</li>
            <li style={{marginBottom: "0.5rem"}}>Se detecta actividad fraudulenta</li>
            <li style={{marginBottom: "0.5rem"}}>Falta de pago por 30 días</li>
            <li style={{marginBottom: "0.5rem"}}>Requests legales o regulatorios</li>
          </ul>

          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            9. Ley Aplicable y Jurisdicción
          </h2>
          <p style={{marginBottom: "1rem"}}>
            Estos términos se rigen por las leyes de México. 
            Jurisdicción: Tribunales de Ciudad de México.
          </p>

          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            10. Contacto Legal
          </h2>
          <p style={{marginBottom: "1rem"}}>
            <strong>Email Legal:</strong> legal@nsd.com<br/>
            <strong>Teléfono:</strong> +52 XX XXXX XXXX<br/>
            <strong>Dirección:</strong> [INSERTAR]
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
