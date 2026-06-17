import { supabaseAdmin } from '../config/supabase.js';
import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

export async function chatWithExpediente(expedienteId, message) {
  // 1. Obtener los documentos del expediente
  const { data: documents, error: docError } = await supabaseAdmin
    .from('documents')
    .select('id, filename, document_type')
    .eq('order_id', expedienteId);

  if (docError || !documents || !documents.length) {
    return {
      response: "No se encontraron documentos cargados en este expediente para poder analizar."
    };
  }

  // 2. Obtener las extracciones de texto de estos documentos
  const documentIds = documents.map(d => d.id);
  const { data: extractions, error: extError } = await supabaseAdmin
    .from('document_extractions')
    .select('document_id, extracted_data')
    .in('document_id', documentIds);

  if (extError || !extractions || !extractions.length) {
    return {
      response: "Los documentos aún no han sido procesados por el Agente Clasificador. Por favor, haz clic en 'Procesar Todo' primero."
    };
  }

  // Consolidar el texto de contexto
  let contextText = "";
  for (const ext of extractions) {
    const doc = documents.find(d => d.id === ext.document_id);
    const filename = doc ? doc.filename : "Documento Desconocido";
    const type = doc ? doc.document_type : "OTRO";
    const content = ext.extracted_data?.textContent || "";
    contextText += `--- DOCUMENTO: ${filename} (Tipo: ${type}) ---\n${content.slice(0, 4000)}\n\n`;
  }

  if (!anthropic) {
    // Sin ANTHROPIC_API_KEY configurada no hay forma de leer los documentos
    // reales del expediente. Antes este fallback respondía con cifras
    // inventadas (DSCR, EBITDA, % de coincidencia) como si fueran del
    // análisis real — se reemplaza por un aviso explícito, igual al patrón
    // que ya usa aiEngine.js para sus fallbacks simulados.
    return {
      response: "[Modo simulado] El motor de IA (ANTHROPIC_API_KEY) no está configurado en este entorno, así que no puedo leer ni analizar los documentos reales de este expediente. Consulta directamente las pestañas de Validación, Score y Red Flags para ver los datos extraídos por los agentes, o configura la API key para habilitar el chatbot con análisis real.",
      simulated: true
    };
  }

  try {
    const prompt = `Actúas como el Agente IA de NSD especializado en auditoría y cumplimiento de expedientes PyME.
    Se te proporciona el contenido de texto extraído de los documentos de un expediente.
    Responde a la siguiente pregunta del usuario basándote únicamente en el contexto provisto. Si la información no está explícita en los documentos, indícalo amablemente.

    Contexto del Expediente:
    ${contextText.slice(0, 15000)}

    Pregunta del Usuario:
    "${message}"

    Respuesta (sé conciso y directo, estructurado con viñetas si es necesario):`;

    const chatResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    return {
      response: chatResponse.content[0].text
    };
  } catch (error) {
    console.error("Error en Chatbot Agent:", error);
    return {
      response: `Hubo un error al consultar con el Agente de Inteligencia: ${error.message}`
    };
  }
}
