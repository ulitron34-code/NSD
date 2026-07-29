# NUXERA - Manual Funcional Detallado

Fecha: 2026-07-29  
Audiencia: especialistas de negocio, cumplimiento, originacion, otorgantes, equipo comercial e inversionistas.  
Estado: plataforma NUXERA en vivo para demostracion, con operaciones sensibles protegidas por compuertas y evidencia pendiente antes de produccion plena.

## 1. Que es NUXERA

NUXERA es una plataforma de inteligencia financiera y cumplimiento para preparar, revisar y monitorear expedientes de financiamiento. Su funcion principal es convertir informacion dispersa de una empresa, proyecto, beneficiarios, documentos y contexto jurisdiccional en un expediente entendible para decision humana.

La plataforma no debe interpretarse como un aprobador automatico de credito ni como sustituto de abogados, oficiales de cumplimiento o comites de inversion. Su valor es ordenar evidencia, mostrar brechas, activar revisiones, preparar paquetes de decision y dejar trazabilidad de lo que se sabe, lo que falta y lo que requiere validacion externa.

NUXERA esta dividida en cuatro superficies principales: pagina publica, solicitantes, otorgantes y administracion.

![Pagina publica NUXERA](./assets/qa-2026-07-29/public-home-en.png)

## 2. Pagina Publica

La pagina publica es la entrada comercial e institucional. Sirve para explicar a mercado, socios e inversionistas que NUXERA es una plataforma global de cumplimiento y riesgo enfocada en decisiones financieras con evidencia.

Paso a paso para usarla:

1. Entrar a la URL publica de NUXERA.
2. Revisar la propuesta de valor, cobertura global, industrias, integraciones y modelo operativo.
3. Cambiar idioma entre ES/EN cuando se requiera presentar a audiencias internacionales.
4. Entrar a Login o Sign Up para pasar de informacion publica a espacio operativo.

Que hace cada parte:

- Home: presenta identidad, promesa de producto y resumen de capacidades.
- Platform: explica el sistema como espacio de expediente, inteligencia y trazabilidad.
- Global coverage: muestra la logica de cobertura jurisdiccional y regulatoria.
- Industries: indica sectores que pueden estructurar expedientes.
- Integrations: comunica que NUXERA puede conectarse con APIs, fuentes publicas, proveedores de IA, correo y registros regulados.
- Implementation: orienta el proceso de adopcion y migracion.

Resultado esperado: el visitante entiende que NUXERA no es solo una pagina de financiamiento, sino una capa operativa para ordenar cumplimiento, riesgo, documentos y decision.

## 3. Solicitantes

El espacio de solicitantes es donde una empresa, promotor o proyecto prepara su expediente para solicitar capital. Aqui se concentra la informacion que despues podra revisar un otorgante autorizado.

![Panel de solicitante](./assets/qa-2026-07-29/applicant-dashboard-en.png)

Como entrar:

1. Iniciar sesion como solicitante.
2. Entrar al dashboard.
3. Confirmar que el encabezado indique NUXERA / Applicant o Solicitante.
4. Revisar el estado general de preparacion del expediente.

Flujo recomendado de trabajo:

1. Completar perfil de empresa y responsables. El solicitante agrega datos basicos de la entidad, estructura corporativa, representantes, beneficiarios y responsables del expediente.
2. Preparar informacion del proyecto. Se debe explicar que se va a financiar, monto, uso de fondos, etapa, ubicacion, sector, impacto esperado y supuestos financieros.
3. Cargar documentos. Segun el tipo de expediente, se cargan documentos corporativos, fiscales, financieros, identidad, permisos, contratos, garantias, evidencias tecnicas y documentacion de cumplimiento.
4. Revisar brechas. La plataforma muestra que documentos o datos faltan para que el expediente sea revisable.
5. Atender observaciones. Si el otorgante o el sistema marca evidencia faltante, el solicitante debe cargarla, corregirla o explicar por que no existe.
6. Mantener seguimiento. El solicitante consulta avance, estatus, proximos pasos, riesgos abiertos y solicitudes pendientes.

Como funciona la carga documental:

- El documento debe asociarse a una categoria: identidad, corporativo, fiscal, financiero, tecnico, regulatorio, proyecto, garantias o evidencia complementaria.
- La plataforma debe registrar metadatos: tipo, fecha, responsable, version, relacion con requisito y estado de revision.
- El documento no debe enviarse automaticamente por correo ni exponerse al otorgante sin reglas de autorizacion.
- En produccion, la evidencia debe persistirse con almacenamiento seguro, RLS y bitacora de acceso.

Que debe esperar el solicitante:

- Un porcentaje de preparacion.
- Lista clara de documentos faltantes.
- Indicadores de riesgo o revision humana.
- Mensajes de seguimiento y notificaciones cuando existan cambios.
- Un expediente que puede compartirse con otorgantes autorizados cuando se complete la preparacion minima.

Resultado esperado: expediente estructurado, con brechas visibles, documentos clasificados y condiciones claras para avanzar a revision.

## 4. Otorgantes

El espacio de otorgantes es para financiadores, analistas, fondos, bancos, family offices o equipos que revisan expedientes autorizados. Su funcion no es duplicar la pantalla del solicitante, sino analizar desde la perspectiva de riesgo, decision, SLA y comite.

