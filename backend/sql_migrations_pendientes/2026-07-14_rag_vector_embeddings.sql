-- Migración: RAG / base vectorial (pieza de arquitectura más grande
-- pendiente del plan grande -- 0 pgvector/embeddings en todo el repo antes de
-- esta migración). Dos ámbitos de búsqueda semántica, separados por tabla
-- porque tienen dueño y ciclo de vida distintos:
--   1. reference_source_chunks: contenido de las fuentes regulatorias del
--      catálogo (reference_sources), para fundamentar la evaluación de los
--      agentes en texto real de regulación en vez de solo el conocimiento
--      previo del modelo.
--   2. document_chunks: texto de los documentos que sube cada solicitante,
--      por expediente -- señal semántica adicional (duplicados/contenido
--      relacionado entre documentos) que complementa al auditor cruzado
--      existente (readinessCrossRefAgent.js), que solo compara campos
--      atómicos exactos tras normalizar.
--
-- PRERREQUISITO: correr primero (o en la misma sesión, antes que esta)
-- 2026-07-10_core_tables_rls.sql -- la policy de document_chunks reusa las
-- funciones SECURITY DEFINER rls_is_internal_reviewer()/
-- rls_has_accepted_data_room_share() que crea ese archivo. Si esta migración
-- se corre antes, el CREATE POLICY de document_chunks fallará con
-- "function does not exist".
--
-- Igual que el resto del backend, todo el llenado/lectura real de estas
-- tablas ocurre con supabaseAdmin (service-role, ignora RLS) -- las policies
-- de aquí son la misma defensa en profundidad que ya se documentó en el
-- header de 2026-07-10_core_tables_rls.sql, no el mecanismo de autorización
-- real (eso lo sigue haciendo el backend).
--
-- Fecha: 2026-07-14
-- Correr en: Supabase > SQL Editor

-- 1. Extensión pgvector (Supabase la trae disponible, solo hay que activarla).

CREATE EXTENSION IF NOT EXISTS vector;

-- 2. reference_sources gana un campo de contenido largo. Hoy la tabla es
-- puro catálogo de metadata (nombre, URL, notas cortas) -- sin esto no hay
-- ningún texto real que indexar. Se llena manualmente por el Administrador
-- (pegando el texto oficial de la regulación/estándar), no se scrapea nada
-- automáticamente -- sería fingir una integración que no existe.

ALTER TABLE reference_sources ADD COLUMN IF NOT EXISTS content TEXT;

-- 3. Chunks + embeddings de fuentes regulatorias.

CREATE TABLE IF NOT EXISTS reference_source_chunks (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_source_id  UUID        NOT NULL REFERENCES reference_sources(id) ON DELETE CASCADE,
  chunk_index          INT         NOT NULL,
  content              TEXT        NOT NULL,
  embedding            vector(1536),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reference_source_chunks_source ON reference_source_chunks(reference_source_id);
CREATE INDEX IF NOT EXISTS idx_reference_source_chunks_embedding ON reference_source_chunks USING hnsw (embedding vector_cosine_ops);

ALTER TABLE reference_source_chunks ENABLE ROW LEVEL SECURITY;

-- Mismo criterio que reference_sources: cualquier autenticado puede leer,
-- solo el backend (service-role) escribe.
CREATE POLICY "reference_source_chunks_select_authenticated"
  ON reference_source_chunks FOR SELECT
  TO authenticated
  USING (true);

-- 4. Chunks + embeddings de documentos del expediente.

CREATE TABLE IF NOT EXISTS document_chunks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  order_id     UUID        NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  chunk_index  INT         NOT NULL,
  content      TEXT        NOT NULL,
  embedding    vector(1536),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_order ON document_chunks(order_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Mismo criterio de acceso que "documents_select_owner_or_authorized" en
-- 2026-07-10_core_tables_rls.sql (dueño, interno, u otorgante con
-- data_room_shares aceptado) -- requiere que esa migración ya haya corrido.
CREATE POLICY "document_chunks_select_owner_or_authorized"
  ON document_chunks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_orders o
      WHERE o.id = document_chunks.order_id
        AND (
          o.user_id = auth.uid()
          OR rls_is_internal_reviewer(auth.uid())
          OR rls_has_accepted_data_room_share(auth.uid(), o.id)
        )
    )
  );

-- 5. Funciones de búsqueda por similitud coseno (RPC) -- necesarias porque
-- supabase-js no expone operadores de pgvector (`<=>`) directo desde el
-- cliente REST; se exponen como función para poder llamarlas con
-- supabaseAdmin.rpc(...) desde ragService.js.

CREATE OR REPLACE FUNCTION match_reference_source_chunks(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter_country TEXT DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  reference_source_id UUID,
  source_name TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.reference_source_id,
    s.name,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM reference_source_chunks c
  JOIN reference_sources s ON s.id = c.reference_source_id
  WHERE s.is_active = true
    AND (filter_country IS NULL OR s.country_code IS NULL OR s.country_code = filter_country)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter_order_id UUID DEFAULT NULL,
  exclude_document_id UUID DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM document_chunks c
  WHERE (filter_order_id IS NULL OR c.order_id = filter_order_id)
    AND (exclude_document_id IS NULL OR c.document_id <> exclude_document_id)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
