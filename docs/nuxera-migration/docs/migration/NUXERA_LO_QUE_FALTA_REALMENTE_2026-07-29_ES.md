# NUXERA - Lo que Falta Realmente para Operar en Produccion

Fecha: 2026-07-29

## Estado General

NUXERA ya esta suficientemente avanzada para demostracion, revision de socio e inversionistas, y para preparar el reemplazo de la experiencia Nexus. Lo que falta ya no es crear mas pantallas: falta cerrar ciclos reales de datos, autorizacion, correo, agentes y cutover.

Avance estimado despues de esta jornada:

- 90-92% para experiencia demostrable e investor-ready.
- 78-82% para produccion operativa con datos reales y automatizaciones activas.

## Pendientes Criticos antes de Sustituir Nexus por Completo

1. Cutover de identidad: retirar o redirigir cualquier entrada publica/operativa que aun lleve a Nexus y dejar NUXERA como experiencia principal.
2. RLS fase 2: probar solicitante, otorgante y admin con datos reales o staging para demostrar aislamiento.
3. SQL/persistencia: ejecutar rehearsal no productivo para eventos, aprobaciones de notificacion y procedencia documental.
4. Backend remoto: resolver latencia/cold start de Render o calentar servicio antes de demos. En esta corrida Vercel respondio, Render no respondio dentro de 20 segundos.
5. Notificaciones: ejecutar sandbox real con correo aprobado, plantillas firmadas y sin evidencia sensible adjunta.
6. Agente/chat: conectar al backend con contexto autorizado, logs y limites de riesgo.
7. Pais/ciudad/jurisdiccion: ampliar fuentes por region y mantener fecha/fuente/limitacion por cada conclusion.
8. Medio Oriente: convertir fuentes UAE/ADGM/DIFC/VARA/CBUAE/FTA en conectores reales donde exista API o proceso autorizado.
9. Manuales finales con imagenes: revisar y editar para estilo comercial/inversionistas.
10. Demo script: preparar recorrido de 12-15 minutos con camino feliz y respaldo por capturas.

## Pendientes Importantes pero no Bloqueantes para Demo

- NVIDIA API: se puede dejar como experimental.
- Profundizar copy comercial de pagina publica.
- Agregar mas casos demo por industria.
- Preparar one-pager de inversion.
- Preparar deck de pitch.
- Preparar matriz de pricing y plan piloto.

## Recomendacion de Decision

Para presentacion de inversionistas: avanzar.  
Para sustitucion total de Nexus: hacerlo con cutover controlado y plan de rollback.  
Para produccion con clientes reales: no activar escrituras sensibles, notificaciones live ni agentes con datos reales hasta cerrar RLS, SQL, correo y observabilidad.
