// NSD Global Intelligence Gateway — orquestador de sanciones.
// Corre todos los screeners en paralelo y devuelve un resultado unificado.
// El resultado incluye el veredicto global, hits por fuente y estado de cada lista.
// La decision final siempre corresponde al analista responsable; este modulo
// solo agrega y presenta la informacion disponible en cada fuente.
import { screenNameAgainstOfac, getOfacListStatus, primeOfacList } from './ofacScreening.js';
import { screenNameAgainstUn,   getUnListStatus,   primeUnList   } from './unScreening.js';
import { screenNameAgainstUk,   getUkListStatus,   primeUkList   } from './ukScreening.js';
import { screenNameAgainstEu,   getEuListStatus,   primeEuList   } from './euScreening.js';
import { screenNameAgainstCa,   getCaListStatus,   primeCaList   } from './caScreening.js';
import { screenNameAgainstFbi,  getFbiListStatus,  primeFbiList  } from './fbiScreening.js';

const SOURCES = [
  { key: 'ofac',  label: 'OFAC SDN (EE.UU.)',        screen: screenNameAgainstOfac, status: getOfacListStatus },
  { key: 'un',    label: 'Lista Consolidada ONU',     screen: screenNameAgainstUn,  status: getUnListStatus   },
  { key: 'uk',    label: 'OFSI UK (Reino Unido)',      screen: screenNameAgainstUk,  status: getUkListStatus   },
  { key: 'eu',    label: 'EU FSF (Union Europea)',     screen: screenNameAgainstEu,  status: getEuListStatus   },
  { key: 'ca',    label: 'SEMA Canada',               screen: screenNameAgainstCa,  status: getCaListStatus   },
  { key: 'fbi',   label: 'FBI Wanted',                screen: screenNameAgainstFbi, status: getFbiListStatus  },
];

// Corre el screening contra todas las fuentes en paralelo.
// name: string con el nombre o razon social a verificar.
// Retorna: { verdict, hits, results, screened_at }
export async function screenEntity(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return {
      verdict: 'skipped',
      reason: 'Sin nombre o razon social para verificar',
      hits: [],
      results: {},
      screened_at: new Date().toISOString()
    };
  }

  const settled = await Promise.allSettled(
    SOURCES.map(async (src) => {
      const result = src.screen(trimmed);
      return { key: src.key, label: src.label, ...result };
    })
  );

  const results = {};
  const hits = [];

  for (const outcome of settled) {
    if (outcome.status === 'rejected') continue;
    const { key, label, status, detail, matches, listEntries, listLoadedAt } = outcome.value;
    results[key] = { label, status, detail, matches: matches || [], listEntries, listLoadedAt };
    if (status === 'hit') {
      hits.push({ source: key, label, matches: matches || [] });
    }
  }

  const verdict = hits.length > 0 ? 'hit' : 'clear';

  return {
    verdict,
    name: trimmed,
    hits,
    results,
    screened_at: new Date().toISOString(),
    note: verdict === 'hit'
      ? 'Se encontraron coincidencias potenciales. La comparacion es heuristica por nombre. Requiere revision manual por el analista responsable antes de cualquier decision.'
      : 'Sin coincidencias en ninguna de las listas verificadas. La ausencia de coincidencia no equivale a una certificacion de cumplimiento.'
  };
}

// Estado de todas las listas (para el health check y el panel de administracion).
export function getGatewayStatus() {
  return Object.fromEntries(
    SOURCES.map((src) => [src.key, { label: src.label, ...src.status() }])
  );
}

// Inicia la precarga de todas las listas en paralelo.
// Llamar desde server.js al arranque; no bloquea.
export function primeAllLists() {
  primeOfacList();
  primeUnList();
  primeUkList();
  primeEuList();
  primeCaList();
  primeFbiList();
}
