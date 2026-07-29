# NUXERA - Security/Data Reverification Pack

Fecha: 2026-07-29
Commit local: e89da640 Fix document review endpoint dropping metadata, blocking restricted AI providers
Modo: no destructivo, sin writes, sin activar delivery, sin cambiar RLS y sin llamar proveedores IA.

## Resultado ejecutivo

- SQL drafts locales: OK.
- Identidad publica local: OK.
- Plan HTTP por rol: OK.
- Production readiness gate local: production-readiness-not-evaluated-local-env-missing.
- La evidencia HTTP real por rol requiere tokens de solicitante, otorgante, admin y un order ajeno controlado.
- Mientras falten tokens/ambiente de prueba, este paquete no declara cerrado RLS productivo observado.

## Production readiness gate

Estado: production-readiness-not-evaluated-local-env-missing
Readiness: 0%

| Dominio | Estado | Blockers | Siguiente accion |
|---|---|---|---|
| Production readiness gate | blocked | Missing required Supabase configuration: SUPABASE_URL and SUPABASE_KEY are required | Run with backend environment variables or query the protected admin endpoint with an admin token. |

## Variables requeridas para prueba HTTP/RLS observada

- NUXERA_HTTP_BASE_URL: faltante
- NUXERA_APPLICANT_TOKEN: faltante
- NUXERA_APPLICANT_ORDER_ID: faltante
- NUXERA_GRANTOR_TOKEN: faltante
- NUXERA_GRANTOR_ORDER_ID: faltante
- NUXERA_ADMIN_TOKEN: faltante
- NUXERA_FOREIGN_ORDER_ID: faltante

## SQL/RLS draft check

```
OK - NUXERA SQL drafts are additive, RLS-gated and free of destructive operations.
```

## Public identity local check

```
OK - HTML metadata
OK - Open Graph image source
OK - Social preview PNG

NUXERA public identity check passed.
```

## HTTP/RLS verification plan

```
# NUXERA HTTP readiness plan (mustAllow, GET-only)
No requests were sent and no credentials were read.
- solicitante: GET /api/orders
- solicitante: GET /api/nuxera/orders/:orderId/evidence
- otorgante: GET /api/otorgante/pipeline
- otorgante: GET /api/nuxera/orders/:orderId/grantor-evidence
- administrador: GET /api/admin/users
- administrador: GET /api/admin/audit-logs
- administrador: GET /api/admin/human-review-queue
- administrador: GET /api/admin/readiness-metrics
- administrador: GET /api/nuxera/admin/readiness

# NUXERA HTTP readiness plan (mustDeny)
No requests were sent and no credentials were read.
- solicitante (ajeno): GET /api/nuxera/orders/:orderId/state -> expect 404 (a different applicant must not read another applicant order state)
- solicitante (ajeno): GET /api/nuxera/orders/:orderId/evidence -> expect 404 (a different applicant must not read another applicant order evidence)
- solicitante (ajeno): PATCH /api/nuxera/orders/:orderId/state/checklist -> expect 404 (a different applicant must not write another applicant order checklist)
- otorgante (no autorizado): GET /api/nuxera/orders/:orderId/grantor-evidence -> expect 404 (a grantor without an accepted data-room share must not read case evidence)
- solicitante (sin admin): GET /api/nuxera/admin/readiness -> expect 403 (a non-admin role must not read admin readiness)
- solicitante (sin admin): GET /api/nuxera/admin/controls -> expect 403 (a non-admin role must not read admin controls)
- otorgante (sin admin): GET /api/nuxera/admin/readiness -> expect 403 (a non-admin role must not read admin readiness)
- otorgante (sin admin): GET /api/nuxera/admin/controls -> expect 403 (a non-admin role must not read admin controls)
```

## Criterio para cerrar Bloque 2

1. Ejecutar este paquete con tokens reales controlados en un entorno no productivo o sandbox autorizado.
2. Confirmar mustAllow para solicitante, otorgante autorizado y admin.
3. Confirmar mustDeny para solicitante ajeno, otorgante no autorizado y roles sin admin.
4. Adjuntar salida de `npm run verify:nuxera-http` al release dossier.
5. Mantener writes, delivery y runtime amplio de agente apagados hasta aprobacion humana separada.

## Guardrails

- Este reporte no aplica SQL.
- Este reporte no modifica RLS.
- Este reporte no inserta filas.
- Este reporte no envia notificaciones.
- Este reporte no ejecuta proveedores IA externos.
- Un resultado OK local no reemplaza evidencia observada con identidades reales.
