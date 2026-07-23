# NUXERA Cutover Review Pack

Fecha: 2026-07-23
Estado: local only, sin commit, sin push y sin deploy productivo.

## Alcance de este paquete

Este documento prepara revision, no ejecucion. El objetivo es que admin/engineering revisen si NUXERA esta lista para pasar los ultimos bloques operativos a un ambiente controlado antes de cualquier produccion.

## Cambios locales incluidos

- Health read-only de `nuxera_notification_outbox` para ver queued, failed, suppressed, retry candidates, manual review y gates de delivery/email.
- Endpoint admin `GET /api/nuxera/admin/notification-outbox-health` protegido por `nuxera:admin:read`.
- Timeline con eventos de chat/agente como tipo `conversation`, alimentado desde `audit_logs` y sin exponer texto de mensajes.
- Readiness del agente con `auditMetadata`: campos logueables, acciones del timeline y garantia de `persistedText: false`.
- Borrador SQL `2026-07-23_nuxera_case_events.sql` para ledger persistido de eventos operativos con RLS solo lectura.
- Borrador SQL `2026-07-23_nuxera_evidence_provenance_columns.sql` para provenance fuerte en `nuxera_evidence_links`.
- Verificador local de drafts SQL actualizado para cubrir ambos borradores.

## Gates antes de cualquier accion real

- Revision humana de SQL y RLS por owner tecnico.
- Prueba en ambiente no productivo con identidades: solicitante propietario, solicitante no propietario, otorgante autorizado, otorgante no autorizado y admin.
- Confirmar que `sensitive_content_excluded = true` se mantiene en todo evento visible fuera de admin autorizado.
- Confirmar que ningun agente persiste texto conversacional sin aprobacion de privacidad/retencion.
- Mantener `NUXERA_NOTIFICATION_DELIVERY_ENABLED=false` y `NUXERA_EMAIL_DELIVERY_ENABLED=false` hasta runbook aprobado.
- Mantener cualquier write path productivo apagado hasta change-control separado.

## SQL drafts pendientes

- `backend/sql_migrations_pendientes/2026-07-23_nuxera_case_events.sql`
  - Crea `nuxera_case_events`.
  - Incluye eventos `order`, `checklist`, `evidence`, `information-request`, `assignment`, `notification`, `audit`, `conversation`, `risk`, `decision`.
  - RLS select para owner, grantor autorizado y admin.
  - Sin policies de insert/update/delete.

- `backend/sql_migrations_pendientes/2026-07-23_nuxera_evidence_provenance_columns.sql`
  - Agrega columnas de source/provenance/confidence/review status.
  - Sin policies nuevas.
  - Solo columnas e indices aditivos.

## Plan de cutover recomendado

1. Revision local de codigo y tests.
2. Commit/PR solo cuando el usuario lo autorice.
3. Ejecutar SQL en non-production.
4. Capturar evidencia RLS por rol y endpoint.
5. Preview deploy no productivo.
6. Revision funcional por admin, otorgante y solicitante.
7. Decision humana de produccion.
8. Produccion solo con runbook, rollback owner y ventana aprobada.

## Rollback conceptual

- Desactivar feature flags NUXERA si la UI degrada.
- Mantener delivery flags apagadas si aparece cualquier riesgo de envio.
- No depender de `nuxera_case_events` hasta que el timeline persistido este probado; el agregador virtual puede seguir funcionando.
- Las columnas de provenance son aditivas; no requieren migracion destructiva.

## No ejecutado

- No se hizo commit.
- No se hizo push.
- No se hizo deploy.
- No se ejecuto SQL.
- No se activo delivery real.
- No se envio ningun correo.