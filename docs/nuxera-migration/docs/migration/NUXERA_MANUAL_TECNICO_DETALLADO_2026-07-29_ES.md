# NUXERA - Manual Tecnico Extendido

Fecha/Date: 2026-07-29
Audiencia/Audience: equipo tecnico, CTO, integradores, DevOps, seguridad y due diligence tecnico.

## 1. Arquitectura

- React/Vite frontend
- Node/Express backend
- Supabase/SQL previsto
- Vercel frontend
- Render backend actual con latencia pendiente
- Shell por roles
- Servicios NUXERA protegidos
- Automatizaciones por gates


## 2. Frontend

- Separacion por rol
- ES/EN
- Sin identidad Nexus visible
- Vistas demo no prueban auth real
- Decision desk distinto de case management
- Admin como control operativo


## 3. Backend y servicios

- nuxeraJurisdictionIntelligenceService
- nuxeraOperationalPersistenceService
- nuxeraConversationAgentReadinessService
- rutas readiness/evidencia/persistencia/admin
- fallo cerrado sin token/rol/autorizacion


## 4. Modelo de datos

- usuarios
- roles
- expedientes
- empresas
- personas relacionadas
- proyectos
- documentos
- requisitos
- eventos
- notificaciones
- aprobaciones
- fuentes regulatorias
- agent_runs
- jurisdiction_snapshots

Tablas sugeridas:

- nuxera_case_events
- nuxera_notification_approvals
- nuxera_document_provenance
- nuxera_regulatory_sources
- nuxera_agent_runs
- nuxera_jurisdiction_snapshots


## 5. RLS y seguridad

1. Solicitante A no ve B
2. Otorgante no autorizado no ve expediente
3. Otorgante solo ve data room permitido
4. Admin requiere rol
5. Service role solo flujos controlados
6. Agente recibe contexto filtrado
7. Correo no expone documentos


## 6. Notificaciones

Componentes: eventos, plantillas, outbox, proveedor, approvals, reintentos y logs. Fases: dry-run, sandbox, produccion limitada y produccion completa.


## 7. Agentes

- Context Manifest obligatorio
- OpenAI/Anthropic principales
- Kimi bajo riesgo
- DeepSeek bajo riesgo detras de principales
- NVIDIA experimental
- Prohibido aprobar o emitir decision vinculante
- Prohibido inventar evidencia o filtrar datos


## 8. Jurisdiccion

Analiza economico, politico, social, regulatorio, territorial, reputacional, documental, financiero, operativo, jurisdiccional. Cada conclusion necesita fuente, fecha, alcance, limitacion, confianza y siguiente accion.


## 9. Medio Oriente

- UAE PASS
- EOCN
- SCA/CMA
- CBUAE
- DFSA
- FSRA/ADGM
- ADGM Registration Authority
- VARA
- FTA
- National Economic Registry
- DET/DED Dubai
- ADDED Abu Dhabi
- registros economicos locales


## 10. Deploy y cutover

1. Congelar cambios
2. Ejecutar tests
3. Validar Vercel
4. Calentar backend
5. Validar RLS
6. Validar sandbox correo
7. Revisar URLs Nexus
8. Redirigir a NUXERA
9. Mantener rollback
10. Monitorear 24-48h


## 11. Pruebas recientes

- Backend 86/86
- Frontend 125/125
- Build Vite aprobado
- QA visual 4/4
- Vercel HTTP 200
- Render timeout 20s pendiente


## 14. Contratos de servicio esperados

Cada servicio backend debe tener entrada, salida, errores controlados y logs. La salida debe ser JSON trazable y no debe depender de textos ambiguos.

### Contrato jurisdiction-readiness

Entrada: orderId, usuario, rol, idioma y contexto autorizado. Salida: status, evidence, limitations, nextActions y traceId. Errores: AUTH_MISSING, AUTH_FORBIDDEN, SOURCE_UNAVAILABLE, VALIDATION_FAILED. Pruebas: sin token debe fallar cerrado; con rol incorrecto debe negar; con contexto valido debe responder sin filtrar datos ajenos.

### Contrato grantor-jurisdiction-evidence

