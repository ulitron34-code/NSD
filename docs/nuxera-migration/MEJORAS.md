# MEJORAS NUXERA

## Enfoque

La investigacion de plataformas comparables confirma una decision importante: NUXERA no debe seguir creciendo como coleccion de pantallas, pestanas o previews. La prioridad ahora es conectar ciclos reales de trabajo entre solicitante, otorgante, admin, evidencia, agentes, notificaciones y auditoria.

El objetivo es acercar NUXERA a la madurez operativa de plataformas de commercial lending, TPRM/KYB, due diligence y risk orchestration, sin perder los guardrails ya definidos: migracion controlada, feature flags, permisos por rol, evidencia trazable, decisiones humanas y cero activacion productiva sin aprobacion explicita.

## Referentes investigados

Commercial lending / loan origination:
- nCino Commercial Lending: workflows de aprobacion, repositorio documental, auditoria visual, notificaciones automaticas y reportes regulatorios. Fuente: https://www.ncino.com/solutions/commercial-lending
- Corepass: portal borrower/broker, pipeline, tracking documental, asignacion de roles, recordatorios y analisis AI de documentos. Fuente: https://corepass.com/
- BankStream: aplicacion de credito, document collection, validacion de datos y expediente automatico. Fuente: https://bankstream.ai/our_product/data_and_document_collection
- Reedeck: comunicacion lender/borrower por email, WhatsApp y magic links; checklist documental, covenant chaser y escalaciones. Fuente: https://reedeck.com/

Third-party risk / compliance workflow:
- Diligent 3rdRisk: repositorio central, monitoreo continuo, alertas, surveys, sign-offs e integraciones con Teams/Slack. Fuente: https://www.diligent.com/products/third-party-risk-management
- RiskRunk: service engagement, inherent risk, DDQ por tier, vendor portal, review/challenge, residual risk y auditoria. Fuente: https://www.riskrunk.com/
- VISO Trust: continuous TPRM loop, requerimientos por tier, portal, AI agent para solicitar artefactos y seguimiento. Fuente: https://visotrust.com/platform/
- Whistic: monitoreo continuo, response workflows, assessment AI y risk insights. Fuente: https://www.whistic.com/
- EffortlessRisk: intake, review, screening, assessment, decision, monitoring, risk scoring y audit trail. Fuente: https://www.effortlessrisk.com/

AI due diligence / data room intelligence:
- AlphaSense Due Diligence Workspace: revision de VDR, agentes de diligence, analisis AI y outputs para comite. Fuente: https://help.alpha-sense.com/hc/en-us/articles/51920171391635-Due-Diligence-Workspace-Overview
- InsightDDX: ingestion segura, analisis de documentos, extraccion de obligaciones, riesgos, consistencia cruzada y resumen ejecutivo. Fuente: https://insightddx.com/
- DaRA: agentes especializados, hallazgos source-traced, razonamiento cross-document y memo IC-ready. Fuente: https://redflag.epsa.app/

KYC/KYB / identity and decision orchestration:
- Alloy: KYC/KYB, fraud, credit decisioning, policy workflows, testing, versioning y red de proveedores. Fuente: https://www.alloy.com/credit
- Alloy Orchestration: vendor-neutral orchestration, workflow editor, policy library, auditabilidad y simulacion de cambios. Fuente: https://www.alloy.com/orchestration-decisioning-engine
- Middesk KYB: business verification, sanctions, adverse media, KYC de personas asociadas, workflow de decision y monitoreo. Fuente: https://www.middesk.com/solutions/verification
- Middesk Docs: Business como objeto central, verification lifecycle, review tasks y decision basada en resultados. Fuente: https://docs.middesk.com/verify-business

## Comparacion con lo que ya lleva NUXERA

NUXERA ya tiene bases valiosas:
- Experiencia por rol: solicitante, otorgante y admin.
- Applicant checklist, guided mission, document center y project workspace.
- Otorgante con Gestion de expedientes separada de Mesa de decision.
- Evidence ledger local/remoto, autorizado por rol.
- Admin readiness, controles, audit package, health signals y asignaciones/SLA.
- Outbox de notificaciones con dry-run, dedupe, listado, batch manual y worker email protegido por dos banderas backend.
- Chat/agente conversacional controlado por rol, con fuentes autorizadas y guardrails.
- Politica de proveedores IA con modelos principales para informacion sensible y modelos secundarios para bajo riesgo.

Brecha principal:
NUXERA esta muy avanzada como arquitectura controlada, pero todavia necesita ciclos vivos. Lo que falta no es mas UI decorativa: falta que un hecho real del solicitante genere evidencia, evento, notificacion, tarea, revision, decision humana, auditoria y seguimiento visible para cada rol.

