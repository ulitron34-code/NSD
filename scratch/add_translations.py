# -*- coding: utf-8 -*-
import os
import re

runtime_copy_path = r"F:\CODEX\ulitron34-code-nsd-https-github-com\src\utils\runtimeCopy.js"

translations_to_add = {
    # Moat Tab
    "Cada carga, faltante, requerimiento, score e interes institucional puede mejorar el sistema.": "Every upload, gap, request, score and institutional interest can improve the system.",
    "Cada expediente se estructura por sector, monto, tipo de fondeo y requisitos exigibles.": "Each file is structured by sector, amount, funding type and compliance requirements.",
    "Capas de defensa": "Defense Layers",
    "Cubren una pieza, no el flujo completo de financiamiento.": "They cover one piece, not the complete financing workflow.",
    "Datos de interaccion": "Interaction Data",
    "El data room es consecuencia; el valor esta en preparar, validar y explicar el expediente.": "The data room is the result; the value is in preparing, validating and explaining the file.",
    "El producto entiende solicitantes, otorgantes, expedientes, data room, requerimientos y comite.": "The product understands applicants, funders, files, data room, requests and committee.",
    "Expediente + IA + data room + otorgantes + servicios": "File + AI + data room + funders + services",
    "KYC/KYB es un modulo dentro de un expediente financiero completo.": "KYC/KYB is a module within a complete financial file.",
    "La capa profesional ayuda a iniciar ingresos antes de que el SaaS este completamente maduro.": "The professional tier helps generate revenue before the SaaS is fully mature.",
    "La consultoria no escala; NSD convierte conocimiento en flujo repetible.": "Consulting does not scale; NSD converts knowledge into a repeatable workflow.",
    "La decision sigue en el otorgante; NSD acelera preparacion y revision.": "The decision remains with the funder; NSD accelerates preparation and review.",
    "La defensa esta en el flujo vertical, no en una sola funcion.": "The defense is in the vertical workflow, not in a single feature.",
    "NSD se posiciona entre consultoria financiera, compliance, data room, KYC/KYB e inteligencia documental. La oportunidad es unificar esas piezas en un flujo repetible para solicitantes y otorgantes.": "NSD positions itself between financial consulting, compliance, data room, KYC/KYB and document intelligence. The opportunity is to unify these pieces into a repeatable workflow for applicants and funders.",
    "No preparan expediente ni validan evidencia documental.": "They do not prepare files or validate documentary evidence.",
    "Plataforma vertical para preparar y revisar solicitudes financieras.": "Vertical platform to prepare and review financial applications.",
    "Posicionamiento para pitch": "Pitch Positioning",
    "Trazabilidad, permisos, disclaimers y revision humana reducen riesgo reputacional.": "Traceability, permissions, disclaimers and human review reduce reputational risk.",
    
    # Due Diligence Tab
    "Aclarar que NSD IF no sustituye dictamen legal, regulatorio ni decision crediticia.": "Clarify that NSD IF does not substitute legal, regulatory opinion or credit decisions.",
    "Biometricos planteados como modulo futuro con consentimiento, privacidad y proveedor especializado.": "Biometrics planned as a future module with consent, privacy and specialized provider.",
    "Cerrar narrative final de ronda y demo guiado de 10 minutos.": "Close final round narrative and 10-minute guided demo.",
    "Cerrar narrativa final de ronda y demo guiado de 10 minutos.": "Close final round narrative and 10-minute guided demo.",
    "Dashboard demo con tres perfiles: solicitante, otorgante y NSD Admin.": "Demo dashboard with three profiles: applicant, funder and NSD Admin.",
    "Definir paquete minimo legal, privacidad, terminos y consentimiento para demo comercial.": "Define minimum legal package, privacy, terms and consent for commercial demo.",
    "Documentar resultados: tiempos, faltantes, conversion, interes y aprendizaje de pricing.": "Document results: times, gaps, conversion, interest and pricing learnings.",
    "Dolor identificable: solicitudes de financiamiento lentas, incompletas y costosas.": "Identifiable pain: slow, incomplete and costly financing requests.",
    "Dos lados de mercado: solicitantes que requieren capital y entidades que necesitan certeza documental.": "Two market sides: applicants requiring capital and entities needing documentary certainty.",
    "Ejecutar piloto controlado con 3 a 5 expedientes y al menos 2 otorgantes.": "Execute controlled pilot with 3 to 5 files and at least 2 funders.",
    "Esta vista resume que existe, que esta validado, que falta probar y cuales son los riesgos que deben explicarse con transparencia antes de una ronda.": "This view summarizes what exists, what is validated, what still needs proof and which risks should be explained transparently before a round.",
    "Estructura para compartir expediente, documentos, permisos y evidencias.": "Structure to share file, documents, permissions and evidence.",
    "Evitar servicios manuales excesivos sin precio suficiente por expediente.": "Avoid excessive manual services without sufficient pricing per file.",
    "Extension internacional planteada como expansion gradual, no promesa inmediata.": "International expansion planned as a gradual expansion, not an immediate promise.",
    "Flujo de expediente, carga documental, data room y revision con IA simulado/operativo.": "File workflow, document upload, data room and simulated/operational AI review.",
    "Fortalecer consentimiento, auditoria, retencion documental y politicas de acceso.": "Strengthen consent, audit trail, document retention and access policies.",
    "Ingresos por expediente, servicios profesionales, paquetes SaaS y comisiones condicionadas.": "Revenue per file, professional services, SaaS packages and contingent fees.",
    "Lectura ejecutiva para inversionistas": "Executive read for investors",
    "Matriz documental, trazabilidad, scoring y semaforos como capas principales de control.": "Document matrix, traceability, scoring and status lights as main control layers.",
    "Pagina publica SaaS con narrativa de cumplimiento, otorgantes, solicitantes e internacional.": "SaaS public page with compliance narrative, funders, applicants and internationalization.",
    "Pagina publica, dashboard y perfiles demo listos para presentacion.": "Public page, dashboard and demo profiles ready for presentation.",
    "Piloto de 4 semanas para medir disposicion de pago, conversion e interes de otorgantes.": "4-week pilot to measure willingness to pay, conversion and funder interest.",
    "Pipeline, oportunidades, solicitudes de informacion e interes institucional.": "Pipeline, opportunities, information requests and institutional interest.",
    "Preparar data room de inversion: one pager, deck, modelo, roadmap, riesgos y evidencias.": "Prepare investment data room: one pager, deck, model, roadmap, risks and evidence.",
    "Pricing sujeto a aprendizaje real antes de comprometer escala.": "Pricing subject to real learning before committing to scale.",
    "Render + Supabase como base para autenticacion, ordenes, documentos y revisiones.": "Render + Supabase as base for authentication, orders, documents and reviews.",
    "Revision documental, scoring, faltantes, memo ejecutivo y alertas de riesgo.": "Document review, scoring, gaps, executive memo and risk alerts.",
    "Ruta inicial para expansion por jurisdiccion, requisitos y aliados locales.": "Initial path for expansion by jurisdiction, requirements and local partners.",
    "Sala de due diligence": "Due diligence room",
    "Separacion responsable entre asistencia de cumplimiento y decision crediticia final.": "Responsible separation between compliance assistance and final credit decision.",
    "Siguientes hitos para estar listo para ronda": "Next milestones to be ready for the round",
    "Validable en piloto": "Validatable in pilot",
    "Validar con pilotos pequenos antes de escalar equipo comercial.": "Validate with small pilots before scaling sales team.",
    
    # Fundraising Round Tab
    "3 entidades, 20 expedientes, flujo solicitante-otorgante completo y data room funcional.": "3 entities, 20 files, complete applicant-funder workflow and functional data room.",
    "Cartas de interes, aliados, casos piloto y entidades objetivo.": "Letters of intent, partners, pilot cases and target entities.",
    "Cerrar flujos solicitante-otorgante, permisos, auditoria, data room y demo guiado.": "Close applicant-funder flows, permissions, audit trails, data room and guided demo.",
    "Contratos, privacidad, compliance, terminos, seguros y gobierno corporativo.": "Contracts, privacy, compliance, terms, insurance and corporate governance.",
    "Data room de inversion": "Investment Data Room",
    "Esta vista organiza la conversacion de inversion: uso de fondos, hitos, evidencias del data room, riesgos y proximos activos que deben prepararse para levantar capital.": "This view organizes the investment conversation: use of funds, milestones, data room evidence, risks and next assets to be prepared to raise capital.",
    "Iniciar con pilotos acotados y servicios profesionales para aprender antes de escalar.": "Start with limited pilots and professional services to learn before scaling.",
    "Landing, dashboard, solicitante, otorgante, NSD Admin y demo 10 min.": "Landing, dashboard, applicant, funder, NSD Admin and 10-min demo.",
    "MRR inicial, repeticion por entidad, dashboard de administracion y auditoria robusta.": "Initial MRR, repetition per entity, admin dashboard and robust audit trail.",
    "MRR, fee por expediente, servicios, CAC, margen, escenarios y runway.": "MRR, fee per file, services, CAC, margin, scenarios and runway.",
    "Mexico consolidado, primeros casos USA y partners de integracion.": "Consolidated Mexico, first US cases and integration partners.",
    "Narrativa, mercado, producto, modelo, equipo, ask y uso de fondos.": "Narrative, market, product, model, team, ask and use of funds.",
    "No prometer aprobacion crediticia; operar como preparacion, evidencia y trazabilidad.": "Do not promise credit approval; operate as preparation, evidence and traceability.",
    "Pendiente final": "Final Pending",
    "Piloto cerrado": "Closed Pilot",
    "Pilotos con SOFOMES, fintechs, fondos, empresas solicitantes y aliados de servicios.": "Pilots with SOFOMs, fintechs, funds, applicant companies and service partners.",
    "Por cerrar": "To close",
    "Por preparar": "To prepare",
    "Pre-seed para producto, pilotos e integraciones.": "Pre-seed for product, pilots and integrations.",
    "Primeros ingresos por expedientes y servicios NSD IF; 2 modulos premium validados.": "First revenues from files and NSD IF services; 2 premium modules validated.",
    "Priorizar permisos, seguridad, respaldos, trazabilidad y observabilidad antes de abrir masivo.": "Prioritize permissions, security, backups, traceability and observability before launching massively.",
    "Riesgo IA": "AI Risk",
    "Riesgo go-to-market": "Go-to-market Risk",
    "Riesgo regulatorio": "Regulatory Risk",
    "Riesgo tecnico": "Technical Risk",
    "Ronda / Data room de inversion": "Round / Investment Data Room",
    "Solo con pilotos, legal y costos de integracion validados.": "Only with validated pilots, legal and integration costs.",
    "Terminos, privacidad, consentimiento, disclaimers y revision legal pendiente.": "Terms, privacy, consent, disclaimers and pending legal review.",
    "Tiempo para validar pilotos, ingresos y producto SaaS.": "Time to validate pilots, revenue and SaaS product.",
    "Traccion SaaS": "SaaS Traction",
    "Una pagina para contestar: cuanto, para que y que se logra.": "One page to answer: how much, for what and what gets achieved.",
    "Ventas B2B, contenido, alianzas, demo institucional y materiales de inversion.": "B2B sales, content, partnerships, institutional demo and investment materials.",
    
    # Governance Tab
    "Agregar disclaimer en revision documental": "Add disclaimer in document review",
    "Antes de datos reales": "Before real data",
    "Antes de integracion": "Before integration",
    "Antes de piloto": "Before pilot",
    "Antes de publicar comercialmente": "Before publishing commercially",
    "Biometricos futuros": "Future Biometrics",
    "Como presentar NSD IF sin sobrerregular ni sobreprometer": "How to present NSD IF without overregulating or overpromising",
    "Decision del otorgante": "Funder Decision",
    "Documentos, informacion financiera y biometricos deben operar con consentimiento, finalidad, control de acceso, trazabilidad y retencion limitada.": "Documents, financial information and biometrics must operate with consent, purpose, access control, traceability and limited retention.",
    "Esta capa ordena los disclaimers que deben acompañar la demo: IA asistiva, decision humana, privacidad, biometricos futuros y trazabilidad.": "This layer organizes the disclaimers that must accompany the demo: assistive AI, human decision-making, privacy, future biometrics and traceability.",
    "La IA ayuda a revisar documentos, detectar faltantes, resumir riesgos y sugerir semaforos. No aprueba creditos, no sustituye abogados y no emite dictamen regulatorio final.": "AI helps review documents, detect gaps, summarize risks and suggest traffic lights. It does not approve credit, does not replace lawyers and does not issue a final regulatory opinion.",
    "La entidad financiera conserva su propio comite, politicas de riesgo, apetito de credito, autorizaciones y decision final.": "The financial institution retains its own committee, risk policies, credit appetite, authorizations and final decision.",
    "Mantener como modulo futuro controlado": "Maintain as a controlled future module",
    "Pendiente de version legal final": "Pending final legal version",
    "Rostro, huella u otra biometria deben integrarse con proveedor especializado, prueba de vida, cifrado, politica de eliminacion y opcion de no continuidad cuando aplique.": "Face, fingerprint or other biometrics must integrate with a specialized provider, liveness check, encryption, deletion policy and non-continuity option when applicable.",
    "Terminos de uso": "Terms of Use",
    
    # Implementation Roadmap Tab
    "Auditoria completa y reglas por jurisdiccion": "Complete audit trail and rules by jurisdiction",
    "Checklist dinamico y alertas por faltantes": "Dynamic checklist and alerts for missing items",
    "De demo invertible a piloto operativo": "From investable demo to operating pilot",
    "Deck final y data room de inversion": "Final deck and investment data room",
    "En curso": "In Progress",
    "Esta vista resume que existe hoy, que debe cerrarse antes de publicar y que se deja para el piloto. Ayuda a ordenar prioridades sin sobredimensionar el MVP.": "This view summarizes what exists today, what must be closed before publishing and what is left for the pilot. It helps prioritize without overbuilding the MVP.",
    "Integraciones y comites por entidad": "Integrations and committees per entity",
    "Metricas de piloto y negociacion de ronda": "Pilot metrics and round negotiation",
    "Onboarding asistido y paquetes por industria": "Assisted onboarding and packages by industry",
    "One Pager, ronda, piloto, moat, Q&A y due diligence": "One Pager, round, pilot, moat, Q&A and due diligence",
    "Piloto comercial": "Commercial Pilot",
    "Pipeline, inteligencia, requerimientos y memo comite": "Pipeline, intelligence, requests and committee memo",
    "Por iniciar": "To Start",
    "Problema, solucion, mercado, moat y piloto": "Problem, solution, market, moat and pilot",
    "Roadmap de implementacion": "Implementation Roadmap",
    "Version piloto con datos reales controlados": "Pilot version with controlled real data",
    
    # Investor One Pager Tab
    "NSD Platform: infraestructura para preparar y revisar solicitudes financieras.": "NSD Platform: infrastructure to prepare and review financing requests.",
    "Una lectura ejecutiva para inversionistas: que problema resuelve, como monetiza, por que puede defenderse y que se financiaria.": "An executive read for investors: what problem it solves, how it monetizes, why it can be defended and what would be funded.",
    
    # Investor Pitch Tab
    "Fee por expediente": "Fee per file",
    
    # Q&A Tab
    "Cada solicitud de credito, inversion o fondeo requiere documentos, revision, requisitos, evidencia y seguimiento. Ese trabajo hoy es lento y poco comparable.": "Each request for credit, investment or funding requires documents, review, requirements, evidence and follow-up. This work today is slow and not very comparable.",
    "Como decirlo": "How to say it",
    "Como monetiza?": "How does it monetize?",
    "Como se consigue traccion?": "How is traction achieved?",
    "Como se evita riesgo reputacional?": "How is reputational risk avoided?",
    "Con disclaimers, revision humana, trazabilidad, permisos, auditoria y separando scoring preliminar de decision crediticia.": "With disclaimers, human review, traceability, permissions, audit trails and separating preliminary scoring from credit decisions.",
    "El producto puede empezar con servicios profesionales y evolucionar hacia SaaS recurrente con datos operativos propios.": "The product can start with professional services and evolve to recurring SaaS with its own operational data.",
    "Entidades que revisan expedientes, solicitantes que necesitan prepararse y NSD IF por servicios profesionales asociados.": "Entities reviewing files, applicants needing to prepare and NSD IF for associated professional services.",
    "Esta vista ayuda a contestar sin improvisar durante la ronda: mercado, producto, IA, riesgo, monetizacion y traccion.": "This view helps answer without improvising during the round: market, product, AI, risk, monetization and traction.",
    "Frases de cierre": "Closing Lines",
    "Hay SOFOMES, fintechs, bancos, fondos y PyMEs con friccion documental; ademas permite validar producto con costos controlados antes de expandir.": "There are SOFOMs, fintechs, banks, funds and SMEs with document friction; it also allows validating the product with controlled costs before expanding.",
    "IA y riesgo": "AI and Risk",
    "La IA aprueba creditos?": "Does AI approve credits?",
    "La demo local ya muestra landing, solicitante, otorgante, NSD Admin, vista de inversion, demo guiado, ronda, traccion y moat.": "The local demo already shows landing, applicant, funder, NSD Admin, investor view, guided demo, round, traction and moat.",
    "La oportunidad esta en estandarizar un flujo que hoy vive entre correos, PDFs, hojas de calculo y revisiones manuales.": "The opportunity is to standardize a flow that currently lives across emails, PDFs, spreadsheets and manual reviews.",
    "NSD no compite por aprobar creditos; compite por hacer que los expedientes lleguen mejor preparados.": "NSD does not compete to approve credits; it competes to make files arrive better prepared.",
    "No. La IA ayuda a preparar, revisar y explicar evidencia; la decision final permanece en el otorgante.": "No. AI helps prepare, review and explain evidence; the final decision remains with the funder.",
    "Permisos robustos, pilotos reales, integraciones premium, optimizacion visual y endurecimiento de seguridad/operacion.": "Robust permissions, real pilots, premium integrations, visual optimization and security/operational hardening.",
    "Pilotos con SOFOMES, fintechs, fondos, despachos financieros y empresas solicitantes usando expedientes reales controlados.": "Pilots with SOFOMs, fintechs, funds, financial firms and applicant companies using controlled real files.",
    "Por que empezar en Mexico?": "Why start in Mexico?",
    "Por que es grande?": "Why is it big?",
    "Producto, IA/integraciones, pilotos, go-to-market y base legal/operativa para lanzar con menor riesgo.": "Product, AI/integrations, pilots, go-to-market and legal/operational base to launch with lower risk.",
    "Que falta para producto comercial?": "What is missing for a commercial product?",
    "Que financia la ronda?": "What does the round fund?",
    "Que hace distinto NSD?": "What makes NSD different?",
    "Que hace el AI Compliance Engine?": "What does the AI Compliance Engine do?",
    "Responder breve, regresar al flujo de producto y evitar prometer resultados crediticios.": "Answer briefly, return to the product workflow and avoid promising credit outcomes.",
    "Respuestas cortas para preguntas dificiles.": "Short answers for hard questions.",
    "SaaS B2B, fee por expediente, servicios NSD IF y modulos premium como OCR, biometria, KYB, antifraude e integraciones.": "B2B SaaS, fee per file, NSD IF services and premium modules like OCR, biometrics, KYB, anti-fraud and integrations.",
    "Une preparacion del solicitante, matriz documental, IA, data room, requerimientos, otorgantes y administracion en un flujo vertical.": "Unifies applicant preparation, document matrix, AI, data room, requests, funders and administration in a vertical workflow.",
    
    # Pilot Playbook Tab
    "Calendario de piloto": "Pilot Timeline",
    "Carga proyecto, documentos, uso de fondos y responde requerimientos.": "Uploads project, documents, use of funds and responds to requests.",
    "Casos de uso": "Use Cases",
    "Casos reales o semi-reales con permiso de uso.": "Real or semi-real cases with permission of use.",
    "Controla trazabilidad, metricas, actividad, conversion y aprendizajes del piloto.": "Controls traceability, metrics, activity, conversion and pilot learnings.",
    "Detectar requisitos criticos antes de enviar al otorgante.": "Detect critical requirements before sending to the funder.",
    "Esta vista define como validar NSD con una entidad financiera o aliado: participantes, calendario, metricas, entregables y criterios de exito.": "This view defines how to validate NSD with a financial institution or partner: participants, timeline, metrics, deliverables and success criteria.",
    "Estructura expediente, revisa con IA, genera score, memo y plan de subsanacion.": "Structures file, reviews with AI, generates score, memo and remediation plan.",
    "Historias concretas de solicitante y otorgante para pitch.": "Concrete applicant and funder stories for the pitch.",
    "Ingresos piloto": "Pilot Revenue",
    "La entidad revisa data rooms, pide informacion y registra interes o descarte razonado.": "The entity reviews data rooms, requests information and records interest or reasoned rejection.",
    "Lograr que el otorgante quiera procesar otro lote.": "Get the funder to want to process another batch.",
    "Metricas de exito": "Success Metrics",
    "Quien sufra friccion documental en primera revision.": "Whoever experiences document friction in the first review.",
    "Reducir dias entre expediente recibido y primera lectura util.": "Reduce days between received file and first useful read.",
    "Reporte de piloto": "Pilot Report",
    "Requisitos ajustados por sector, monto, entidad y producto financiero.": "Requirements adjusted by sector, amount, entity and financial product.",
    "Retencion de entidad": "Entity Retention",
    "Roles del piloto": "Pilot Roles",
    "Solicitantes suben evidencia; NSD ejecuta checklist, IA, score y plan de subsanacion.": "Applicants upload evidence; NSD executes checklist, AI, score and remediation plan.",
    "Suficiente para procesar un lote controlado.": "Sufficient to process a controlled batch.",
    "Tiempo de primera revision": "First Review Time",
    "Un piloto de 30 dias para convertir la demo en evidencia.": "A 30-day pilot to turn the demo into evidence.",
    "Validacion de SaaS, fee por expediente y servicios profesionales.": "Validation of SaaS, fee per file and professional services.",
    "Validar fee por expediente o servicios NSD IF pagados.": "Validate fee per file or paid NSD IF services.",
    
    # Pitch Demo Mode Tab
    "Frase para inversionista": "Investor line",
    
    # Predeploy Go No-Go Tab
    "Confirmar que el ZIP tenga index.html y assets en la raiz.": "Confirm that the ZIP has index.html and assets in the root.",
    "Corte recomendado para publicacion controlada": "Recommended cut for controlled publishing",
    "Esta vista resume si el estado local esta listo para subir a Netlify como demo de presentacion, separando errores bloqueantes de pendientes aceptables.": "This view summarizes whether the local state is ready to upload to Netlify as a presentation demo, separating blocking errors from acceptable pending items.",
    "Pagina principal carga en preview local": "Main page loads in local preview",
    "Pasos de publicacion": "Publishing steps",
    "Perfiles Solicitante, Otorgante y NSD Admin navegables": "Navigable Applicant, Funder and NSD Admin profiles",
    "Render/Supabase deben estar vivos para login y datos reales": "Render/Supabase must be alive for login and real data",
    "Revisar acentos finales y posibles tramos en ingles": "Review final accents and possible English sections",
    "Si sale version vieja, limpiar cache o verificar que se subio el ZIP correcto.": "If old version appears, clear cache or verify that correct ZIP was uploaded.",
    "Stripe/checkout requiere prueba aparte despues del deploy": "Stripe/checkout requires separate testing after deployment",
    "Subir a Netlify en el proyecto existente, no crear sitio nuevo si se quiere conservar URL.": "Upload to Netlify in the existing project, do not create new site if you want to keep the URL.",
    "Usar el ZIP mas reciente generado desde dist.": "Use the most recent ZIP generated from dist.",
    
    # Traction Pilots Tab
    "Captura de solicitantes, business plan y preparacion para fondeo.": "Applicant intake, business plan and preparation for funding.",
    "Casos para probar solicitante, IA, data room y otorgante.": "Cases to test applicant, AI, data room and funder.",
    "Comparar fee por expediente vs. SaaS mensual + servicios NSD IF.": "Compare fee per file vs. monthly SaaS + NSD IF services.",
    "Data room, memo, ticket, riesgo y seguimiento de oportunidades.": "Data room, memo, ticket, risk and tracking of opportunities.",
    "De expediente preparado a interes institucional registrado.": "From prepared file to registered institutional interest.",
    "Empresa solicitante": "Applicant company",
    "Esta vista resume a quien se le venderia primero, que hipotesis se validan y que metricas deben demostrar traccion para una ronda pre-seed.": "This view summarizes who to sell to first, which hypotheses are being validated and which metrics should prove traction for a pre-seed round.",
    "Expediente completo, IA, matriz documental y presentacion a otorgantes.": "Complete file, AI, document matrix and presentation to funders.",
    "Expedientes piloto": "Pilot files",
    "La demo debe convertirse en pilotos medibles.": "The demo must become measurable pilots.",
    "Los solicitantes no saben que documentos preparar y los otorgantes reciben informacion desigual.": "Applicants don't know what documents to prepare and funders receive uneven information.",
    "Medir interes de entidades y solicitantes con CTA hacia demo guiada.": "Measure interest of entities and applicants with CTA towards guided demo.",
    "Mexico primero, USA despues, otros mercados solo con validacion legal.": "Mexico first, USA later, other markets only with legal validation.",
    "Otorgante workflow": "Funder workflow",
    "Piloto 30 dias": "30-day pilot",
    "Piloto tecnico": "Technical pilot",
    "Pipeline de PyMEs, credito empresarial y revision documental.": "Pipeline of SMEs, business credit and document review.",
    "Pipeline de pilotos": "Pilot Pipeline",
    "Procesar 10 expedientes con un aliado y medir faltantes, tiempos y acciones.": "Process 10 files with a partner and measure gaps, times and actions.",
    "Que medir antes de pedir mas capital": "What to measure before raising more capital",
    "SaaS B2B, fee por expediente, servicios profesionales y modulos premium.": "B2B SaaS, fee per file, professional services and premium modules.",
    "Senales de validacion": "Validation Signals",
    "Traccion / pilotos": "Traction / Pilots",
    "Validar si data room, memo y requerimientos reducen tiempo de primera revision.": "Validate if data room, memo and requests reduce first review time.",
    "Ya existe flujo local de solicitante, otorgante, admin, data room, IA y demo guiado.": "Local flow of applicant, funder, admin, data room, AI and guided demo already exists."
}

# Now we read runtimeCopy.js
with open(runtime_copy_path, "r", encoding="utf-8") as f:
    content = f.read()

# We want to insert these keys inside RUNTIME_TRANSLATIONS dictionary.
# Let's locate "export const RUNTIME_TRANSLATIONS = {" and insert them right after.
insert_pos = content.find("export const RUNTIME_TRANSLATIONS = {")
if insert_pos == -1:
    print("Error: export const RUNTIME_TRANSLATIONS not found!")
    exit(1)

brace_pos = content.find("{", insert_pos)
insert_index = brace_pos + 1

# Generate JS code for translations
js_translations = "\n"
for es, en in translations_to_add.items():
    # Escape single/double quotes if necessary
    es_esc = es.replace('"', '\\"')
    en_esc = en.replace('"', '\\"')
    js_translations += f'  "{es_esc}": "{en_esc}",\n'

new_content = content[:insert_index] + js_translations + content[insert_index:]

with open(runtime_copy_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Successfully added {len(translations_to_add)} translations to runtimeCopy.js!")
