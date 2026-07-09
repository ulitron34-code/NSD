-- ══════════════════════════════════════════════════════════════════════
-- NSD/NEXUS — Item condicional por sector para el checklist de Readiness
-- (sección 19.1 del plan: "checklist dinámico por país, sector y tipo de
-- financiamiento"). Este código solo se usa cuando el sector declarado del
-- expediente coincide con uno de los 8 sectores con reglas específicas
-- (inmobiliario, energía, agroindustrial, turismo, manufactura, fintech,
-- salud, exportación) -- ver SECTOR_SPECIFIC_DOCUMENTS en
-- backend/src/config/readinessRubrics.js.
--
-- Mismo patrón/columnas que 2026-07-04_readiness_document_types.sql.
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO document_type_catalog
  (code, category, name_es, name_en, requires_ocr, requires_parsing, requires_face_match, typical_format, expiration_months, is_pii, regulatory_framework)
VALUES
('READY_PERMISOS_SECTORIALES', 'general', 'Permisos y Documentación Sectorial', 'Sector-Specific Permits and Documentation', true, true, false, 'pdf', null, false, 'GENERAL')
ON CONFLICT (code) DO NOTHING;
