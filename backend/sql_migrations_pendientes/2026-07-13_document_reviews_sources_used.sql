-- Migración: columna sources_used en document_reviews
-- (sección 28 del plan Readiness -- "no hay un campo dedicado de fuente de
-- referencia usada por evaluación individual, más allá de lo que ya aparece
-- indirectamente cuando se citan datos de INEGI/Banxico/SAT/GLEIF").
--
-- No se inventa un campo nuevo desde cero: se persiste el mismo patrón que
-- ya usan todos los servicios de fuente externa (cada uno devuelve
-- { ..., source: 'INEGI_DENUE_API' | 'MOCK_INEGI' | ... }) -- ver
-- backend/src/agents/readinessRubricAgent.js, rama itemId === 'estudio_mercado'.
--
-- Fecha: 2026-07-13
-- Correr en: Supabase > SQL Editor

ALTER TABLE document_reviews
  ADD COLUMN IF NOT EXISTS sources_used JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN document_reviews.sources_used IS
  'Array de { source, label } con las fuentes externas reales (INEGI/Banxico/etc) consultadas para esta evaluación. Vacío si el documento no requirió consultar ninguna fuente externa.';
