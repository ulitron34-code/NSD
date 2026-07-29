# NUXERA - Revisión Codex posterior a 26a7045

Fecha: 2026-07-18
Base revisada: `26a7045`
Estado: cambios locales validados, sin commit, push ni deploy.

## Correcciones realizadas

- Se separó explícitamente el pipeline real autorizado del modelo local de casos del otorgante.
- El ledger real ahora muestra el identificador del expediente autorizado al que pertenece.
- La evidencia persistida de un expediente real ya no se mezcla con señales o documentos demo.
- Si el endpoint remoto falla o no devuelve filas, la interfaz muestra cero evidencias en vez de usar fallback demo.
- Se agregaron dos pruebas para impedir regresiones de mezcla demo/real y fallback engañoso.
- La política SQL ya aplicada en producción quedó documentada como aplicada e idempotente; una repetición no intenta recrearla si ya existe.
- El solicitante real muestra la identidad y readiness de su expediente más reciente en vez de un progreso exclusivamente demo.
- El pipeline autorizado real alimenta la cola NUXERA del otorgante, incluyendo scoring, documentos, share, interés y contacto.
- Workbench, resumen documental y memo operan sobre la misma cola y el mismo expediente autorizado.
- Los campos reales `project_name`, `requested_amount`, `readiness_grade`, `risk_level` y `applicant_type` se normalizan correctamente.
- La consola admin carga usuarios, auditoría global, cola de revisión humana y métricas desde APIs protegidas reales.
- Los fallos administrativos parciales son visibles y nunca se reemplazan con registros demo.
- El solicitante puede seleccionar explícitamente entre varios expedientes reales y mantener sincronizados readiness y evidencia.
- El otorgante puede seleccionar cada expediente autorizado desde su cola; workbench, documentos y memo cambian juntos al caso elegido.
- Se corrigió una regresión de montaje: el selector de expedientes del solicitante ya no aparece dentro de la consola administrativa.
- La consola admin agrupa datos reales por usuarios/roles, revisiones humanas prioritarias, métricas de readiness y acciones de auditoría.
- NUXERA Finance dejó de mostrar porcentajes fijos para solicitante y otorgante: ahora deriva readiness/score, riesgo y documentos del expediente real seleccionado.
- La selección de expediente se sincroniza entre Home, Finance y módulos reutilizados durante la sesión.
- Finance, Intelligence, Markets y Strategy ahora comparten un único contexto de expediente según el rol autenticado.
- Intelligence contextualiza sujeto, hallazgos y reporte; Markets agrega riesgo sin fingir tiempo real; Strategy ajusta recomendación y conserva revisión humana.
- Se agregó una orquestación auditable de 11 agentes con objetivo, entradas, salidas, fuentes, versión, costo, tiempo, confianza, errores y trazabilidad.
- Un envelope de seguridad bloquea demos, selecciones inconsistentes y contextos de otorgante que no provienen del pipeline autorizado.
- La falta de documentos o scoring detiene agentes dependientes; no se fabrican resultados ni se ejecutan modelos.
- Los metadatos HTML y la tarjeta Open Graph pública ya muestran NUXERA Financial Intelligence y dejaron de fijar un hostname Vercel anterior.
- Predeploy y go/no-go incluyen un gate específico que impide reintroducir NEXUS/NSD visible en los activos públicos principales.

## Validación

- Guardas SQL NUXERA: aprobadas.
- Backend: 469/469 pruebas aprobadas.
- Frontend: 258/258 pruebas aprobadas.
- Go/no-go local: 23/23 controles en GO.
- ESLint: aprobado.
- Build de producción: aprobado.
- `git diff --check`: aprobado; sólo avisos LF/CRLF de Windows.

## Pendientes

1. Probar pipeline y `grantor-evidence` por HTTP real con un `data_room_shares` aceptado y asociado al usuario correcto.
2. Revisar y hacer commit intencional de las modificaciones locales validadas.
3. Subir la rama a GitHub cuando el usuario lo autorice.
4. Configurar variables de despliegue y ejecutar predeploy antes de Vercel.
5. Mantener `VITE_NUXERA_EXPERIENCE_ENABLED=false` hasta cerrar la prueba HTTP y aprobación de activación.

## Archivos modificados

- `backend/sql_migrations_pendientes/2026-07-18_nuxera_evidence_links_grantor_policy.sql`
- `backend/scripts/check-nuxera-public-identity.js`
- `backend/scripts/go-nogo-local.js`
- `backend/scripts/predeploy-check.js`
- `backend/package.json`
- `index.html`
- `public/og-image.svg`
- `src/hooks/useMyGrantorPipeline.js`
- `src/hooks/useMyOrders.js`
- `src/hooks/useSelectedExpediente.js`
- `src/data/otorgantePipeline.js`
- `src/nuxera/evidence/evidenceBackendAdapter.js`
- `src/nuxera/grantor/caseQueue.js`
- `src/nuxera/pages/NuxeraHome.jsx`
- `src/nuxera/admin/operationalSnapshotAdapter.js`
- `src/nuxera/adapters/FinanceWorkspaceAdapter.jsx`
- `src/nuxera/adapters/DocumentIntelligenceAdapter.jsx`
- `src/nuxera/adapters/MarketsWorkspace.jsx`
- `src/nuxera/adapters/StrategyWorkspace.jsx`
- `src/nuxera/context/NuxeraExpedientContext.jsx`
- `src/nuxera/finance/financeJourney.js`
- `src/nuxera/intelligence/researchMissions.js`
- `src/nuxera/markets/marketDataProvider.js`
- `src/nuxera/orchestration/caseOrchestration.js`
- `src/nuxera/strategy/strategyWorkspace.js`
- `src/nuxera/styles/shell.css`
- `src/tests/nuxeraExperience.test.js`
- `docs/nuxera-migration/docs/migration/MIGRATION_MATRIX.md`
- `docs/nuxera-migration/docs/migration/PROJECT_STATE.md`

## Cierre al 90% - 2026-07-18

- La administración NUXERA quedó separada en operaciones, seguridad, IA y sistema usando módulos protegidos existentes.
- Se corrigió la preservación del rol autenticado para impedir que el selector demo suplante sesiones reales.
- La suite Chromium completa quedó actualizada y aprobada: 34/34.
- E2E forma parte del go/no-go y del predeploy.
- Se agregó verificación HTTP autenticada de solo lectura para solicitante, otorgante y administrador, sin imprimir tokens ni ejecutar mutaciones.
- Se agregó runbook de Supabase, Vercel, activación controlada y rollback.
- La evaluación ponderada y conservadora de la reestructuración es 90%; el 10% restante corresponde a preview real, RLS/SQL aprobado, UAT y salida productiva.

Validación final:
- Frontend: 259/259 pruebas.
- Backend: 469/469 pruebas.
- Chromium E2E: 34/34 pruebas.
- Go/no-go local: 25/25 controles en GO.
- ESLint, build, plan HTTP y `git diff --check`: aprobados.
