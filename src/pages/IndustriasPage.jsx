import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";
import SectionBackground from "../components/common/SectionBackground";
import { overlays, softCardStyle } from "../utils/visualStyle";

const INDUSTRIES = [
  { id: "banca",          name: "Banca y financieras" },
  { id: "sofomes",        name: "SOFOM / SOFIPO / Cooperativas" },
  { id: "seguros",        name: "Seguros y fianzas" },
  { id: "valores",        name: "Casas de bolsa y fondos" },
  { id: "bienes-raices",  name: "Bienes raíces" },
  { id: "family-office",  name: "Family office / Wealth management" },
  { id: "fintech",        name: "Fintech y neobancos" },
  { id: "manufactura",    name: "Manufactura y comercio" },
  { id: "mineria",        name: "Minería y energía" },
  { id: "gaming",         name: "Casinos y juegos con apuesta" },
  { id: "legal",          name: "Despachos y servicios profesionales" },
  { id: "crypto",         name: "Activos digitales / VASP" },
  { id: "publico",        name: "Sector público y supervisores" },
  { id: "salud",          name: "Salud y farmacéutico" },
  { id: "tecnologia",     name: "Tecnología y SaaS" },
];

const INDUSTRY_CONTENT = {
  "banca": {
    desc: "Onboarding, debida diligencia, PEP, sanciones, monitoring y reportes regulatorios para instituciones financieras con operaciones multijurisdiccionales.",
    casos: [
      { titulo: "Onboarding institucional acelerado", detalle: "Expediente digital con flujo KYC/KYB configurable por producto: cuenta empresarial, crédito sindicado, línea de crédito. Validación de documentos, scoring A-E y decisión trazable en un solo flujo." },
      { titulo: "Screening PEP y sanciones OFAC/ONU/UE", detalle: "Verificación automática del titular, beneficiario final y representante legal contra OFAC SDN, lista consolidada ONU, OFSI UK, EU FSF, SEMA Canada y FBI Wanted. Resultado con nivel de coincidencia y nota de auditoría." },
      { titulo: "Monitoreo de clientes activos", detalle: "Re-screening periódico de la cartera activa. Alertas automáticas cuando un cliente aparece en una nueva lista o cambia su perfil de riesgo. Cron configurable con registro en log de auditoría." },
      { titulo: "Expediente regulatorio CNBV / SBS / SUGEF", detalle: "Checklist por jurisdicción y tipo de cliente. Integración de buró, RFC, poder notarial, estados financieros y comprobante de domicilio con validación y vencimiento." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Scoring A-E", "Expedientes", "Monitoreo", "Trazabilidad"],
    regulaciones: ["Ley PLDFT (México)", "CNBV Disposiciones", "SUGEF (Costa Rica)", "SBS (Perú/Chile)", "FATF Rec. 10–12", "Basilea III pillar 2"],
    docs: ["Acta constitutiva", "Poder notarial del representante legal", "Identificación oficial con biometría", "Comprobante de domicilio fiscal", "Estados financieros dictaminados", "RFC + constancia fiscal", "Declaración de beneficiario final (UBO)", "Alta IMSS / nómina (crédito)"],
  },
  "sofomes": {
    desc: "Expediente digital, KYC/KYB, checklists por producto, riesgo configurable y cumplimiento CNBV / CONDUSEF.",
    casos: [
      { titulo: "Originación de crédito SOFOM ENR / ER", detalle: "Flujo de originación digital con checklist por producto: crédito simple, arrendamiento, factoraje. Validación automática de documentos, scoring y decisión del comité con memo ejecutivo." },
      { titulo: "Cumplimiento PLDFT para SOFOM ER", detalle: "Implementación del manual de PLD. Clasificación de clientes por nivel de riesgo, expediente digital con alertas, reporte de operaciones inusuales y relevantes, y mantenimiento de registros CNBV." },
      { titulo: "KYC ligero para cooperativas de ahorro", detalle: "Onboarding simplificado para socios: identificación, CURP, comprobante de domicilio y declaración de origen de recursos. Checklist SOFIPO con umbrales CONDUSEF." },
      { titulo: "Gestión de expedientes vencidos", detalle: "Alertas automáticas de documentos próximos a vencer (INE, comprobante, poderes). Solicitud de actualización por correo con portal de recarga de documentos." },
    ],
    modulos: ["KYC/KYB", "Expedientes", "Scoring A-E", "Checklists dinámicos", "Alertas", "Trazabilidad"],
    regulaciones: ["Ley General de Organizaciones y Actividades Auxiliares del Crédito", "Disposiciones CNBV PLDFT", "Reglamento CONDUSEF", "Ley de Ahorro y Crédito Popular"],
    docs: ["INE / pasaporte del acreditado", "CURP y RFC", "Comprobante de domicilio (< 3 meses)", "Declaración de origen de recursos", "Autorización de consulta buró", "Estados de cuenta bancarios (3 meses)", "Contrato de crédito firmado"],
  },
  "seguros": {
    desc: "Due diligence de tomadores, agentes y beneficiarios, screening de sanciones, monitoreo de siniestros y expediente de suscripción.",
    casos: [
      { titulo: "Due diligence de tomadores de póliza de alto valor", detalle: "Para seguros de vida, ahorro e inversión vinculados: KYC del tomador, asegurado y beneficiarios. Screening PEP y sanciones. Declaración de beneficiario final y origen de recursos." },
      { titulo: "Onboarding y vínculo de agentes / promotores", detalle: "Expediente del agente autorizado: cédula de agente, identificación, comprobante domicilio, antecedentes y verificación en listas. Renovación periódica con alertas de vencimiento." },
      { titulo: "Monitoreo de siniestros con señales de fraude", detalle: "Evaluación de patrones en siniestros recurrentes: monto, frecuencia, zona geográfica y beneficiario. Alerta cuando el beneficiario aparece en listas de sanciones al momento de la reclamación." },
      { titulo: "Cumplimiento PLDFT para seguros", detalle: "Identificación y reporte de operaciones inusuales. Registro de operaciones relevantes (> MXN 100,000 en seguros de vida). Expediente regulatorio CNSF con trazabilidad de decisiones." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Expedientes", "Alertas", "Monitoreo TX", "Trazabilidad"],
    regulaciones: ["Ley de Instituciones de Seguros y de Fianzas (LISF)", "Disposiciones CNSF PLDFT", "FATF Rec. 26", "IAIS ICP 22"],
    docs: ["Solicitud de seguro firmada", "Identificación oficial del tomador", "Comprobante de domicilio", "Declaración de beneficiarios con % de participación", "Declaración de origen de recursos (primas > umbral)", "Cédula de agente vigente"],
  },
  "valores": {
    desc: "KYC, perfil inversionista, origen de recursos, sanciones, cumplimiento CNBV, reporte antilavado e idoneidad.",
    casos: [
      { titulo: "Apertura de cuenta de inversión institucional", detalle: "KYB completo para personas morales: acta, poderes, RFC, estados financieros, beneficiario final y screening de sanciones. Clasificación por perfil de riesgo e idoneidad del producto." },
      { titulo: "Perfil inversionista y test de idoneidad", detalle: "Formulario digital de perfil (conservador / moderado / agresivo). Registro del resultado con fecha, firma electrónica y versión del cuestionario. Recertificación anual con alerta automática." },
      { titulo: "Reporte de operaciones inusuales (ROI)", detalle: "Detección de patrones: retiros masivos, cambios repentinos de perfil, contrapartes en listas. Generación de borrador de ROI con evidencia vinculada. Flujo de revisión y aprobación del OFIPRE." },
      { titulo: "Monitoreo continuo de clientes activos", detalle: "Re-screening periódico contra OFAC/ONU/UE. Alertas de cambio de exposición política. Notificación al oficial de cumplimiento con nivel de urgencia y registro en log." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Scoring A-E", "Monitoreo TX", "Expedientes", "Trazabilidad"],
    regulaciones: ["Ley del Mercado de Valores (LMV)", "Disposiciones CNBV casas de bolsa", "MIFID II (referencia EU)", "FATF Rec. 24–25", "Reg. SIEFORE CONSAR"],
    docs: ["Acta constitutiva y poderes actualizados", "RFC + constancia fiscal", "Identificación del/los representantes", "Estados financieros auditados", "Declaración UBO (beneficiario final)", "Cuestionario de perfil inversionista firmado", "Declaración de origen de recursos"],
  },
  "bienes-raices": {
    desc: "Due diligence de compradores, vendedores, arrendadores, agentes y partes relacionadas. Checklist PLDFT y cumplimiento por estado.",
    casos: [
      { titulo: "Due diligence comprador / vendedor en cierre notarial", detalle: "Expediente completo: identificación, RFC, comprobante de domicilio, declaración de origen de recursos y screening PEP/sanciones del comprador, vendedor y cónyuge. Entregable para la notaría." },
      { titulo: "Cumplimiento PLDFT como actividad vulnerable", detalle: "Las inmobiliarias y desarrolladoras con transacciones > 8,025 UMA son actividades vulnerables ante el SAT. Identificación, conservación de expedientes, reportes mensuales y aviso de operaciones relevantes." },
      { titulo: "Due diligence de fideicomisos y vehículos de inversión", detalle: "Identificación de beneficiarios reales del fideicomiso. Verificación de fiduciaria. Screening de todas las partes. Integración con RNIE (inversión extranjera) cuando aplique." },
      { titulo: "Gestión de agentes y promotores", detalle: "Expediente del corredor inmobiliario: licencia (donde aplique), identificación, antecedentes, capacitación PLD y firma de convenio de confidencialidad y conocimiento del cliente." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Expedientes", "Checklists dinámicos", "Trazabilidad"],
    regulaciones: ["Ley Federal PLDFT Art. 17 (actividades vulnerables)", "Reglas SAT para inmobiliarias", "Ley de Inversión Extranjera / RNIE", "Código Civil Federal (contratos)"],
    docs: ["Identificación oficial comprador y vendedor", "RFC + constancia fiscal", "Comprobante de domicilio", "Escritura del inmueble (antecedentes registrales)", "Declaración de origen de recursos", "Avalúo comercial vigente", "CURP de personas físicas", "Poder notarial (si aplica)"],
  },
  "family-office": {
    desc: "Expediente de inversionistas, UBO, origen de recursos, custodias, contratos e información fiscal para operaciones multijurisdiccionales.",
    casos: [
      { titulo: "Onboarding de familia / estructura patrimonial", detalle: "Expediente completo de la familia: identificación de cada miembro, mapa de la estructura (holdings, fideicomisos, fundaciones), beneficiarios finales y fuente de riqueza documentada." },
      { titulo: "Screening PEP y sanciones de toda la estructura", detalle: "Verificación de todos los miembros de la familia, administradores, protectores y beneficiarios de fideicomisos contra las 6 listas de sanciones. Monitoreo continuo con alertas." },
      { titulo: "Gestión de custodios e inversiones multijurisdiccionales", detalle: "Expediente por custodio y jurisdicción: contrato, extractos, estado de cuenta, declaraciones fiscales. Consolidación de posición patrimonial con trazabilidad de movimientos." },
      { titulo: "Due diligence de co-inversionistas en operaciones privadas", detalle: "KYB del co-inversionista, beneficiario final, origen de recursos y screening de sanciones antes de cada operación privada (PE, capital semilla, real estate)." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Expedientes", "Scoring A-E", "Data Room", "Trazabilidad"],
    regulaciones: ["FATF Rec. 10 (CDD avanzada)", "CRS / FATCA (información fiscal)", "Ley PLDFT México (actividades vulnerables)", "AEOI (OCDE)"],
    docs: ["Pasaporte o identificación vigente de cada miembro", "Comprobante de domicilio fiscal", "Declaración de beneficiario final (UBO)", "Fuente de riqueza documentada", "Estructura corporativa / organigrama", "Declaraciones fiscales recientes", "Contratos de fideicomiso / estatutos de holding"],
  },
  "fintech": {
    desc: "Incorporación digital, biometría, validaciones automáticas, sanciones, riesgo transaccional y flujos regulatorios configurables.",
    casos: [
      { titulo: "Onboarding 100% digital con biometría", detalle: "Captura de INE/pasaporte, selfie con liveness detection, validación contra RENAPO/CURP, y scoring de riesgo automático. Flujo configurable por producto: cuenta, crédito, BNPL." },
      { titulo: "Screening de sanciones en tiempo real", detalle: "Verificación automática en el momento del onboarding y en cada transacción relevante. Integración con OFAC, ONU, UK, EU, Canada y FBI. Resultado instantáneo con nivel de confianza." },
      { titulo: "Monitoreo transaccional con reglas configurables", detalle: "Motor de reglas por monto, frecuencia, contraparte y tipo de operación. Alertas de estructuración, monto redondo y jurisdicción de alto riesgo FATF. Dashboard para el oficial de cumplimiento." },
      { titulo: "Cumplimiento CNBV Fintech / LFPIORPI", detalle: "Para ITF (Instituciones de Tecnología Financiera) autorizadas: expediente regulatorio, reporte de operaciones inusuales, conservación de registros y aviso de usuarios de alto riesgo." },
    ],
    modulos: ["KYC/KYB", "Biométricos", "Sanciones Gateway", "Monitoreo TX", "Scoring A-E", "Trazabilidad"],
    regulaciones: ["Ley Fintech México (LFPIORPI)", "Disposiciones CNBV Instituciones de Tecnología Financiera", "FATF Guidance on Virtual Assets", "GDPR / Ley Federal de Protección de Datos"],
    docs: ["INE / pasaporte con chip NFC", "Selfie con prueba de vida (liveness)", "CURP validado en RENAPO", "RFC activo en SAT", "Comprobante de domicilio", "Declaración de origen de recursos (> umbral)", "Contrato de adhesión firmado electrónicamente"],
  },
  "manufactura": {
    desc: "Due diligence de proveedores y clientes, verificación corporativa, beneficiarios finales y cumplimiento de cadena de valor.",
    casos: [
      { titulo: "Due diligence de proveedores críticos", detalle: "Expediente del proveedor: RFC activo, situación fiscal SAT, acta constitutiva, representante legal y screening de sanciones. Clasificación de riesgo por monto de contrato y jurisdicción." },
      { titulo: "Verificación de clientes institucionales B2B", detalle: "KYB de clientes: razón social, RFC, representante, beneficiario final y situación en listas. Para exportadores: verificación OFAC y controles de exportación (EAR/ITAR en EE.UU.)." },
      { titulo: "Cumplimiento cadena de suministro PLDFT", detalle: "Identificación de distribuidores, comisionistas y agentes como partes de la cadena. Checklist de diligencia debida. Registro de contratos con representación y garantía de cumplimiento." },
      { titulo: "Onboarding de socios comerciales internacionales", detalle: "Verificación de socios en múltiples jurisdicciones: UK Companies House, registros LAC, EU business register. Screening en listas de sanciones internacionales antes de firmar contrato." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Expedientes", "Checklists dinámicos", "Trazabilidad"],
    regulaciones: ["Ley PLDFT Art. 17 (comercio exterior)", "Reglas SAT para retención ISR a proveedores", "USMCA / T-MEC (origen de mercancías)", "Ley Aduanera (importación/exportación)"],
    docs: ["Cédula de identificación fiscal (RFC)", "Constancia de situación fiscal SAT", "Acta constitutiva y poderes", "Identificación del representante legal", "Opinión de cumplimiento fiscal SAT", "Declaración de beneficiario final", "Contrato marco de proveeduría"],
  },
  "mineria": {
    desc: "Licencias, permisos, socios, contratistas y compradores sujetos a PLDFT. Expediente regulatorio y screening de sanciones internacionales.",
    casos: [
      { titulo: "Due diligence de compradores de mineral / metal", detalle: "Para oro, plata, cobre y metales críticos: KYB del comprador, beneficiario final, país destino y screening OFAC (sectores minero y energético). Verificación del uso final declarado." },
      { titulo: "Onboarding de contratistas y subcontratistas de obra", detalle: "Expediente del contratista: registro patronal IMSS, RFC, situación fiscal, representante legal y screening. Alertas de vencimiento de licencias de operación y seguros de responsabilidad civil." },
      { titulo: "Gestión de permisos y concesiones regulatorias", detalle: "Expediente de concesiones mineras: título de concesión, vigencia, zona, propietario y garantía ambiental. Alertas de vencimiento y cambios en el registro público minero." },
      { titulo: "Cumplimiento como actividad vulnerable (metales preciosos)", detalle: "Comerciantes de metales preciosos con operaciones > umbral: identificación de contrapartes, reporte SAT, conservación de registros. Checklist PLDFT con flujo de aprobación interna." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Expedientes", "Checklists dinámicos", "Monitoreo TX", "Trazabilidad"],
    regulaciones: ["Ley Minera (México)", "Ley Federal PLDFT Art. 17 (metales preciosos)", "FATF Guidance on Dealers in Precious Metals", "Ley de Inversión Extranjera (participación en minería)"],
    docs: ["Título de concesión minera vigente", "RFC y constancia fiscal del operador", "Licencia ambiental (SEMARNAT)", "Acta constitutiva del titular", "Declaración de uso final del mineral", "Identificación del representante legal", "Contrato de compraventa de mineral"],
  },
  "gaming": {
    desc: "KYC estricto, scoring de riesgo por cliente, sanciones, monitoreo de clientes frecuentes y gestión de casos con SLA.",
    casos: [
      { titulo: "KYC reforzado en alta de jugador", detalle: "Identificación biométrica, validación de edad (> 18 años), CURP/RFC, comprobante de domicilio y screening PEP/sanciones en el momento del alta. Clasificación de riesgo inmediata." },
      { titulo: "Monitoreo de clientes frecuentes y de alto valor", detalle: "Alertas automáticas por monto acumulado mensual, frecuencia de visitas y cambio en el patrón de juego. Activación de entrevista de origen de recursos para VIP." },
      { titulo: "Gestión de casos de posible lavado", detalle: "Flujo estructurado de análisis: evidencia, entrevista, decisión y escalamiento. Reporte de operación inusual (ROI) con toda la documentación vinculada. SLA por nivel de criticidad." },
      { titulo: "Cumplimiento Ley Federal de Juegos y Sorteos", detalle: "Expediente por establecimiento: permiso SEGOB, plan de PLD, oficial de cumplimiento y registros de clientes. Reporte mensual de operaciones relevantes (> MXN 320,000 en fichas)." },
    ],
    modulos: ["KYC/KYB", "Biométricos", "Sanciones Gateway", "Monitoreo TX", "Scoring A-E", "Trazabilidad"],
    regulaciones: ["Ley Federal de Juegos y Sorteos (México)", "Reglamento de la Ley de Juegos SEGOB", "Disposiciones de PLD para casinos SHCP", "FATF Guidance on Casinos"],
    docs: ["Permiso SEGOB vigente", "Identificación oficial del jugador (INE/pasaporte)", "CURP validado", "Comprobante de domicilio", "Declaración de origen de recursos (VIP)", "Registro de transacciones con fichas (> umbral)", "Plan de PLD aprobado por la SHCP"],
  },
  "legal": {
    desc: "Due diligence de clientes, conflictos de interés, beneficiarios finales, origen de recursos y cumplimiento como actividad vulnerable.",
    casos: [
      { titulo: "KYC del cliente antes de aceptar el mandato", detalle: "Expediente del cliente: identificación, RFC, comprobante de domicilio, beneficiario final y screening PEP/sanciones. Para personas morales: acta constitutiva, poderes y UBO. Registro de la fecha de aceptación." },
      { titulo: "Análisis de conflictos de interés", detalle: "Verificación de la contraparte, partes relacionadas y ex-clientes antes de aceptar el asunto. Registro del resultado del análisis y firma del socio responsable con fecha." },
      { titulo: "Cumplimiento PLDFT como actividad vulnerable", detalle: "Servicios jurídicos que impliquen constitución de sociedades, compraventa de inmuebles, fideicomiso y administración de activos son actividades vulnerables SAT. Checklist y reporte mensual." },
      { titulo: "Gestión de expedientes con acceso diferenciado", detalle: "Expediente digital del asunto con control de acceso por socio, asociado y asistente. Trazabilidad de cada consulta. Conservación mínima de 5 años post-cierre con indexación por cliente." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Expedientes", "Checklists dinámicos", "Data Room", "Trazabilidad"],
    regulaciones: ["Ley Federal PLDFT Art. 17 (servicios jurídicos)", "Reglas SAT actividades vulnerables (abogados)", "Código de Ética BARRA / Colegio de Abogados", "FATF Rec. 22 (DNFBP)"],
    docs: ["Identificación oficial del cliente", "RFC + constancia fiscal", "Acta constitutiva (personas morales)", "Poder notarial del representante", "Declaración de beneficiario final", "Declaración de origen de recursos (cuando aplique)", "Convenio de honorarios firmado"],
  },
  "crypto": {
    desc: "Viaje de la regla FATF (Travel Rule), KYC para VASP, screening en blockchain, sanciones, monitoreo de wallets y reportes regulatorios.",
    casos: [
      { titulo: "KYC/KYB de usuarios de intercambio de activos virtuales", detalle: "Onboarding con identificación, selfie, CURP/RFC, comprobante de domicilio y screening PEP/sanciones. Clasificación de riesgo por volumen, jurisdicción y tipo de activo." },
      { titulo: "Travel Rule: identificación de VASP origen/destino", detalle: "Para transferencias > 1,000 USD entre VASPs: identificación del originador y beneficiario. Intercambio de información con el VASP contraparte según el protocolo Travel Rule (TRISA, OpenVASP o similar)." },
      { titulo: "Monitoreo de wallets y señales de riesgo blockchain", detalle: "Verificación de la wallet de origen/destino contra listas OFAC de criptoactivos (incluye direcciones BTC/ETH sancionadas). Alerta cuando la wallet tiene exposición a dark markets o exchanges no conformes." },
      { titulo: "Cumplimiento CNBV / LFPIORPI para ITF con criptos", detalle: "Para ITF con activos virtuales: expediente regulatorio, reporte de operaciones inusuales, conservación de registros y reporte de transacciones relevantes a la CNBV conforme a la Ley Fintech." },
    ],
    modulos: ["KYC/KYB", "Biométricos", "Sanciones Gateway", "Monitoreo TX", "Scoring A-E", "Trazabilidad"],
    regulaciones: ["Ley Fintech México (LFPIORPI)", "FATF Updated Guidance for VASPs (2021)", "FATF Travel Rule (Rec. 15)", "OFAC Virtual Currency Guidance", "MiCA (UE, referencia para expansión)"],
    docs: ["Identificación oficial con liveness detection", "CURP validado / número de identificación fiscal", "Comprobante de domicilio", "Declaración de origen de fondos", "Wallet address de destino (para Travel Rule)", "KYB del VASP contraparte", "Consentimiento de tratamiento de datos"],
  },
  "publico": {
    desc: "Expedientes institucionales, evidencia auditora, gestión de investigaciones, trazabilidad de decisiones y reportes de supervisión.",
    casos: [
      { titulo: "Expediente de proveedores y contratistas del Estado", detalle: "KYB de empresa: RFC activo, opinión de cumplimiento SAT, acta constitutiva, representante, beneficiario final y screening de sanciones. Checklist CompraNet / SHCP. Registro de inhabilidades." },
      { titulo: "Gestión de investigaciones y casos de supervisión", detalle: "Expediente digital de investigación: hechos, evidencias, entrevistas, resoluciones y notificaciones. Flujo de aprobación por jerarquía. Acceso controlado por rol. Registro de cada consulta." },
      { titulo: "Trazabilidad de decisiones regulatorias", detalle: "Log inmutable de cada decisión: quién aprobó, con qué evidencia y en qué fecha. Exportación en PDF firmado para uso en procedimientos administrativos o judiciales." },
      { titulo: "Reporte de actividades a órganos supervisores", detalle: "Generación de reportes periódicos para SHCP, CNBV, UAF, SUGEF o CONASSIF. Plantillas por jurisdicción con los campos requeridos. Registro del envío y acuse de recibo." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Expedientes", "Trazabilidad", "Data Room", "Checklists dinámicos"],
    regulaciones: ["Ley de Adquisiciones, Arrendamientos y Servicios (LAASSP)", "Ley General de Responsabilidades Administrativas (LGRA)", "Ley Anticorrupción (Sistema Nacional Anticorrupción)", "FATF Rec. 12 (PEP en sector público)"],
    docs: ["RFC y constancia fiscal del proveedor", "Opinión de cumplimiento SAT positiva", "Acta constitutiva y poderes", "Declaración de no inhabilitación (CompraNet)", "Declaración de conflicto de interés", "Beneficiario final (UBO) del proveedor", "Póliza de fianza de cumplimiento"],
  },
  "salud": {
    desc: "Due diligence de socios comerciales, distribuidores y proveedores, con checklists regulatorios por país y sector.",
    casos: [
      { titulo: "Due diligence de distribuidores farmacéuticos", detalle: "KYB del distribuidor: licencia sanitaria, representante legal, RFC, situación fiscal y screening de sanciones. Verificación de registros COFEPRIS / ANAMED / INVIMA. Renovación anual con alertas." },
      { titulo: "Onboarding de socios de investigación clínica", detalle: "Expediente del CRO o centro de investigación: habilitación regulatoria, conflictos de interés de investigadores, origen de financiamiento y screening de personas clave contra listas PEP/sanciones." },
      { titulo: "Verificación de proveedores de insumos críticos", detalle: "Due diligence de proveedores de API (ingredientes farmacéuticos activos) y dispositivos: certificados GMP, licencia sanitaria, auditorías de calidad y screening de sanciones del exportador." },
      { titulo: "Gestión de acuerdos de distribución internacional", detalle: "Expediente del socio internacional: registro sanitario país destino, agente o distribuidor local, representante legal y verificación contra listas de sanciones de la jurisdicción destino (OFAC/UE/UK)." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Expedientes", "Checklists dinámicos", "Trazabilidad"],
    regulaciones: ["Ley General de Salud (México)", "Regulación COFEPRIS", "FDA 21 CFR (para socios EE.UU.)", "EMA GMP Guidelines", "FATF Rec. 22 (DNFBP para farmacéuticas en algunos países)"],
    docs: ["Licencia sanitaria del distribuidor", "Registro COFEPRIS / INVIMA / ANVISA del producto", "Acta constitutiva y poderes", "RFC + constancia fiscal", "Certificado GMP vigente", "Identificación del representante sanitario", "Acuerdo de distribución o licencia firmado"],
  },
  "tecnologia": {
    desc: "Cumplimiento para empresas que onboardean clientes institucionales, integran datos sensibles o operan en múltiples jurisdicciones.",
    casos: [
      { titulo: "Onboarding B2B de clientes corporativos", detalle: "KYB del cliente empresarial antes de activar la cuenta SaaS: razón social, RFC, representante legal, beneficiario final y screening de sanciones. Contrato marco con representación de cumplimiento." },
      { titulo: "Cumplimiento como subprocesador de datos financieros", detalle: "Expediente de la relación con el cliente financiero regulado: contrato de subprocesamiento, evidencia de controles ISO 27001 / SOC 2, DPA (Data Processing Agreement) y acuerdo de confidencialidad." },
      { titulo: "Due diligence de socios de integración y canales", detalle: "Verificación de ISV, integradores y revendedores: RFC, acta, representante, beneficiario final y screening. Para mercados internacionales: verificación en Companies House, SIREN, DUNS." },
      { titulo: "Expansión multijurisdiccional con cumplimiento local", detalle: "Al operar en MX, CO, CL, PE, AR, CA o AE: checklists de incorporación local, registro ante regulador de datos, validación de domicilio fiscal y cumplimiento de ley de datos por país." },
    ],
    modulos: ["KYC/KYB", "Sanciones Gateway", "Expedientes", "Checklists dinámicos", "Trazabilidad", "Cobertura Global"],
    regulaciones: ["Ley Federal de Protección de Datos Personales (LFPDPPP)", "GDPR (para operaciones EU)", "Ley 1581 de Protección de Datos (Colombia)", "SOC 2 / ISO 27001 (controles internos)", "FATF Guidance on Technology Companies"],
    docs: ["Acta constitutiva y poderes", "RFC + constancia fiscal", "Identificación del representante legal", "Declaración de beneficiario final", "DPA / acuerdo de tratamiento de datos", "Contrato de servicios SaaS firmado", "Certificado ISO 27001 / SOC 2 (si aplica)"],
  },
};

function Tag({ children, color = COLORS.navy, bg = "#EEF2F7" }) {
  return (
    <span style={{ display: "inline-block", background: bg, color, fontSize: "0.72rem", fontWeight: 700, borderRadius: "4px", padding: "2px 8px", marginRight: "0.4rem", marginBottom: "0.4rem", letterSpacing: "0.03em" }}>
      {children}
    </span>
  );
}

function SectorPage({ industry }) {
  const navigate = useNavigate();
  const content = INDUSTRY_CONTENT[industry.id];

  return (
    <div style={{ background: "#F2EFE9", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`, padding: "5rem 2rem 4rem", textAlign: "center" }}>
        <button
          onClick={() => navigate("/industrias")}
          style={{ background: "transparent", color: "rgba(255,255,255,0.6)", border: "none", cursor: "pointer", fontSize: "0.85rem", marginBottom: "1.5rem", display: "inline-block" }}
        >
          ← Todas las industrias
        </button>
        <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          INDUSTRIA
        </p>
        <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, lineHeight: 1.2, maxWidth: "700px", margin: "0 auto 1.25rem" }}>
          {industry.name}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1rem", maxWidth: "620px", margin: "0 auto 2rem", lineHeight: 1.65 }}>
          {content.desc}
        </p>
        <button
          onClick={() => navigate("/contacto")}
          style={{ background: COLORS.gold, color: COLORS.navy, border: "none", borderRadius: "8px", padding: "0.85rem 2rem", fontSize: "0.92rem", fontWeight: 800, cursor: "pointer" }}
        >
          Ver aplicación en su organización →
        </button>
      </section>

      <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "3.5rem 2rem" }}>

        {/* Casos de uso */}
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            CASOS DE USO
          </p>
          <h2 style={{ color: COLORS.navy, fontSize: "1.3rem", fontWeight: 800, marginBottom: "1.5rem" }}>
            Cómo NEXUS resuelve los retos de su sector
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(430px, 1fr))", gap: "1.1rem" }}>
            {content.casos.map((caso, i) => (
              <div key={i} style={{ ...softCardStyle, padding: "1.4rem 1.5rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                  <span style={{ background: COLORS.navy, color: "#fff", borderRadius: "6px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.78rem", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div>
                    <h3 style={{ color: COLORS.navy, fontSize: "0.92rem", fontWeight: 800, marginBottom: "0.4rem" }}>
                      {caso.titulo}
                    </h3>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.84rem", lineHeight: 1.6 }}>
                      {caso.detalle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Módulos + Regulaciones + Docs en 3 columnas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>

          {/* Módulos NEXUS */}
          <div style={{ ...softCardStyle, padding: "1.4rem 1.5rem" }}>
            <p style={{ color: COLORS.gold, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              MÓDULOS NEXUS APLICABLES
            </p>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {content.modulos.map((m) => (
                <Tag key={m} color={COLORS.navy} bg="#EEF2F7">{m}</Tag>
              ))}
            </div>
          </div>

          {/* Regulaciones */}
          <div style={{ ...softCardStyle, padding: "1.4rem 1.5rem" }}>
            <p style={{ color: COLORS.gold, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              MARCO REGULATORIO
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {content.regulaciones.map((r) => (
                <li key={r} style={{ fontSize: "0.82rem", color: COLORS.text, display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <span style={{ color: COLORS.gold, fontWeight: 900, flexShrink: 0 }}>›</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Documentos clave */}
          <div style={{ ...softCardStyle, padding: "1.4rem 1.5rem" }}>
            <p style={{ color: COLORS.gold, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              DOCUMENTOS CLAVE DEL CHECKLIST
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {content.docs.map((d) => (
                <li key={d} style={{ fontSize: "0.82rem", color: COLORS.text, display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <span style={{ color: "#2E7D32", fontWeight: 900, flexShrink: 0 }}>✓</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* CTA final */}
        <div style={{
          marginTop: "3rem", background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`,
          borderRadius: "14px", padding: "2.5rem 2rem", textAlign: "center", color: "#fff"
        }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.75rem" }}>
            ¿Listo para implementar cumplimiento en {industry.name}?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.92rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Nuestro equipo configura la plataforma para su sector, jurisdicción y flujo de trabajo específico.
          </p>
          <button
            onClick={() => navigate("/contacto")}
            style={{ background: COLORS.gold, color: COLORS.navy, border: "none", borderRadius: "8px", padding: "0.85rem 2.5rem", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer" }}
          >
            Agendar demostración →
          </button>
        </div>

      </div>

      <Footer />
    </div>
  );
}

export default function IndustriasPage() {
  const { sector } = useParams();
  const navigate = useNavigate();
  const industry = sector ? INDUSTRIES.find((i) => i.id === sector) : null;

  if (industry) return <SectorPage industry={industry} />;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <SectionBackground image="/industries-bg.jpg" overlay={overlays.creamSoft} />

      <div style={{ position: "relative", zIndex: 3 }}>
        <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`, padding: "5rem 2rem 4rem", textAlign: "center" }}>
          <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            INDUSTRIAS
          </p>
          <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 800, lineHeight: 1.2, maxWidth: "700px", margin: "0 auto 1.25rem" }}>
            Cumplimiento configurado para su industria
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1rem", maxWidth: "620px", margin: "0 auto", lineHeight: 1.65 }}>
            NEXUS se adapta a los requerimientos regulatorios de 15 sectores con checklists, reglas, fuentes y flujos específicos para cada industria y jurisdicción.
          </p>
        </section>

        <section style={{ padding: "4rem 2rem", maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "1.5rem" }}>
            {INDUSTRIES.map((ind) => {
              const c = INDUSTRY_CONTENT[ind.id];
              return (
                <div
                  key={ind.id}
                  onClick={() => navigate(`/industrias/${ind.id}`)}
                  style={{
                    background: "rgba(255,255,255,0.82)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    borderRadius: "16px",
                    padding: "1.85rem",
                    border: "1px solid rgba(27,58,92,0.06)",
                    boxShadow: "0 2px 12px rgba(27,58,92,0.05)",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 28px rgba(27,58,92,0.13)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(27,58,92,0.05)"; e.currentTarget.style.borderColor = "rgba(27,58,92,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <h3 style={{ fontSize: "0.99rem", fontWeight: 800, color: COLORS.navy, marginBottom: "0.55rem" }}>{ind.name}</h3>
                  <p style={{ fontSize: "0.84rem", color: COLORS.textMuted, lineHeight: 1.6, margin: "0 0 1rem" }}>{c.desc}</p>
                  <div style={{ marginBottom: "0.85rem" }}>
                    {c.modulos.slice(0, 3).map((m) => <Tag key={m}>{m}</Tag>)}
                    {c.modulos.length > 3 && <Tag color={COLORS.textMuted} bg="#F2EFE9">+{c.modulos.length - 3}</Tag>}
                  </div>
                  <span style={{ fontSize: "0.8rem", color: COLORS.gold, fontWeight: 700 }}>Ver casos de uso →</span>
                </div>
              );
            })}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
