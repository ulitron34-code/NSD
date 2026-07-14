-- Migración: columna completed_at en document_reviews
-- (sección 30 del plan Readiness -- "tiempo promedio de evaluación" no se
-- podía calcular honestamente porque solo se guardaba created_at, la marca
-- de INICIO de la evaluación cuando se inserta el registro con
-- status='processing'). Ver backend/src/services/readinessMetricsService.js,
-- constante EVALUATION_TIME_NOTE.
--
-- created_at ya cumple de facto como "started_at" (se escribe al insertar el
-- registro en estado 'processing', antes de llamar a los agentes de IA), por
-- eso no se agrega una columna started_at separada -- sería un duplicado.
--
-- Fecha: 2026-07-13
-- Correr en: Supabase > SQL Editor

ALTER TABLE document_reviews
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN document_reviews.completed_at IS
  'Marca de tiempo de cuando terminó la evaluación (status pasó de processing a green/yellow/red). NULL para reviews en proceso o de antes de esta migración.';
