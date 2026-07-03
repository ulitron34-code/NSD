import React from "react";
import { COLORS } from "../utils/constants";
import { BRAND } from "../config/brand";
import Footer from "../components/Landing/Footer";

const sections = [
  ["1. Responsable del tratamiento", [
    `${BRAND.productName} / ${BRAND.legalName} sera responsable del tratamiento de datos personales conforme a la legislacion mexicana aplicable en materia de proteccion de datos personales.`,
    "Datos corporativos definitivos, RFC, domicilio fiscal y datos del oficial de privacidad deberan integrarse antes de publicacion comercial."
  ]],
  ["2. Datos que podemos tratar", [
    "Datos de identificacion y contacto: nombre, email, telefono, domicilio, RFC, CURP, identificaciones y datos fiscales.",
    "Datos corporativos: razon social, representantes legales, accionistas, beneficiarios finales, documentos constitutivos, poderes, contratos y evidencia corporativa.",
    "Datos financieros y del proyecto: estados financieros, flujo, deuda, garantias, uso de fondos, documentos de soporte, business plan, pitch deck y data room.",
    "Datos tecnicos: IP, dispositivo, navegador, fecha, hora, eventos de sesion, logs de acceso, acciones en plataforma y bitacoras de auditoria."
  ]],
  ["3. Datos sensibles y biometricos", [
    "Podremos tratar datos sensibles o de alto impacto cuando sean necesarios para identidad, antifraude, cumplimiento, validacion documental, KYC/KYB o servicios profesionales.",
    "Cuando se active biometricos, podran tratarse rostro, prueba de vida, comparacion contra identificacion oficial, huella digital u otras senales de identidad, siempre sujeto a consentimiento y finalidades especificas.",
    "La plataforma debe privilegiar resultados, evidencias y trazabilidad sobre almacenamiento de datos biometricos crudos, salvo que sea necesario y legalmente procedente."
  ]],
  ["4. Finalidades primarias", [
    "Crear y administrar cuentas, ordenes, pagos, expedientes y data rooms.",
    "Prestar servicios profesionales NEXUS y preparar expedientes para credito, inversion, fondeo o revision por otorgantes.",
    "Validar identidad, documentos, cumplimiento, antifraude, KYC/KYB, beneficiario final y requisitos exigibles.",
    "Permitir que otorgantes autorizados revisen data rooms, documentos y revisiones IA preliminares.",
    "Generar bitacoras, auditoria, trazabilidad, evidencia operativa y controles de seguridad."
  ]],
  ["5. IA, automatizacion y analitica", [
    "Podremos usar IA, OCR, reglas automatizadas y analitica para clasificar documentos, detectar faltantes, inconsistencias, vigencias, riesgos o preparar observaciones.",
    "Los resultados automatizados no sustituyen revision humana ni asesoria legal, fiscal, financiera o regulatoria.",
    "Podremos conservar registros de revisiones IA, scores, hallazgos, documentos revisados y fechas para auditoria y mejora del servicio."
  ]],
  ["6. Transferencias y encargados", [
    "Podremos compartir informacion con proveedores de hosting, almacenamiento, pagos, email, seguridad, biometria, analitica, OCR, IA, firma electronica y soporte tecnico.",
    "Podremos transferir o permitir acceso a otorgantes, entidades financieras, asesores, auditores o terceros autorizados por el usuario o por contrato.",
    "Tambien podremos revelar informacion ante requerimientos de autoridades competentes, auditorias, cumplimiento legal, prevencion de fraude o defensa de derechos."
  ]],
  ["7. Seguridad", [
    "Aplicamos medidas administrativas, tecnicas y organizacionales razonables: cifrado en transito, almacenamiento privado, URLs temporales, control de acceso, rate limiting, headers de seguridad y bitacoras.",
    "Ningun sistema es absolutamente invulnerable. En caso de incidente relevante, se activaran procedimientos de contencion, analisis, mitigacion y notificacion conforme corresponda."
  ]],
  ["8. Retencion y eliminacion", [
    "Conservaremos datos durante la relacion comercial y por los plazos necesarios para cumplimiento legal, contractual, auditoria, prevencion de fraude, defensa juridica o requerimientos regulatorios.",
    "El usuario puede solicitar eliminacion, bloqueo o restriccion cuando proceda. Algunos registros, bitacoras o evidencias podran mantenerse por obligacion legal o interes legitimo."
  ]],
  ["9. Derechos ARCO y revocacion", [
    "Puedes ejercer derechos de acceso, rectificacion, cancelacion u oposicion, asi como revocar consentimiento cuando legalmente proceda.",
    "Para solicitudes ARCO escribe a privacidad@nsd.com indicando nombre, medio de contacto, derecho que deseas ejercer y documentos para acreditar identidad o representacion."
  ]],
  ["10. Cambios al aviso", [
    "Podremos modificar este aviso por cambios legales, regulatorios, operativos o tecnologicos. La version vigente estara disponible en la plataforma.",
    "Contacto de privacidad: privacidad@nsd.com. Domicilio, RFC y datos definitivos deberan integrarse antes de publicacion comercial."
  ]]
];

export default function PrivacyPage() {
  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
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

        <p style={{ color: COLORS.textMuted, marginBottom: "1rem" }}>
          Ultima actualizacion: 23 de mayo de 2026
        </p>
        <p style={{ color: COLORS.textMuted, lineHeight: 1.7, marginBottom: "2rem" }}>
          Este aviso es una base operativa para NEXUS Platform y debe ser revisado por asesoria legal antes de su publicacion definitiva.
        </p>

        <div style={{ lineHeight: "1.8", color: COLORS.text }}>
          {sections.map(([title, paragraphs]) => (
            <section key={title}>
              <h2 style={{ color: COLORS.navy, fontSize: "1.3rem", marginTop: "2rem", marginBottom: "1rem" }}>
                {title}
              </h2>
              {paragraphs.map((paragraph) => (
                <p key={paragraph} style={{ marginBottom: "1rem" }}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
