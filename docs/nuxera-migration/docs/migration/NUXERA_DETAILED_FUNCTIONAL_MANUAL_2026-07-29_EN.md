# NUXERA - Extended Functional Manual

Fecha/Date: 2026-07-29
Audiencia/Audience: negocio, cumplimiento, usuarios operativos, socios e inversionistas.

Este documento reemplaza el manual corto previo. Su objetivo es explicar NUXERA como plataforma operativa, no como resumen ejecutivo: que hace cada area, como entrar, que datos se capturan, como se cargan documents, que revisa el funding provider, como actua administracion, que hacen agentes/notificaciones y que resultado produce cada ciclo.

## 1. Concepto general

NUXERA organiza files de financiamiento con evidencia, cumplimiento, riesgo y revision humana. No aprueba credito automaticamente. La plataforma separa pagina publica, applicants, funding providers y administracion para evitar que captura, analisis y control se mezclen. El resultado esperado es un file defendible, trazable y listo para comite humano.


## 2. Principios de operacion

- La decision final siempre corresponde a humanos autorizados
- Todo dato importante debe tener fuente, documento, usuario, fecha o evento
- Los roles se separan por permisos y RLS
- Los documents sensibles no se adjuntan por correo por defecto
- El agente solo usa contexto autorizado
- Las fuentes externas muestran alcance y limitaciones
- Demo e investor-ready no equivalen a production con datos reales


## 3. Public site

![Public site](./assets/qa-2026-07-29/public-home-en.png)

La pagina publica presenta NUXERA al mercado. No carga documents sensibles ni genera score; explica propuesta de valor, cobertura global, industrias, integraciones e implementacion.


### Como operar esta vista

1. Abrir URL publica
2. Verificar marca NUXERA Financial Intelligence
3. Cambiar idioma ES/EN si aplica
4. Revisar Home, Platform, Global coverage, Industries, Integrations e Implementation
5. Entrar a Login o Sign Up solo cuando el usuario pasara a workspace



## 4. Workspace de applicants

![Applicant](./assets/qa-2026-07-29/applicant-dashboard-en.png)

El workspace de applicants prepara el file antes de compartirlo. Debe contestar que falta, que documents subir, que riesgos estan abiertos y que sigue.


### Ingreso y primera lectura

1. Iniciar sesion como applicant
2. Abrir dashboard
3. Confirmar NUXERA / Applicant o Applicant
4. Revisar readiness
5. Entrar a empresa, responsables, proyecto, documents y seguimiento



### Empresa y responsables

Captura nombre legal, pais, registro, domicilio, sector, representante, beneficiarios finales y contactos. Documentos tipicos:

- Acta constitutiva o registro equivalente
- Poderes y representante legal
- Identificacion de responsables y beneficiarios finales
- Comprobante fiscal o numero tributario
- Registro mercantil o licencia comercial
- Estructura accionaria
- Estados financieros

NUXERA clasifica, marca faltantes, alimenta checklist y prepara senales para funding provider.



### Proyecto y uso de fondos

Captura ubicacion pais/estado/ciudad, sector, monto, moneda, uso de fondos, etapa, plazo, garantias, modelo, impacto y permisos. Documentos tipicos:

- Modelo financiero
- Presupuesto de inversion
- Permisos y licencias
- Contratos relevantes
- Evidencia tecnica
- Garantias
- Informacion ESG o impacto



### Carga documental paso a paso

1. Seleccionar requisito o categoria
2. Subir archivo
3. Asociar a requisito
4. Confirmar version, fecha y responsable
5. Esperar estado recibido/en revision/observado/passed
6. Atender observacion o cargar nueva version

Categorias: identidad, corporativo, fiscal, financiero, legal, tecnico, proyecto, garantias, cumplimiento, regulatorio, impacto y evidencia complementaria.



### Score, seguimiento y agente

Readiness mide preparacion, no aprobacion. El agente puede explicar faltantes y requisitos, pero no promete condiciones, no aprueba financiamiento, no inventa datos y no muestra informacion de otros usuarios.



## 5. Workspace de funding providers

![Funding provider](./assets/qa-2026-07-29/grantor-workspace-en.png)

El workspace de funding providers transforma files autorizados en analisis, comite y seguimiento. No debe duplicar la pantalla de applicant.


### Decision desk

