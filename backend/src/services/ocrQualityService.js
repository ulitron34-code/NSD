// Estados y reglas de calidad OCR (secciones 20.2/20.3 del plan). El pipeline
// de extracción (backend/src/routes/documents.js) usaba pdf-parse sin
// ninguna señal de calidad: un PDF escaneado sin capa de texto simplemente
// devolvía una cadena casi vacía, sin que nadie lo marcara como sospechoso.
// classifyOcrQuality() es una función pura (fácil de probar) que aplica las
// 4 reglas de la sección 20.3 usando datos que el pipeline ya tiene en mano
// (texto extraído, tamaño real del buffer descargado, error de pdf-parse si
// lo hubo) -- no requiere una columna nueva en `documents`.
const LOW_WORD_COUNT_THRESHOLD = 300;
const LARGE_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function isPasswordProtectedError(error) {
  const message = String(error?.message || error || '');
  return /encrypt|password|protected|contrase/i.test(message);
}

// Los 5 estados de la sección 20.2 del plan. `pending`/`processing` son
// estados de ANTES de extraer (el llamador los usa mientras el archivo aún
// no se procesa) -- esta función solo decide entre completed/low_quality/failed
// una vez que ya se intentó extraer texto.
export function classifyOcrQuality({ extractedText, fileSizeBytes = 0, extractionError = null } = {}) {
  if (extractionError) {
    if (isPasswordProtectedError(extractionError)) {
      return {
        status: 'failed',
        note: 'El documento parece estar protegido con contraseña — solicitar al solicitante una versión desbloqueada del archivo.'
      };
    }
    return {
      status: 'failed',
      note: `No se pudo extraer texto del documento (${extractionError.message || extractionError}). Requiere revisión manual o recarga.`
    };
  }

  const wordCount = countWords(extractedText);

  if (wordCount === 0) {
    return { status: 'failed', note: 'No se extrajo ningún texto del documento. Requiere revisión manual o recarga.' };
  }

  // Regla explícita de la sección 20.3: archivo pesado + poco texto extraído
  // es la señal clásica de un escaneo sin capa de texto (imagen dentro de un
  // PDF) que pdf-parse no puede leer sin OCR real.
  if (wordCount < LOW_WORD_COUNT_THRESHOLD && fileSizeBytes > LARGE_FILE_BYTES) {
    const sizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      status: 'low_quality',
      note: `Solo se extrajeron ${wordCount} palabras de un archivo de ${sizeMb} MB — posible escaneo sin capa de texto procesable. Se recomienda recargar una versión con texto seleccionable o solicitar un procesamiento OCR más profundo.`
    };
  }

  return { status: 'completed', note: null };
}