Entrada: orderId, usuario, rol, idioma y contexto autorizado. Salida: status, evidence, limitations, nextActions y traceId. Errores: AUTH_MISSING, AUTH_FORBIDDEN, SOURCE_UNAVAILABLE, VALIDATION_FAILED. Pruebas: sin token debe fallar cerrado; con rol incorrecto debe negar; con contexto valido debe responder sin filtrar datos ajenos.

### Contrato operational-persistence-plan

Entrada: orderId, usuario, rol, idioma y contexto autorizado. Salida: status, evidence, limitations, nextActions y traceId. Errores: AUTH_MISSING, AUTH_FORBIDDEN, SOURCE_UNAVAILABLE, VALIDATION_FAILED. Pruebas: sin token debe fallar cerrado; con rol incorrecto debe negar; con contexto valido debe responder sin filtrar datos ajenos.

### Contrato conversation-agent-readiness

Entrada: orderId, usuario, rol, idioma y contexto autorizado. Salida: status, evidence, limitations, nextActions y traceId. Errores: AUTH_MISSING, AUTH_FORBIDDEN, SOURCE_UNAVAILABLE, VALIDATION_FAILED. Pruebas: sin token debe fallar cerrado; con rol incorrecto debe negar; con contexto valido debe responder sin filtrar datos ajenos.

### Contrato notification-approval-plan

Entrada: orderId, usuario, rol, idioma y contexto autorizado. Salida: status, evidence, limitations, nextActions y traceId. Errores: AUTH_MISSING, AUTH_FORBIDDEN, SOURCE_UNAVAILABLE, VALIDATION_FAILED. Pruebas: sin token debe fallar cerrado; con rol incorrecto debe negar; con contexto valido debe responder sin filtrar datos ajenos.

### Contrato document-provenance

Entrada: orderId, usuario, rol, idioma y contexto autorizado. Salida: status, evidence, limitations, nextActions y traceId. Errores: AUTH_MISSING, AUTH_FORBIDDEN, SOURCE_UNAVAILABLE, VALIDATION_FAILED. Pruebas: sin token debe fallar cerrado; con rol incorrecto debe negar; con contexto valido debe responder sin filtrar datos ajenos.

### Contrato case-events

Entrada: orderId, usuario, rol, idioma y contexto autorizado. Salida: status, evidence, limitations, nextActions y traceId. Errores: AUTH_MISSING, AUTH_FORBIDDEN, SOURCE_UNAVAILABLE, VALIDATION_FAILED. Pruebas: sin token debe fallar cerrado; con rol incorrecto debe negar; con contexto valido debe responder sin filtrar datos ajenos.

## 15. Matriz RLS tecnica

RLS debe probarse por tabla y rol.

- applicant can select own files only
- applicant cannot select other applicant files
- grantor can select authorized data rooms only
- grantor cannot select unshared documents
- admin can access operational panels only with privileged role
- service role writes require explicit backend gate
- agent context query must apply same filters as user role

## 16. Variables y compuertas

- NUXERA_WRITE_ENABLED controla escrituras reales
- NOTIFICATION_DRY_RUN controla envio
- AGENT_RUNTIME_ENABLED controla chat live
- SOURCE_PRIVATE_CONNECTORS_ENABLED controla APIs privadas
- RLS_PHASE2_VERIFIED documenta evidencia antes de cutover
- BACKEND_HEALTH_REQUIRED bloquea demo API si Render no responde

## 17. Observabilidad ampliada

- traceId por request
- userId y role en logs seguros
- latencia por endpoint
- errores por proveedor IA
- eventos de notificacion
- fallas de correo
- fuentes consultadas
- limitaciones devueltas
- intentos de acceso denegado
- metricas de cold start backend

## 18. Plan de hardening

1. agregar pruebas RLS con tokens staging
2. ejecutar migraciones en entorno no productivo
3. activar sandbox correo
4. probar agente con contexto filtrado
5. agregar health checks programados
6. documentar rollback
7. preparar seed de casos demo
8. validar ausencia de Nexus en rutas principales
9. bloquear rutas legacy o redirigirlas
10. preparar checklist go/no-go
