// Agente NSD de evaluacion de solicitante.
// Portado desde prototipo Python (USB: NSDFINAL/app/agents/base_agent.py, may-2026).
// Usa Claude con tool-use para orquestar hasta 6 checks de KYC en paralelo/secuencia
// y produce un score propietario NSD (0-100) + riesgo global + flags.

import Anthropic from '@anthropic-ai/sdk';
import { validateRfc } from '../services/satValidationService.js';
import { getCreditReport } from '../services/creditProviders/creditProviderGateway.js';
import { screenEntity } from '../services/sanctionsGateway.js';
import { screenCargoAgainstPepCatalog } from '../services/pepScreening.js';
import { calculateNsdScore, calculateGlobalRisk, detectFlags } from '../services/nsdApplicantScoringService.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_ITERATIONS = 6;

const TOOLS = [
  {
    name: 'validate_rfc_sat',
    description: 'Valida un RFC mexicano contra el SAT. Devuelve validez, estatus, tipo de persona y nombre del contribuyente.',
    input_schema: {
      type: 'object',
      properties: {
        rfc: { type: 'string', description: 'RFC a validar (12 o 13 caracteres)' }
      },
      required: ['rfc']
    }
  },
  {
    name: 'get_credit_score',
    description: 'Obtiene score crediticio del Buro de Credito Mexico. Devuelve puntuacion 300-850, grado, meses de morosidad y utilizacion.',
    input_schema: {
      type: 'object',
      properties: {
        rfc: { type: 'string', description: 'RFC del solicitante' }
      },
      required: ['rfc']
    }
  },
  {
    name: 'check_sanctions',
    description: 'Verifica el nombre contra 6 listas de sanciones internacionales: OFAC, ONU, UK, UE, Canada, FBI. Devuelve veredicto y lista donde hubo coincidencia si aplica.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre completo de la persona o razon social a verificar' }
      },
      required: ['name']
    }
  },
  {
    name: 'check_pep',
    description: 'Verifica si el cargo publico declarado corresponde a una Persona Politicamente Expuesta (PEP) segun el catalogo LFPIORPI. Requiere que el solicitante haya declarado su cargo.',
    input_schema: {
      type: 'object',
      properties: {
        cargo_declarado: { type: 'string', description: 'Cargo publico declarado por el solicitante o su relacionado' }
      },
      required: ['cargo_declarado']
    }
  },
  {
    name: 'get_equifax_score',
    description: 'Obtiene score crediticio global de Equifax (region LATAM/USA). Complementa al Buro de Credito con una perspectiva internacional.',
    input_schema: {
      type: 'object',
      properties: {
        rfc: { type: 'string', description: 'RFC del solicitante' }
      },
      required: ['rfc']
    }
  },
  {
    name: 'get_clarity_score',
    description: 'Obtiene score alternativo LATAM de Clarity Data. Util para solicitantes con historial crediticio limitado en el sistema formal.',
    input_schema: {
      type: 'object',
      properties: {
        rfc: { type: 'string', description: 'RFC del solicitante' }
      },
      required: ['rfc']
    }
  }
];

function mockEquifax(rfc) {
  // MOCK — reemplazar con API real cuando se contrate Equifax
  const scores = { 'ABC123456XYZ': 720, 'DEF789012UVW': 760, 'CANCELADO123': 420 };
  const score = scores[rfc] ?? 740;
  return { valid: true, rfc, global_score: score, region: 'LATAM', source: 'MOCK_EQUIFAX' };
}

function mockClarity(rfc) {
  // MOCK — reemplazar con API real cuando se contrate Clarity
  const scores = { 'ABC123456XYZ': 88, 'DEF789012UVW': 92, 'CANCELADO123': 20 };
  const score = scores[rfc] ?? 75;
  return { valid: true, rfc, score, source: 'MOCK_CLARITY' };
}

async function dispatchTool(name, input) {
  switch (name) {
    case 'validate_rfc_sat':
      return await validateRfc(input.rfc);
    case 'get_credit_score':
      return await getCreditReport({ countryCode: 'MX', identifier: input.rfc });
    case 'check_sanctions':
      return await screenEntity(input.name);
    case 'check_pep':
      return screenCargoAgainstPepCatalog(input.cargo_declarado);
    case 'get_equifax_score':
      return mockEquifax(input.rfc.toUpperCase().trim());
    case 'get_clarity_score':
      return mockClarity(input.rfc.toUpperCase().trim());
    default:
      return { error: `Tool desconocida: ${name}` };
  }
}

