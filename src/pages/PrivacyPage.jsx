import React from "react";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

export default function PrivacyPage() {
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
          Aviso de Privacidad
        </h1>

        <p style={{color: COLORS.textMuted, marginBottom: "2rem"}}>
          Última actualización: 19 de Mayo 2026
        </p>

        <div style={{lineHeight: "1.8", color: COLORS.text}}>
          {/* Section 1 */}
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            1. Responsable del Tratamiento de Datos
          </h2>
          <p style={{marginBottom: "1rem"}}>
            <strong>Razón Social:</strong> NSD International Finance<br/>
            <strong>RFC:</strong> [INSERTAR RFC REAL]<br/>
            <strong>Domicilio:</strong> [INSERTAR DOMICILIO]<br/>
            <strong>Email de Privacidad:</strong> privacidad@nsd.com<br/>
            <strong>Teléfono:</strong> +52 XX XXXX XXXX
          </p>

          {/* Section 2 */}
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            2. Datos Personales que Recopilamos
          </h2>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>Nombre completo</li>
            <li style={{marginBottom: "0.5rem"}}>Email</li>
            <li style={{marginBottom: "0.5rem"}}>Teléfono</li>
            <li style={{marginBottom: "0.5rem"}}>RFC/RUC</li>
            <li style={{marginBottom: "0.5rem"}}>Información financiera</li>
            <li style={{marginBottom: "0.5rem"}}>Documentos de identidad</li>
            <li style={{marginBottom: "0.5rem"}}>Historial crediticio</li>
            <li style={{marginBottom: "0.5rem"}}>Dirección IP y datos de navegación</li>
          </ul>

          {/* Section 3 */}
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            3. Finalidades del Tratamiento
          </h2>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>Análisis de solicitudes de financiamiento</li>
            <li style={{marginBottom: "0.5rem"}}>Evaluación de riesgo crediticio</li>
            <li style={{marginBottom: "0.5rem"}}>Cumplimiento regulatorio (KYC/KYB)</li>
            <li style={{marginBottom: "0.5rem"}}>Comunicaciones y soporte</li>
            <li style={{marginBottom: "0.5rem"}}>Mejora de servicios</li>
            <li style={{marginBottom: "0.5rem"}}>Cumplimiento de obligaciones legales</li>
          </ul>

          {/* Section 4 */}
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            4. Transferencias de Datos
          </h2>
          <p style={{marginBottom: "1rem"}}>
            Tus datos pueden ser compartidos con:
          </p>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>SAT (Validación RFC)</li>
            <li style={{marginBottom: "0.5rem"}}>Buró de Crédito</li>
            <li style={{marginBottom: "0.5rem"}}>OFAC (Validación de sanciones)</li>
            <li style={{marginBottom: "0.5rem"}}>Equifax, PEP Database, Experian</li>
            <li style={{marginBottom: "0.5rem"}}>Bancos y fondos de inversión</li>
            <li style={{marginBottom: "0.5rem"}}>Proveedores de servicios (hosting, email)</li>
          </ul>

          {/* Section 5 */}
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            5. Derechos ARCO
          </h2>
          <p style={{marginBottom: "1rem"}}>
            Tienes derecho a:
          </p>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>
              <strong>Acceso:</strong> Conocer qué datos tenemos de ti
            </li>
            <li style={{marginBottom: "0.5rem"}}>
              <strong>Rectificación:</strong> Corregir datos inexactos
            </li>
            <li style={{marginBottom: "0.5rem"}}>
              <strong>Cancelación:</strong> Solicitar eliminación de datos (derecho al olvido)
            </li>
            <li style={{marginBottom: "0.5rem"}}>
              <strong>Oposición:</strong> Rechazar ciertos tratamientos
            </li>
          </ul>
          <p style={{marginBottom: "1rem"}}>
            Para ejercer estos derechos, contacta a: <strong>privacidad@nsd.com</strong>
          </p>

          {/* Section 6 */}
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            6. Medidas de Seguridad
          </h2>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>Encriptación SSL/TLS en tránsito</li>
            <li style={{marginBottom: "0.5rem"}}>Encriptación en reposo</li>
            <li style={{marginBottom: "0.5rem"}}>Servidores seguros en AWS</li>
            <li style={{marginBottom: "0.5rem"}}>Acceso restringido a personal autorizado</li>
            <li style={{marginBottom: "0.5rem"}}>Auditorías de seguridad regulares</li>
            <li style={{marginBottom: "0.5rem"}}>Cumplimiento ISO 27001 (en progreso)</li>
          </ul>

          {/* Section 7 */}
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            7. Retención de Datos
          </h2>
          <ul style={{marginBottom: "1rem", marginLeft: "2rem"}}>
            <li style={{marginBottom: "0.5rem"}}>Datos activos: Mientras seas cliente + 7 años</li>
            <li style={{marginBottom: "0.5rem"}}>Datos después de cancelación: 7 años (por regulación)</li>
            <li style={{marginBottom: "0.5rem"}}>Datos de navegación: 90 días</li>
          </ul>

          {/* Section 8 */}
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            8. Contacto para Privacidad
          </h2>
          <p style={{marginBottom: "1rem"}}>
            <strong>Email:</strong> privacidad@nsd.com<br/>
            <strong>Teléfono:</strong> +52 XX XXXX XXXX<br/>
            <strong>Tiempo de respuesta:</strong> 20 días hábiles
          </p>

          {/* Section 9 */}
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.3rem",
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}>
            9. Cambios a Este Aviso
          </h2>
          <p style={{marginBottom: "1rem"}}>
            Podemos actualizar este aviso en cualquier momento. Te notificaremos por email 
            de cambios significativos. El uso continuado de la plataforma implica aceptación 
            de los cambios.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