Prepara paquete de decision no vinculante: resumen, evidencia, riesgos, preguntas de comite, condiciones humanas, fuentes y limitaciones.



### Case management

Mueve el caso: responsable, SLA, faltantes, solicitudes, files detenidos e intervencion humana. Decision desk mira la decision; Case management mueve la operacion.



### Finance e intelligence

Finance revisa monto, moneda, uso de fondos, repago, garantias, modelo y sensibilidad. Intelligence revisa empresa, representantes, beneficiarios, sanciones, reputacion, fuentes abiertas y hallazgos trazados.



### Pais, ciudad y contexto

Debe analizar dimensiones economico, politico, social, regulatorio, territorial. El flujo es: ubicacion capturada por applicant, fuente publica/API, separacion de datos confirmados y pendientes, resumen para funding provider con fecha, fuente, alcance y limitacion.



### Medio Oriente y EAU

Fuentes consideradas:

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

En applicant alimentan checklist y score sin saturar. En funding provider se muestran explicitamente con alcance, estatus, tipo de acceso, limitacion y siguiente accion.



### Agente para funding provider

Puede resumir, preparar preguntas de comite, explicar faltantes, comparar evidencia, redactar solicitudes y memo no vinculante. No puede aprobar, emitir term sheet vinculante, ignorar faltantes, consultar sin permisos ni enviar correos sin gate.



## 6. Administracion

![Admin](./assets/qa-2026-07-29/admin-operations-en.png)

Admin controla usuarios, permisos, fuentes, agentes, notificaciones, seguridad, RLS, persistencia y cutover.


### Ingreso y modulos

1. Iniciar sesion admin
2. Revisar Operations
3. Revisar Security/RLS
4. Revisar AI & agents
5. Revisar System/deploys/gates
6. Revisar fuentes regulatorias



### Usuarios y permisos

- Alta/baja de usuarios
- Roles applicant/funding provider/admin
- Data rooms autorizados
- Separacion demo vs production
- Revision de accesos antes de compartir evidencia



### Catalogo de fuentes

- Nombre, pais, jurisdiccion y tipo de dato
- Modo de acceso: publico, descarga, API, convenio o no disponible
- Estatus live, condicional, privado, pendiente o bloqueado
- Fecha de ultima revision y responsable
- Limitaciones para no exagerar cobertura
- Siguiente accion para integracion real



### Notificaciones

Eventos: bienvenida, file creado, documento faltante, documento recibido, observacion, aclaracion, estatus, nuevo file autorizado, evidencia nueva, SLA, revision humana, memo listo y riesgo critico. Fases: dry-run, sandbox, production limitada y production completa.



### Agentes e IA

OpenAI y Anthropic son principales; Kimi bajo costo/bajo riesgo; DeepSeek detras de principales y bajo riesgo; NVIDIA experimental. Admin ve proveedor, tareas permitidas, riesgo maximo, logs, runtime y fallas.



### Persistencia y cutover

Antes de production: eventos, aprobaciones, procedencia documental, RLS, tokens staging, logs y rollback. Cutover: inventario Nexus, QA, redireccion, monitoreo y plan de regreso.



## 7. Ciclo completo

1. Applicant crea file
2. Carga datos y documents
3. NUXERA calcula readiness
4. Admin controla fuentes y gates
5. Funding Provider accede si esta autorizado
6. Funding Provider revisa evidencia y riesgos
7. Agente apoya bajo limites
8. Notificaciones mueven solicitudes
9. Persistencia registra eventos
10. Decision humana se documenta


## 8. Matriz ampliada de documentos

La operacion documental debe permitir que cada archivo tenga categoria, requisito asociado, version, fecha, responsable, estado y observacion. La plataforma debe evitar que un documento quede como archivo suelto sin relacion operativa.

Categorias:

- Identidad
- Corporativo
- Fiscal
- Financiero
- Legal
- Tecnico
- Proyecto
- Garantias
- Cumplimiento
- Regulatorio
- Impacto ESG
- Evidencia complementaria

Estados posibles:

- borrador
- recibido
- en revision
- observado
- requiere aclaracion
- aprobado por revision humana
- bloqueado
- reemplazado por nueva version

### Documento - Identidad

Funcion: acreditar informacion de tipo identidad. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Corporativo

Funcion: acreditar informacion de tipo corporativo. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Fiscal