export async function runApplicantScreen({ rfc, name, pepCargo }) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'ANTHROPIC_API_KEY no configurada — agente no disponible' };
  }

  const rfcNorm = String(rfc || '').toUpperCase().trim();
  const nombreDisplay = name || rfcNorm;

  const systemPrompt = `Eres un analista de cumplimiento KYC de NSD International Finance.
Tu tarea: evaluar integralmente a un solicitante usando los tools disponibles.

RFC a evaluar: ${rfcNorm}
Nombre: ${nombreDisplay}
${pepCargo ? `Cargo declarado: ${pepCargo}` : 'Sin cargo publico declarado.'}

INSTRUCCIONES:
1. Llama validate_rfc_sat con el RFC
2. Si el RFC es valido, llama get_credit_score con el RFC
3. Llama check_sanctions con el nombre completo
4. ${pepCargo ? 'Llama check_pep con el cargo declarado' : 'Omite check_pep (sin cargo declarado)'}
5. Llama get_equifax_score y get_clarity_score con el RFC
6. Sintetiza todos los resultados en un parrafo conciso: validez RFC, score crediticio, resultado de sanciones, PEP si aplica, y recomendacion preliminar.
   Formato: "RFC VALIDO|INVALIDO | Score Buro: NNN | Sanciones: Limpio|HIT | [PEP: si/no] | Recomendacion: APROBAR/REVISAR/RECHAZAR"

Se directo y conciso.`;

  const messages = [{ role: 'user', content: systemPrompt }];
  const collected = {};
  let agentSummary = null;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools: TOOLS,
      messages
    });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text');
      agentSummary = textBlock?.text ?? 'Analisis completado';
      break;
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });

      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        let result;
        try {
          result = await dispatchTool(block.name, block.input);
        } catch (err) {
          result = { error: err.message };
        }

        collected[block.name] = result;
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: 'user', content: toolResults });
    } else {
      break;
    }
  }

  // Calcular scoring propietario con datos recolectados por el agente
  const rfcData      = collected['validate_rfc_sat']  ?? {};
  const bureauData   = collected['get_credit_score']   ?? {};
  const ofacData     = collected['check_sanctions']    ?? {};
  const pepData      = collected['check_pep']          ?? {};
  const equifaxData  = collected['get_equifax_score']  ?? {};
  const clarityData  = collected['get_clarity_score']  ?? {};

  const nsdScore   = calculateNsdScore({ rfcData, bureauData, ofacData, clarityData });
  const globalRisk = calculateGlobalRisk({ rfcData, bureauData, ofacData, pepData, equifaxData });
  const flagsResult = detectFlags({ rfcData, bureauData, ofacData, pepData });

  const dataSources = {
    rfc_validation: rfcData.source   ?? 'UNKNOWN',
    credit_score:   bureauData.source ?? 'UNKNOWN',
    sanctions:      ofacData.source   ?? 'REAL',
    pep:            pepData.source    ?? 'REAL',
    equifax:        equifaxData.source ?? 'UNKNOWN',
    clarity:        clarityData.source ?? 'UNKNOWN',
  };
  const mockSources = Object.entries(dataSources)
    .filter(([, src]) => String(src).startsWith('MOCK'))
    .map(([key]) => key);

  return {
    status: 'completed',
    rfc: rfcNorm,
    name: nombreDisplay,
    agent_summary: agentSummary,
    checks: {
      rfc_validation:  rfcData,
      credit_score:    bureauData,
      sanctions:       ofacData,
      pep:             pepData,
      equifax:         equifaxData,
      clarity:         clarityData
    },
    nsd_score:      nsdScore,
    global_risk:    globalRisk,
    flags:          flagsResult.flags,
    severity_level: flagsResult.severity_level,
    data_sources:   dataSources,
    mock_warning:   mockSources.length > 0
      ? `Datos simulados (MOCK) en: ${mockSources.join(', ')}. Configurar APIs reales para producción.`
      : null,
    iterations,
    model: MODEL,
    evaluated_at: new Date().toISOString()
  };
}
