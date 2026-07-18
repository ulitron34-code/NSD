import React from "react";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";
import LegalDisclaimer from "../components/Shared/LegalDisclaimer";
import { BRAND } from "../config/brand";

const sections = [
  ["1. Aceptacion de terminos", [
    `Al acceder y usar ${BRAND.productName} aceptas estos terminos. Si actuas por cuenta de una empresa, declaras tener facultades suficientes para obligarla.`,
    `${BRAND.name} puede actualizar estos terminos para reflejar cambios legales, operativos o tecnologicos. La version vigente estara disponible en la plataforma.`
  ]],
  ["2. Descripcion del servicio", [
    `${BRAND.productName} combina herramientas SaaS de cumplimiento, data room, revision documental, servicios profesionales ${BRAND.name} y flujos para solicitantes y otorgantes.`,
    "La plataforma puede apoyar en preparacion de expedientes, business plan, analisis financiero, pitch deck, revision de requisitos, trazabilidad y acceso controlado para entidades financieras."
  ]],
  ["3. Documentos, expediente y data room", [
    "El usuario puede cargar documentos financieros, legales, fiscales, corporativos, personales o del proyecto. El usuario es responsable de que dichos documentos sean autenticos, completos, vigentes y legalmente obtenidos.",
    `${BRAND.name} puede revisar completitud, consistencia, formato, vigencia aparente y trazabilidad documental. ${BRAND.name} no garantiza la veracidad material de la informacion ni sustituye la debida diligencia de bancos, fondos, SOFOMES, fintechs, autoridades o asesores externos.`,
    "Los accesos al data room pueden compartirse con otorgantes autorizados. El usuario reconoce que compartir un expediente implica permitir que el destinatario revise documentos, estados y resultados preliminares asociados."
  ]],
  ["4. Uso de IA y resultados automatizados", [
    `${BRAND.name} puede usar herramientas de IA, OCR, reglas de negocio o agentes automatizados para clasificar documentos, detectar faltantes, generar score preliminar, identificar inconsistencias y preparar observaciones.`,
    "Los resultados de IA son auxiliares y preliminares. No constituyen asesoria legal, fiscal, financiera, crediticia o regulatoria definitiva. Toda decision debe ser validada por personas autorizadas y asesores profesionales.",
    "El usuario acepta que la calidad de los resultados depende de la informacion cargada, su legibilidad, vigencia, estructura y completitud."
  ]],
  ["5. Biometricos e identidad digital", [
    `Cuando se active el modulo biometrico, ${BRAND.name} podra integrar proveedores especializados para prueba de vida, validacion facial, comparacion contra identificacion oficial, huella digital u otras senales antifraude.`,
    `La activacion de biometricos requerira consentimiento especifico y finalidades claras. ${BRAND.name} procurara guardar resultados, evidencias y bitacoras, no datos biometricos crudos salvo que sea necesario, legal y consentido.`
  ]],
  ["6. Responsabilidades del usuario", [
    "Mantener la confidencialidad de credenciales, usar contrasenas seguras y notificar accesos no autorizados.",
    "No cargar informacion falsa, alterada, fraudulenta, ilicita o de terceros sin autorizacion.",
    "No evadir controles de seguridad, manipular bitacoras, realizar scraping, pruebas no autorizadas o uso abusivo de la plataforma.",
    "Responder por la veracidad, licitud y autorizacion de la informacion cargada o compartida."
  ]],
  [`7. Responsabilidades de ${BRAND.name}`, [
    "Prestar el servicio con esfuerzos comercialmente razonables, controles de seguridad, trazabilidad y administracion de accesos.",
    "Mantener documentos y datos bajo medidas de confidencialidad y seguridad acordes con la etapa del producto y los proveedores utilizados.",
    "Registrar eventos relevantes como carga de documentos, visualizaciones, revisiones IA y accesos compartidos para fines de auditoria."
  ]],
  ["8. Pagos, servicios profesionales y reembolsos", [
    "Los servicios profesionales, planes o expedientes pueden requerir pago previo o condiciones especificas de contratacion.",
    `Los pagos se procesan mediante proveedores externos como Stripe. ${BRAND.name} no almacena datos completos de tarjeta.`,
    "Los alcances, tiempos de entrega, revisiones incluidas y politicas de reembolso deberan confirmarse en la orden, propuesta o contrato aplicable."
  ]],
  ["9. Confidencialidad, retencion y eliminacion", [
    `${BRAND.name} tratara la informacion como confidencial, salvo autorizacion del usuario, requerimiento legal, autoridad competente, auditoria, cumplimiento regulatorio o defensa de derechos.`,
    "La informacion podra conservarse durante la relacion comercial y por los plazos necesarios para cumplimiento legal, auditoria, evidencia contractual, prevencion de fraude y defensa juridica.",
    "El usuario podra solicitar eliminacion o restriccion cuando proceda legalmente; algunas bitacoras o evidencias podran conservarse si existe obligacion o interes legitimo."
  ]],
  ["10. Limitacion de responsabilidad", [
    `${BRAND.name} no garantiza aprobacion de credito, inversion, fondeo, autorizacion regulatoria ni decision favorable de un otorgante.`,
    `${BRAND.name} no sera responsable por rechazos, cambios de criterio de entidades financieras, informacion falsa proporcionada por usuarios, fallas de terceros, fuerza mayor o decisiones tomadas sin revision profesional.`,
    `En caso de detectar posible fraude, uso indebido o actividad ilicita, ${BRAND.name} podra suspender cuentas, preservar evidencia y cooperar con autoridades cuando corresponda.`
  ]],
  ["11. Ley aplicable y contacto", [
    "Estos terminos se rigen por las leyes de Mexico. Cualquier controversia sera atendida ante autoridades competentes conforme a la legislacion aplicable.",
    "Contacto legal: legal@nsd.com. Domicilio, RFC y datos corporativos definitivos deberan integrarse antes de publicacion comercial."
  ]]
];

export default function TermsPage() {
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
          Terminos y Condiciones
        </h1>

        <p style={{ color: COLORS.textMuted, marginBottom: "1rem" }}>
          Ultima actualizacion: 23 de mayo de 2026
        </p>
        <p style={{ color: COLORS.textMuted, lineHeight: 1.7, marginBottom: "2rem" }}>
          Este documento es una base operativa para la plataforma. Debe ser revisado por asesoria legal antes de su publicacion definitiva.
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
        <LegalDisclaimer />
      </div>
      <Footer />
    </div>
  );
}
