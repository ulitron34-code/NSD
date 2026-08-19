# 🚀 NUXERA - Setup Rápido (Listo para Usar)

**Estado:** ✅ TODO ESTÁ IMPLEMENTADO Y LISTO

---

## 📋 ¿Qué está COMPLETAMENTE LISTO?

```
✅ Backend code                    (9 archivos)
✅ Frontend components             (2 archivos)  
✅ API endpoints                   (3 rutas)
✅ Database migrations SQL         (Listo para ejecutar)
✅ Agente automático              (Configurado)
✅ Documentación completa         (4 guías)
✅ Scripts de ingesta             (Listos)
✅ Testing suite                  (Documentado)
```

**NADA de código falta. Solo necesitas 4 pasos de configuración.**

---

## ⚡ 4 PASOS RÁPIDOS (15 MINUTOS)

### PASO 1: Obtener GEMINI_API_KEY (5 min)

```
1. Ve a: https://ai.google.dev/
2. Click: "Get API Key"  
3. Click: "+ Create API key"
4. Copia la clave (empieza con "AIzaSy...")
5. Guárdala en algún lado
```

### PASO 2: Actualizar .env (2 min)

Editar: `backend/.env`

```env
# Agregar/actualizar esta línea:
GEMINI_API_KEY=<tu-gemini-key>

# Resto debe estar igual:
SUPABASE_URL=<tu-supabase-url>
SUPABASE_KEY=<tu-supabase-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
OPENAI_API_KEY=<tu-openai-key>
EMBEDDING_MODEL=text-embedding-3-small
SANCTIONS_UPDATE_CRON=0 0 */4 * *
```

### PASO 3: Ejecutar SQL en Supabase (5 min)

1. Ve a: **Supabase Dashboard**
2. Menu izquierdo: **SQL Editor**
3. Click: **New Query**
4. Copia TODA esta SQL:

```sql
-- Migración: Tablas para verificación de identidad (sanciones)
CREATE TABLE IF NOT EXISTS public.sanction_update_log (
  id BIGSERIAL PRIMARY KEY,
  run_date TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  details TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sanction_update_log_run_date
  ON public.sanction_update_log(run_date DESC);

CREATE TABLE IF NOT EXISTS public.corpus_documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  country_code TEXT,
  source_url TEXT,
  storage_path TEXT,
  content_hash TEXT NOT NULL UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.corpus_chunks (
  id BIGSERIAL PRIMARY KEY,
  corpus_document_id BIGINT NOT NULL REFERENCES public.corpus_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_estimate INTEGER,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corpus_documents_source_type
  ON public.corpus_documents(source_type);

CREATE INDEX IF NOT EXISTS idx_corpus_documents_country_code
  ON public.corpus_documents(country_code);

CREATE INDEX IF NOT EXISTS idx_corpus_chunks_document_id
  ON public.corpus_chunks(corpus_document_id);

CREATE OR REPLACE FUNCTION public.match_corpus_chunks(
  query_embedding vector,
  match_count INT DEFAULT 8,
  filter_country TEXT DEFAULT NULL,
  filter_source_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  chunk_id BIGINT,
  corpus_document_id BIGINT,
  title TEXT,
  source_type TEXT,
  country_code TEXT,
  source_url TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    cc.id,
    cc.corpus_document_id,
    cd.title,
    cd.source_type,
    cd.country_code,
    cd.source_url,
    cc.content,
    (cc.embedding <=> query_embedding) * -1 AS similarity
  FROM public.corpus_chunks cc
  JOIN public.corpus_documents cd ON cc.corpus_document_id = cd.id
  WHERE cd.is_active = true
    AND (filter_country IS NULL OR cd.country_code = filter_country)
    AND (filter_source_type IS NULL OR cd.source_type = filter_source_type)
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

CREATE TABLE IF NOT EXISTS public.embedding_config (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  dimensions INT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO public.embedding_config (provider, model, dimensions, active)
VALUES
  ('openai', 'text-embedding-3-small', 1536, true),
  ('gemini', 'text-embedding-004', 1024, true)
ON CONFLICT (provider) DO UPDATE SET active = EXCLUDED.active;
```

5. Click: **Run** (o Ctrl+Enter)
6. Espera que termine (debe decir "Success")

### PASO 4: Ingestar Datos Iniciales (3 min)

Abrir PowerShell/Terminal en la carpeta del proyecto:

```powershell
cd backend
node scripts/ingest-identity-corpus.js
```

Verás output como:
```
📄 Ingiriendo: "SAT - Personas Políticamente Expuestas (PPE) 2024"...
   ✓ Documento ID: 1
   ✓ Chunks creados: 3
...
✓ Documentos ingiridos exitosamente: 5
```

---

## 🚀 INICIAR SISTEMAS

Abre **DOS TERMINALES:**

### Terminal 1 - Backend
```powershell
cd backend
npm run dev
```

Verás:
```
🚀 Server running on http://localhost:3001
Health check: http://localhost:3001/health
[SanctionAgent] ✓ Agente de actualización iniciado
```

### Terminal 2 - Frontend
```powershell
npm run dev
```

Verás:
```
➜  Local:   http://localhost:5173/
```

---

## ✅ PROBAR SISTEMA (1 min)

1. Abre: `http://localhost:5173/`
2. Navega a: Dashboard > Otorgantes (o la ruta de tu dashboard)
3. Verás 2 pestañas:
   - 📊 Pipeline de Crédito
   - **🔍 Verificar Identidad** ← Click aquí

4. En el campo "Buscar", escribe: `OFAC`
5. Click: **Verificar**
6. Deberías ver:
   - Tarjeta de riesgo ⚠️ MEDIUM
   - 1 coincidencia encontrada
   - Similitud ~95%

**¡Si ves esto, TODO FUNCIONA! ✅**

---

## 🎯 Resumen Final

| Paso | Descripción | Tiempo | Estado |
|------|-------------|--------|--------|
| 1 | Obtener GEMINI_API_KEY | 5 min | 👤 TÚ |
| 2 | Actualizar .env | 2 min | 👤 TÚ |
| 3 | Ejecutar SQL Supabase | 5 min | 👤 TÚ |
| 4 | Ingestar datos | 3 min | 👤 TÚ |
| 5 | Iniciar backend | Auto | ✅ |
| 6 | Iniciar frontend | Auto | ✅ |
| 7 | Probar | Manual | ✅ |

**TOTAL:** ~20 minutos

---

## 📞 Si algo falla

**"Mi GEMINI_API_KEY no funciona"**
→ Asegúrate de copiarla correctamente sin espacios

**"SQL error en Supabase"**
→ Ejecuta línea por línea si falla la SQL completa

**"node: not found"**
→ Instala Node.js desde: https://nodejs.org/

**"Cannot GET /api/identity/verify"**
→ Verifica que backend está en http://localhost:3001

**"Can't find tab 'Verificar Identidad'"**
→ Asegúrate de estar en dashboard/otorgantes (check URL)

---

## 📚 Documentación Disponible

Si necesitas detalle adicional:
- `NUXERA_IMPLEMENTATION_SUMMARY.md` - Resumen ejecutivo
- `NUXERA_IDENTITY_VERIFICATION_IMPLEMENTATION.md` - Guía técnica backend
- `NUXERA_VERIFICATION_PHASE2_FRONTEND.md` - Guía componentes React
- `NUXERA_IDENTITY_VERIFICATION_E2E_TESTING.md` - Testing completo

---

## ✨ ¡LISTO!

Todo está implementado. Solo sigue los 4 pasos y disfruta del sistema.

🎉 **Sistema de Verificación de Identidad completamente funcional en 20 minutos.**