Funcion: acreditar informacion de tipo fiscal. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Financiero

Funcion: acreditar informacion de tipo financiero. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Legal

Funcion: acreditar informacion de tipo legal. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Tecnico

Funcion: acreditar informacion de tipo tecnico. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Proyecto

Funcion: acreditar informacion de tipo proyecto. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Garantias

Funcion: acreditar informacion de tipo garantias. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Cumplimiento

Funcion: acreditar informacion de tipo cumplimiento. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Regulatorio

Funcion: acreditar informacion de tipo regulatorio. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Impacto ESG

Funcion: acreditar informacion de tipo impacto esg. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

### Documento - Evidencia complementaria

Funcion: acreditar informacion de tipo evidencia complementaria. Paso a paso: 1. identificar requisito
2. subir archivo
3. asociar categoria
4. validar metadata
5. revisar completitud
6. marcar resultado
7. notificar faltante si aplica

Resultado esperado: el expediente muestra si esta evidencia esta completa, observada o bloqueada.

## 9. Flujos operativos por rol

Cada rol opera una parte distinta del ciclo. El valor de NUXERA esta en que estos ciclos se conectan sin mezclar permisos.

### Flujo de solicitante

1. entra con rol correcto
2. consulta solo informacion permitida
3. ejecuta accion propia del rol
4. genera evento trazable
5. recibe o dispara notificacion si aplica
6. deja evidencia para auditoria

Riesgo a evitar: que solicitante opere fuera de su alcance o vea datos que no corresponden.

### Flujo de otorgante

1. entra con rol correcto
2. consulta solo informacion permitida
3. ejecuta accion propia del rol
4. genera evento trazable
5. recibe o dispara notificacion si aplica
6. deja evidencia para auditoria

Riesgo a evitar: que otorgante opere fuera de su alcance o vea datos que no corresponden.

### Flujo de administrador

1. entra con rol correcto
2. consulta solo informacion permitida
3. ejecuta accion propia del rol
4. genera evento trazable
5. recibe o dispara notificacion si aplica
6. deja evidencia para auditoria

Riesgo a evitar: que administrador opere fuera de su alcance o vea datos que no corresponden.

### Flujo de agente

1. entra con rol correcto
2. consulta solo informacion permitida
3. ejecuta accion propia del rol
4. genera evento trazable
5. recibe o dispara notificacion si aplica
6. deja evidencia para auditoria

Riesgo a evitar: que agente opere fuera de su alcance o vea datos que no corresponden.

### Flujo de servicio de notificaciones

1. entra con rol correcto
2. consulta solo informacion permitida
3. ejecuta accion propia del rol
4. genera evento trazable
5. recibe o dispara notificacion si aplica
6. deja evidencia para auditoria

Riesgo a evitar: que servicio de notificaciones opere fuera de su alcance o vea datos que no corresponden.

## 10. Escenarios practicos de uso

Escenario 1: solicitante incompleto. La plataforma debe mostrar brechas, documentos faltantes y acciones. Escenario 2: expediente listo con observaciones. Debe permitir revision humana. Escenario 3: otorgante detecta riesgo jurisdiccional. Debe pedir evidencia y preparar pregunta de comite. Escenario 4: admin detecta fuente condicional. Debe marcar limitacion y evitar presentarla como live. Escenario 5: agente no tiene contexto. Debe decir que no cuenta con evidencia suficiente.

## 11. Errores frecuentes y manejo esperado

- Documento subido en categoria incorrecta: marcar observacion y pedir reclasificacion
- Modelo financiero desactualizado: pedir nueva version
- Ubicacion incompleta: bloquear analisis jurisdiccional profundo
- Beneficiario final no identificado: marcar riesgo critico
- Fuente regulatoria privada sin convenio: mostrar pendiente, no live
- Otorgante sin autorizacion: denegar acceso
- Correo con evidencia sensible: bloquear envio por defecto

## 12. Resultado por seccion

- Pagina publica: entendimiento comercial
- Solicitante: expediente preparado
- Documentos: evidencia clasificada
- Readiness: brechas visibles
- Otorgante: paquete de decision no vinculante
- Case management: seguimiento y SLA
- Jurisdiccion: contexto pais/ciudad trazable
- Admin: control operativo
- Agente: asistencia limitada por contexto
- Notificaciones: movimiento operativo sin exponer evidencia
