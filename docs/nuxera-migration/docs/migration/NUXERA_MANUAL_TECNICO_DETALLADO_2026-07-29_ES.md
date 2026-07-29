# NUXERA - Manual Tecnico Detallado

Fecha: 2026-07-29  
Audiencia: equipo tecnico, CTO fractional, integradores, seguridad, DevOps y due diligence tecnico.

## 1. Arquitectura General

NUXERA conserva el repositorio NSD pero cambia la experiencia visible y operativa hacia la marca NUXERA. El frontend esta construido con React/Vite y expone una shell por roles. El backend Node/Express concentra rutas NUXERA, contratos de servicios, gates de persistencia, notificaciones, agentes y readiness operacional.

Capas principales:

- Frontend: pagina publica, dashboard, workspace de solicitante, workspace de otorgante y consola admin.
- Backend: rutas protegidas, servicios de inteligencia jurisdiccional, contratos de notificaciones, readiness de agentes y persistencia operativa.
- Datos: Supabase/SQL como destino previsto para expedientes, eventos, aprobaciones, documentos y trazabilidad.
- IA: proveedores principales OpenAI y Anthropic; proveedores secundarios Kimi/DeepSeek para tareas de bajo riesgo; NVIDIA como experimental/no critico.
- Integraciones: fuentes publicas, APIs privadas por convenio, correo transaccional y registros regulatorios.

## 2. Frontend

El frontend debe mantener tres separaciones claras:

- Solicitante: prepara expediente y ve brechas propias.
- Otorgante: revisa archivos autorizados, comite, jurisdiccion y riesgos.
- Admin: opera seguridad, fuentes, gates, notificaciones, agentes y readiness.

Los escenarios visuales comprobados fueron:

- Public home.
- Applicant dashboard.
- Funding provider workspace.
- Admin operations.

Las capturas estan en `docs/nuxera-migration/docs/migration/assets/qa-2026-07-29/`.

## 3. Backend y Contratos

Servicios relevantes ya modelados:

- `nuxeraJurisdictionIntelligenceService`: produce analisis de jurisdiccion, fuentes regulatorias, alcance, limitaciones y plan de adquisicion de fuentes.
- `nuxeraOperationalPersistenceService`: define eventos y compuertas para escribir estado operativo de NUXERA.
- `nuxeraConversationAgentReadinessService`: define manifiesto de contexto, restricciones de agente y proveedores permitidos por riesgo.
- Rutas NUXERA: exponen readiness, evidencia jurisdiccional y planes de persistencia bajo autenticacion.

Principio tecnico: cualquier operacion sensible debe fallar cerrada sin token, rol y autorizacion. Las demos con localStorage no prueban autorizacion productiva; solo permiten QA visual.

## 4. Agentes y Proveedores IA

Politica recomendada:

- OpenAI: razonamiento, analisis complejo, agentes principales, tareas de cumplimiento de mayor sensibilidad.
- Anthropic: analisis documental, explicaciones largas, segundo proveedor principal y fallback serio.
- Kimi: proveedor barato para tareas de bajo riesgo, borradores, clasificacion preliminar, resumen no vinculante y soporte interno.
- DeepSeek: mantener detras de proveedores principales y solo para bajo riesgo si el costo/beneficio lo justifica.
- NVIDIA: experimental; no bloquear presentacion ni cutover por este proveedor.

El agente debe alimentarse de:

- Metadatos del expediente.
- Checklist y requisitos.
- Documentos permitidos por autorizacion.
- Historial de eventos.
- Estado de notificaciones.
- Fuentes regulatorias.
- Contexto pais/estado/ciudad.

Restricciones:

- No aprobar financiamiento.
- No enviar correos sin gate.
- No mostrar datos fuera del alcance del usuario.
- No inventar evidencia.
- No convertir fuentes condicionales en fuentes verificadas.

## 5. Notificaciones

El servicio de correos debe operar en fases:

1. Dry-run local: genera payloads y plantillas, no envia.
2. Sandbox: envia a destinatarios aprobados, sin adjuntos sensibles.
3. Produccion limitada: eventos de baja sensibilidad con logs y reintentos.
4. Produccion completa: requiere aprobacion legal, privacidad, plantillas firmadas y monitoreo.

Eventos sugeridos:

- Expediente creado.
- Documento faltante.
- Evidencia recibida.
- Cambio de estatus.
- Invitacion a data room.
- SLA proximo a vencer.
- Revision humana requerida.
- Decision de comite pendiente o registrada.

## 6. Datos, RLS y Persistencia

Antes de produccion plena deben validarse:

- Tablas para eventos de caso.
- Tabla o ledger para aprobaciones de notificacion.
- Evidencia de procedencia documental.
- Politicas RLS para solicitante, otorgante y admin.
- Tokens reales o equivalentes de prueba.
- Pruebas de que un solicitante no ve expedientes ajenos.
- Pruebas de que un otorgante solo ve data rooms autorizados.
- Pruebas de que admin requiere rol privilegiado.

## 7. Entes Regulatorios y Pais/Ciudad

Para Medio Oriente, especialmente EAU, la plataforma debe clasificar fuentes como:

- Publica descargable o consultable.
- Publica sin API estable.
- Privada por convenio.
- Requiere aprobacion gubernamental.
- No disponible para automatizacion.

Fuentes iniciales: UAE PASS, EOCN, SCA/CMA, CBUAE, DFSA, FSRA/ADGM, ADGM Registration Authority, VARA, FTA, National Economic Registry y registros economicos locales.

Para pais/estado/ciudad, el motor debe separar datos economicos, politicos, sociales, regulatorios y territoriales, con fecha de consulta, fuente y limitacion.

## 8. Pruebas Ejecutadas en esta Sesion

- Backend enfocado: 86/86 pruebas aprobadas.
- Frontend NUXERA: 125/125 pruebas aprobadas.
- Build Vite: aprobado.
- Capturas Playwright: 4/4 escenarios aprobados.
- Smoke Vercel: aprobado para home main y alias production.
- Smoke Render: timeout de 20 segundos en esta corrida; debe revisarse disponibilidad/cold start antes de demo.

## 9. Pendientes Tecnicos Reales

1. Ejecutar RLS fase 2 con usuarios/tokens reales o staging.
2. Rehearsal SQL no productivo para persistencia.
3. Probar proveedor de correo sandbox con destinatario aprobado.
4. Verificar Render o mover backend a runtime mas estable antes de demo con APIs vivas.
5. Definir matriz final de fuentes privadas y convenios.
6. Ejecutar cutover controlado de Nexus a NUXERA.