# Tres Grandes Bloques Por Implementar

## Bloque 1: Expediente Vivo y Timeline Operacional

### Objetivo

Crear una linea de tiempo real por expediente que unifique acciones, evidencias, solicitudes, asignaciones, SLA, notificaciones, conversaciones y auditoria relevante.

Este bloque convierte a NUXERA en un sistema operativo de expediente, parecido a lo que hacen nCino, Reedeck, RiskRunk y Diligent: todos los actores ven el mismo proceso, pero con permisos y lenguaje segun su rol.

### Ciclo real a conectar

1. Solicitante actualiza checklist, responde una solicitud o carga evidencia.
2. NUXERA registra un evento operacional del expediente.
3. El otorgante ve el evento en Gestion de expedientes y sabe si elimina blockers o requiere accion.
4. Si el evento amerita notificacion, se genera intent/outbox con dedupe.
5. Admin ve el mismo evento como trazabilidad, SLA, auditoria y health signal.
6. Mesa de decision consume solo eventos/evidencia autorizada y conserva decision humana.

### Entregables propuestos

Backend:
- Crear contrato read-only inicial `nuxera_case_events` o agregador virtual antes de SQL definitiva.
- Endpoint `GET /api/nuxera/orders/:orderId/timeline` para solicitante propietario.
- Endpoint `GET /api/nuxera/grantor/orders/:orderId/timeline` para otorgante autorizado.
- Endpoint admin `GET /api/nuxera/admin/orders/:orderId/timeline` con permisos `nuxera:admin:read`.
- Normalizar eventos desde fuentes existentes antes de crear nuevas tablas: applicant checklist state, evidence links, information requests, case assignments, notification outbox, audit logs y conversation audit metadata.

Frontend:
- Timeline en solicitante: estado de expediente, evidencias entregadas, faltantes, respuestas pendientes y proximos pasos.
- Timeline en Gestion de expedientes: blockers, SLA, owner, evidence-ready, notification state y handoff readiness.
- Timeline en Admin: auditoria, eventos tecnicos, fallos de notificacion, acciones humanas y health signals.

Guardrails:
- No mostrar evidencia sensible dentro de emails o timeline si el rol no tiene permiso.
- No exponer mensajes completos de chat en audit logs; solo metadata.
- No activar writes productivos sin SQL/RLS verificada.
- No mover casos automaticamente a Mesa; solo preparar/handoff preview hasta aprobacion.

Criterios de terminado:
- Un expediente real puede explicar que paso, quien debe actuar, que falta y cual es el siguiente paso.
- El otorgante deja de depender de pantallas separadas para entender el estado.
- Admin puede auditar el ciclo sin leer documentos sensibles.
- Tests cubren propietario, otorgante autorizado, admin y acceso denegado.

## Bloque 2: Data Room Intelligence y Paquete de Decision Trazable

### Objetivo

Convertir la evidencia documental en hallazgos trazables, consistencia cruzada y paquetes de decision no vinculantes para la Mesa.

Este bloque acerca NUXERA a AlphaSense Due Diligence Workspace, InsightDDX y DaRA: no basta con tener documentos; hay que extraer riesgos, contradicciones, gaps y soporte para comite con source tracing.

### Ciclo real a conectar

1. Solicitante entrega documentos o evidence links.
2. NUXERA clasifica evidencia por tipo, estado y relevancia.
3. Intelligence genera hallazgos con referencia a documento/fuente disponible.
4. Strategy/Finance consumen hallazgos para construir contexto de decision.
5. Otorgante revisa preguntas, condiciones y riesgos en Mesa.
6. Admin ve cobertura, trazabilidad y riesgos de automatizacion.

### Entregables propuestos

Backend:
- Extender evidence links con provenance fuerte: `sourceType`, `documentId`, `page`, `section`, `extractionId`, `confidence`, `reviewStatus`.
- Crear agregador `decisionEvidencePackage` por orderId, read-only al inicio.
- Reutilizar `documentIntelligenceService`, `nuxeraEvidenceLinkService`, `readinessMemoService` y audit logs.
- Agregar endpoint `GET /api/nuxera/grantor/orders/:orderId/decision-package` para otorgante autorizado.
- Agregar endpoint admin read-only para coverage/risk: `GET /api/nuxera/admin/orders/:orderId/evidence-coverage`.