![Mesa de decision de otorgante](./assets/qa-2026-07-29/grantor-workspace-en.png)

Como entrar:

1. Iniciar sesion como otorgante o funding provider.
2. Entrar a Decision desk para preparar revision ejecutiva.
3. Entrar a Case management para operar seguimiento, asignaciones y faltantes.
4. Revisar Finance, Intelligence, Markets o Strategy segun el tipo de analisis.

Diferencia entre Decision desk y Case management:

- Decision desk: responde si el caso esta listo para comite, que evidencia sustenta la revision, que preguntas debe resolver el comite y que condiciones humanas deben mantenerse.
- Case management: responde que casos estan abiertos, quien los atiende, que SLA existe, que faltantes bloquean avance y que solicitudes se deben enviar.

Analisis jurisdiccional y pais/estado/ciudad:

El otorgante necesita saber no solo quien pide recursos, sino donde se ejecutara el proyecto. NUXERA debe mostrar contexto economico, politico, social, regulatorio y territorial de pais, estado/provincia y ciudad cuando la informacion exista.

Este analisis debe incluir:

- Economia: crecimiento, inflacion, moneda, riesgo cambiario, sectores relevantes, deuda, inversion extranjera y estabilidad macro.
- Politica: estabilidad institucional, elecciones, cambios regulatorios, sanciones, conflictos, corrupcion percibida y gobernabilidad.
- Social/territorial: seguridad, conflictividad local, permisos, riesgos comunitarios, infraestructura, empleo, pobreza o presiones sociales.
- Regulacion: registros publicos, licencias, sectores restringidos, autoridades financieras, fiscalidad, beneficiarios finales y listas de sanciones.
- Municipio/provincia/ciudad: cuando existan datos publicos o APIs confiables, se debe aterrizar el riesgo local, no quedarse solo en pais.

Medio Oriente y Emiratos Arabes Unidos:

La plataforma ya incorpora la logica para tratar fuentes como UAE PASS, EOCN, SCA/CMA, CBUAE, DFSA, FSRA/ADGM, ADGM Registration Authority, VARA, FTA, National Economic Registry y registros economicos locales como fuentes publicas, condicionales o privadas. En solicitante estas fuentes no deben mostrarse como una capa externa invasiva; deben alimentar el score, checklist y faltantes. En otorgante si deben verse de forma robusta, con fuente, alcance, limitacion y siguiente accion.

Que debe esperar el otorgante:

- Casos priorizados por estatus, riesgo, brechas y SLA.
- Paquete de decision no vinculante.
- Evidencia autorizada, no inventada.
- Preguntas de comite.
- Condiciones pendientes.
- Contexto jurisdiccional y regulatorio trazable.
- Recomendaciones del agente solo como apoyo, nunca como aprobacion automatica.

Resultado esperado: revision mas rapida, ordenada y defendible ante comite, con claridad sobre que se puede decidir y que requiere validacion.

## 5. Administracion

El espacio admin controla operacion, seguridad, fuentes, agentes, notificaciones, persistencia y readiness de produccion.

![Operaciones admin](./assets/qa-2026-07-29/admin-operations-en.png)

Como entrar:

1. Iniciar sesion como administrador.
2. Entrar a Operations para estado operativo.
3. Entrar a Security para controles, RLS y proteccion de rutas.
4. Entrar a AI & agents para politicas de agentes.
5. Entrar a System para salud, compuertas, fuentes y despliegue.

Que hace admin:

- Supervisa usuarios y permisos.
- Revisa modulos protegidos.
- Administra fuentes regulatorias y su estado: live, publico, privado, convenio requerido o no disponible.
- Controla notificaciones automaticas y sandbox de correo.
- Define limites del agente conversacional.
- Revisa persistencia operativa antes de activar escrituras reales.
- Prepara evidencia para cutover de Nexus a NUXERA.

Notificaciones:

El servicio de notificaciones debe enviar correos automaticos a solicitantes y otorgantes para eventos como alta de expediente, documento faltante, solicitud de evidencia, cambio de estatus, invitacion a data room, recordatorio de SLA, alerta de riesgo y decision humana pendiente. En etapa actual debe operar primero en sandbox/dry-run, con plantillas aprobadas y sin adjuntar evidencia sensible.

Agente/chat:

El chat debe ayudar a explicar el expediente, responder preguntas sobre requisitos, resumir riesgos, orientar carga documental y preparar preguntas de comite. Debe alimentarse de datos autorizados: metadatos del expediente, checklist, documentos permitidos, bitacora, fuentes regulatorias y contexto jurisdiccional. No debe inventar evidencia, no debe aprobar operaciones, no debe enviar correos sin autorizacion y no debe mostrar informacion de otro usuario.

Resultado esperado: administracion puede demostrar control, no solo funcionalidad visual.

## 6. Resultado Global

NUXERA queda lista como experiencia demostrable e investor-ready. Para produccion plena faltan principalmente pruebas con datos reales controlados, RLS fase 2, persistencia SQL final, proveedor de correo sandbox/live, decision de cutover y acuerdos/API de fuentes privadas.
