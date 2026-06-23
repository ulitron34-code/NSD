// Deteccion de pais por keywords, como señal de cruce (no como fuente
// principal). La fuente principal sigue siendo el pais declarado por el
// solicitante en service_orders.metadata.country (ver getOrderCountry en
// documentIntelligenceService.js) -- el usuario ya lo dijo de entrada, no
// hay que adivinarlo. Esto solo sirve para detectar una discrepancia (p.ej.
// alguien declaro "Colombia" pero subio una cedula mexicana), que se reporta
// como advertencia en agentValidator, nunca como bloqueo automatico.
const COUNTRY_KEYWORDS = {
  MX: [
    ['instituto nacional electoral', 0.95],
    ['clave de elector', 0.90],
    ['servicio de administracion tributaria', 0.95],
    ['constancia de situacion fiscal', 0.95],
    ['registro federal de contribuyentes', 0.90],
    ['curp', 0.85],
    ['pesos mexicanos', 0.80],
    ['estados unidos mexicanos', 0.90]
  ],
  CO: [
    ['registraduria nacional', 0.95],
    ['cedula de ciudadania', 0.90],
    ['direccion de impuestos y aduanas nacionales', 0.95],
    ['dian', 0.80],
    ['camara de comercio de', 0.85],
    ['superintendencia de sociedades', 0.90],
    ['republica de colombia', 0.85],
    ['pesos colombianos', 0.80]
  ],
  EC: [
    ['servicio de rentas internas', 0.95],
    ['superintendencia de companias', 0.90],
    ['republica del ecuador', 0.85],
    ['registro civil ecuador', 0.90],
    ['sri', 0.60]
  ],
  AR: [
    ['administracion federal de ingresos publicos', 0.95],
    ['afip', 0.80],
    ['registro nacional de las personas', 0.90],
    ['renaper', 0.85],
    ['inspeccion general de justicia', 0.90],
    ['republica argentina', 0.85],
    ['pesos argentinos', 0.80],
    ['cuit', 0.75],
    ['cuil', 0.75]
  ],
  PE: [
    ['superintendencia nacional de aduanas y de administracion tributaria', 0.95],
    ['sunat', 0.80],
    ['registro nacional de identificacion', 0.90],
    ['reniec', 0.85],
    ['sunarp', 0.85],
    ['republica del peru', 0.85],
    ['soles', 0.70]
  ],
  CL: [
    ['servicio de impuestos internos', 0.95],
    ['sii', 0.60],
    ['conservador de bienes raices', 0.85],
    ['comision para el mercado financiero', 0.90],
    ['republica de chile', 0.85],
    ['pesos chilenos', 0.80],
    ['formulario 22', 0.85]
  ],
  BO: [
    ['servicio de impuestos nacionales', 0.90],
    ['estado plurinacional de bolivia', 0.95],
    ['seprec', 0.85],
    ['bolivianos', 0.75]
  ],
  PY: [
    ['subsecretaria de estado de tributacion', 0.95],
    ['republica del paraguay', 0.85],
    ['guaranies', 0.80],
    ['seprelad', 0.85]
  ],
  UY: [
    ['direccion general impositiva', 0.90],
    ['banco de prevision social', 0.85],
    ['republica oriental del uruguay', 0.95],
    ['pesos uruguayos', 0.80]
  ],
  US: [
    ['internal revenue service', 0.95],
    ['irs', 0.75],
    ['social security', 0.85],
    ['employer identification number', 0.95],
    ['department of state', 0.80],
    ['united states of america', 0.85],
    ['secretary of state', 0.80],
    ['form 1040', 0.95],
    ['form 1120', 0.95],
    ['form w-9', 0.90],
    ['us gaap', 0.85]
  ],
  CA: [
    ['canada revenue agency', 0.95],
    ['service canada', 0.90],
    ['social insurance number', 0.95],
    ['corporations canada', 0.90],
    ['canadian dollars', 0.80],
    ['form t2', 0.90],
    ['fintrac', 0.85]
  ]
};

function normalize(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Detecta el pais mas probable a partir del texto de un documento.
// Retorna { country, confidence, matches } o { country: null, confidence: 0,
// matches: [] } si no se encontro ninguna señal. confidence es la suma de
// los pesos de los keywords encontrados, no una probabilidad calibrada.
export function detectCountryFromText(textContent = '') {
  const normalizedText = normalize(textContent);
  if (!normalizedText) {
    return { country: null, confidence: 0, matches: [] };
  }

  let bestCountry = null;
  let bestScore = 0;
  let bestMatches = [];

  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    let score = 0;
    const matches = [];
    for (const [keyword, weight] of keywords) {
      if (normalizedText.includes(keyword)) {
        score += weight;
        matches.push(keyword);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCountry = country;
      bestMatches = matches;
    }
  }

  if (!bestCountry) {
    return { country: null, confidence: 0, matches: [] };
  }

  return { country: bestCountry, confidence: Math.min(bestScore, 1), matches: bestMatches };
}