Frontend:
- Mesa de decision debe mostrar: tesis, hallazgos, gaps, contradicciones, preguntas pendientes, condiciones sugeridas y evidencia fuente.
- Gestion de expedientes debe mostrar si el caso esta listo para Mesa segun evidencia verificable, no solo por status.
- Solicitante debe ver faltantes accionables, no hallazgos internos o sensibles.
- Admin debe ver coverage por motor: Finance, Intelligence, Markets, Strategy, Compliance.

Agentes:
- Los agentes pueden resumir, clasificar, detectar contradicciones y proponer preguntas.
- Los agentes no pueden aprobar financiamiento, emitir term sheet, prometer envio o cambiar permisos.
- Para informacion sensible: OpenAI/Anthropic segun policy; Kimi/DeepSeek solo bajo riesgo/anonymized si la policy lo permite.

Guardrails:
- Todo hallazgo de AI debe tener fuente o declararse como inferencia.
- Sin source tracing no debe entrar al paquete de decision como evidencia fuerte.
- Todo paquete de decision sigue siendo no vinculante y requiere revision humana.
- No escribir en data room ni modificar documentos desde el agente.

Criterios de terminado:
- Mesa de decision puede responder: que sabemos, que falta, que contradice, que riesgo existe, que fuente lo respalda.
- Admin puede ver cobertura y riesgos sin leer todo el data room.
- Solicitante recibe acciones claras y comprensibles.
- Tests cubren source tracing, fallback sin evidencia, permisos por rol y output guardrails.

## Bloque 3: Orquestacion de Riesgo, KYB/KYC, Notificaciones y Monitoreo Continuo

### Objetivo

Unificar screening, KYB/KYC, politicas de riesgo, decision/refer/manual review, notificaciones y monitoreo continuo en un flujo operativo.

Este bloque acerca NUXERA a Alloy, Middesk, Diligent, VISO Trust y Whistic: una plataforma madura no solo revisa un expediente una vez; orquesta fuentes, aplica reglas, manda a revision humana, alerta cambios y deja historial auditable.

### Ciclo real a conectar

1. Se crea o actualiza el expediente/empresa/personas asociadas.
2. NUXERA ejecuta o consulta screenings disponibles: sanciones, PEP, listas regulatorias, beneficiarios, entidades, validaciones fiscales/registrales y fuentes externas.
3. Se calcula risk tier / readiness / refer/manual review.
4. El sistema genera tareas, requests o notificaciones segun reglas.
5. Admin monitorea fallos, SLA, colas de revision, provider health y audit trail.
6. Otorgante consume solo el resultado autorizado y trazable para decision humana.

### Entregables propuestos

Backend:
- Crear un `riskOrchestrationService` que no duplique servicios existentes, sino que agregue resultados de screening ya presentes: OFAC, PEP, sanctions, SAT/CNBV/registries, beneficiary owners, document intelligence, scoring/readiness.
- Endpoint `GET /api/nuxera/orders/:orderId/risk-profile` con salida por rol.
- Endpoint admin `GET /api/nuxera/admin/risk-health` para proveedor, latencia, errores, freshness y cobertura.
- Motor inicial de policy rules declarativas: `approve/refer/reject/manual-review-required`, pero sin decisiones automaticas productivas hasta aprobacion.
- Integrar outbox: eventos de SLA, evidencia faltante, decision-ready, screening-risk-changed y provider-failure.

Frontend:
- Admin: dashboard ejecutivo de riesgo y health: overdue, due soon, risk tiers, failed screenings, notification failures, manual-review volume.
- Otorgante: resumen de risk profile autorizado, con explicabilidad y blockers.
- Solicitante: solo acciones necesarias y estado comprensible; nunca lenguaje interno de riesgo sensible si no corresponde.

Notificaciones:
- Completar historial/auditoria de delivery batch: intentos, sent, failed, suppressed, provider, reason, timestamps.
- Crear health summary de outbox: queued, failed, suppressed, last run, gates, email worker, cron/manual mode.
- Mantener envio real con dos banderas backend y runbook aprobado.
- WhatsApp/in-app siguen como canales no implementados hasta contrato dedicado.

Agentes:
- Admin assistant puede explicar fallos, freshness y SLA con metadata.
- Grantor assistant puede resumir riesgo autorizado y preparar preguntas.
- Applicant assistant puede convertir faltantes en instrucciones claras.
- Ningun agente puede cambiar risk tier, aprobar/rechazar o ejecutar envios automaticamente.

Guardrails:
- KYB/KYC y screening deben ser auditables, versionados y con fuente.
- Reglas de policy deben tener version y rollback.
- Cambios de proveedor IA o proveedor de datos deben poder probarse en shadow/dry-run.
- Ningun resultado externo debe usarse como decision final sin human review cuando el flujo lo marque como refer/manual.

