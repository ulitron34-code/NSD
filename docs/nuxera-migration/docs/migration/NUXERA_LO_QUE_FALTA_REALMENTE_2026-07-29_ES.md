# NUXERA - Plan Extendido de Pendientes Reales, Produccion y Cutover

Fecha/Date: 2026-07-29

## 1. Estado

- 90-92% demo/investor-ready
- 78-82% produccion real
- Falta cerrar ciclos reales, no mas pantallas


## 2. Criticos

- RLS fase 2
- SQL persistence rehearsal
- correo sandbox
- agente con contexto autorizado
- backend estable
- fuentes privadas por convenio
- cutover Nexus->NUXERA
- rollback


## 3. Plan de cutover

1. Inventario de URLs
2. redirecciones
3. freeze
4. QA
5. demo final
6. backup rollback
7. cambio principal
8. monitoreo
9. correcciones
10. retiro remanentes


## 4. Riesgos

- backend frio
- prometer fuentes privadas
- correo sin sandbox
- agente sin RLS
- score confundido con aprobacion
- tabs duplicadas


## 5. Recomendacion

Avanzar para inversionistas con demo controlada; no activar clientes reales hasta cerrar RLS, SQL, correo, agente seguro y cutover.


## 6. Roadmap operativo por semanas

1. Semana 1: RLS staging y SQL rehearsal
2. Semana 2: sandbox correo y agente con contexto
3. Semana 3: fuentes jurisdiccionales y EAU priorizadas
4. Semana 4: cutover controlado y monitoreo
5. Semana 5: pilotos con datos limitados
6. Semana 6: retroalimentacion, hardening y produccion limitada

## 7. Checklist final de produccion

- RLS verificado
- SQL migrado y probado
- correo sandbox aprobado
- plantillas aprobadas
- agente restringido por rol
- backend estable
- fuentes privadas marcadas correctamente
- Nexus redirigido
- rollback listo
- manuales actualizados
- demo script listo
- monitoreo activo

## 8. Decision ejecutiva

La recomendacion es avanzar con presentacion a inversionistas, pero no vender como produccion plenamente automatizada hasta cerrar RLS, SQL, correo, agentes y backend estable. La narrativa correcta es: plataforma viva, producto demostrable, controles disenados y roadmap claro de produccion.
