// Fallback de OCR real para PDFs escaneados (sección 20.4 del plan --
// "OCR real (Tesseract) como fallback": hoy classifyOcrQuality() en
// ocrQualityService.js solo DETECTA que un PDF es un escaneo sin texto útil,
// no lo vuelve a procesar automáticamente).
//
// Por qué Claude en vez de Tesseract: rasterizar un PDF a imagen para pasarlo
// a tesseract.js (ya usado en agentClassifier.js, pero solo para imágenes
// sueltas) requiere una librería de render PDF->PNG (pdfjs-dist + un canvas
// nativo/prebuilt tipo @napi-rs/canvas o node-canvas) que hoy NO está en
// package.json -- agregarla metería una dependencia nativa nueva al build de
// Render sin forma de probarla contra ese entorno real antes de este deploy.
// Claude ya soporta leer PDFs directamente como "document content block"
// (incluye páginas escaneadas -- hace su propio reconocimiento de imagen) y
// ya está configurado en producción (mismo ANTHROPIC_API_KEY que usa todo el
// pipeline de evaluación) -- cero dependencias nuevas, cero riesgo de build.
//
// Si en el futuro se prefiere Tesseract específicamente (por costo o para no
// depender de un proveedor de IA para esto), el camino queda documentado:
// pdfjs-dist (parseo, puro JS) + @napi-rs/canvas (render, binarios
// prebuilt) + tesseract.js (ya instalado).
import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-6';
// Límite de tamaño de documento que acepta la API de Anthropic para PDFs.
const MAX_PDF_BYTES = 32 * 1024 * 1024;

export function isConfigured() {
  return Boolean(ANTHROPIC_KEY);
}

// extractTextFromScannedPdf(pdfBuffer) -> { text, source, error? }
// source: 'CLAUDE_PDF_OCR' si transcribió algo, 'NOT_CONFIGURED'/'SKIPPED_SIZE'/'ERROR' si no.
export async function extractTextFromScannedPdf(pdfBuffer) {
  if (!isConfigured()) {
    return { text: '', source: 'NOT_CONFIGURED' };
  }
  if (!pdfBuffer || !pdfBuffer.length || pdfBuffer.length > MAX_PDF_BYTES) {
    return { text: '', source: 'SKIPPED_SIZE' };
  }

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBuffer.toString('base64') }
          },
          {
            type: 'text',
            text: 'Este PDF es un documento escaneado. Transcribe TODO el texto legible que veas en las páginas/imágenes, en el mismo orden e idioma del documento original. No resumas, no interpretes ni agregues comentarios propios -- únicamente la transcripción literal del texto visible. Si una parte es ilegible, escribe [ilegible] en su lugar.'
          }
        ]
      }]
    });
    const text = response.content?.find((block) => block.type === 'text')?.text || '';
    return { text, source: 'CLAUDE_PDF_OCR' };
  } catch (err) {
    console.warn('[pdfOcrFallbackService] Error al transcribir PDF escaneado con Claude:', err.message);
    return { text: '', source: 'ERROR', error: err.message };
  }
}