Criterios de terminado:
- Admin puede responder si la operacion esta sana: que falla, que vence, que riesgo crece y que proveedor esta degradado.
- Otorgante puede priorizar expedientes por riesgo/evidencia/SLA sin abrir diez modulos.
- Solicitante recibe acciones concretas sin ver complejidad interna.
- Notificaciones dejan de ser solo infraestructura y se vuelven parte observable del ciclo.

# Orden Recomendado

1. Implementar Bloque 1 primero: Expediente Vivo y Timeline Operacional.
   Razon: conecta lo que ya existe sin requerir de inmediato nuevos proveedores externos. Es el puente entre solicitante, otorgante, admin, outbox, chat y auditoria.

2. Implementar Bloque 2 despues: Data Room Intelligence y Paquete de Decision.
   Razon: fortalece Mesa de decision y crea diferenciacion real frente a plataformas que solo administran checklist.

3. Implementar Bloque 3 despues: Orquestacion de Riesgo, KYB/KYC y Monitoreo.
   Razon: es el bloque mas amplio y sensible; requiere reglas, fuentes, versiones, provider health y probablemente decisiones de SQL/RLS/operacion.

# No Hacer Todavia

- No crear nuevas pestanas si no conectan un ciclo real.
- No activar envios productivos de email, WhatsApp o in-app sin aprobacion y runbook.
- No aplicar SQL/RLS en produccion sin evidencia controlada.
- No usar agentes para decidir, aprobar, rechazar, prometer financiamiento o cambiar permisos.
- No mostrar evidencia sensible fuera del rol autorizado.
- No hacer mass rename de IDs tecnicos, rutas, storage keys, tablas o env vars.

# Definicion De Plataforma Madura Para NUXERA

NUXERA debe poder demostrar, por cada expediente:

1. Que se solicito.
2. Que entrego el solicitante.
3. Que falta.
4. Que evidencia respalda cada hallazgo.
5. Que riesgos existen.
6. Quien debe actuar.
7. Que SLA corre.
8. Que notificaciones se generaron o fallaron.
9. Que dijo o hizo el agente, sin guardar contenido sensible indebidamente.
10. Que puede revisar el otorgante.
11. Que puede auditar admin.
12. Que decision humana queda pendiente o registrada.

Cuando estos doce puntos funcionen como un ciclo trazable, NUXERA dejara de ser una reestructura visual y se convertira en una plataforma operativa comparable con el mercado investigado.

## Avance De Implementacion - 2026-07-23

Bloque 1 ya inicio con el primer ciclo real read-only:
- Servicio backend `nuxeraCaseTimelineService`.
- Endpoints de timeline para solicitante propietario, otorgante autorizado y admin.
- Agregacion de fuentes existentes sin SQL nueva: expediente, checklist, evidencia, solicitudes de informacion, asignaciones/SLA, outbox y audit logs.
- Panel compartido de timeline en solicitante, otorgante y admin.

Estado: Timeline 1.2 + Decision Package inicial + Risk Orchestration inicial implementados como capa read-only. Ya existe proyeccion `case_events` sin persistencia, paquete de decision trazable para otorgante, coverage admin, risk profile por rol y risk health admin. Todavia falta SQL/RLS de `nuxera_case_events`, unit tests dedicados de decision/risk, provenance fuerte persistido, proveedores KYB/KYC reales y cualquier write path productivo bajo aprobacion separada.

## Avance Local Sin Commit - 2026-07-23

Se avanzo el cierre de los pendientes principales sin activar produccion:
- Notificaciones: health read-only del outbox con endpoint admin, adaptador frontend y tarjetas de fallidas/pendientes/senales operativas.
- Agentes/chat: auditoria conversacional incorporada al timeline como tipo `conversation`, sin persistir ni mostrar texto de mensajes; readiness expone `auditMetadata` seguro.
- SQL/cutover: borradores aditivos para `nuxera_case_events` y provenance fuerte de evidencia, mas verificador local de drafts.
- Documentacion: nuevo `NUXERA_CUTOVER_REVIEW_PACK.md` para retomar revision antes de commit/push/deploy.

Lo que sigue antes de produccion:
- Correr suite completa y corregir cualquier regresion.
- Revisar SQL/RLS con identidades reales en non-production.
- Definir si `nuxera_case_events` sera ledger persistido o seguira como proyeccion virtual hasta tener evidencia suficiente.
- Completar historial de delivery real solo despues de aprobar flags, runbook y proveedor de email.
- Definir retencion del chat antes de persistir cualquier conversacion completa.
