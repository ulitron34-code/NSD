// Screening de Personas Politicamente Expuestas (PEP) para Mexico/LATAM.
//
// A diferencia de OFAC, no existe una lista de NOMBRES de PEP publicada
// gratuitamente por el gobierno mexicano. La SHCP publica en su lugar un
// catalogo de CARGOS PUBLICOS que confieren estatus de PEP (Anexo de
// "Personas Politicamente Expuestas" de las Disposiciones de caracter
// general LFPIORPI). El criterio estandar de la industria (y el que sigue
// este modulo) es: el cliente declara su cargo publico actual/pasado y el
// de sus relacionados (conyuge, parientes hasta 2o grado, socios/allegados
// cercanos), y se compara ese texto libre contra el catalogo de cargos.
//
// Esto es deliberadamente mas honesto que fingir una "base de datos de PEPs":
// no hay tal base de datos gratuita y confiable para Mexico, asi que no se
// inventa una.
const PEP_CARGO_CATEGORIES = [
  {
    category: 'Poder Ejecutivo Federal',
    keywords: [
      'presidente de la republica', 'presidente de mexico', 'secretario de estado',
      'secretaria de estado', 'subsecretario', 'subsecretaria', 'oficial mayor',
      'fiscal general de la republica', 'procurador general', 'comisionado nacional',
      'titular de organismo descentralizado', 'director general de paraestatal',
      'consejero juridico del ejecutivo'
    ]
  },
  {
    category: 'Poder Legislativo Federal',
    keywords: [
      'senador', 'senadora', 'diputado federal', 'diputada federal',
      'secretario general de la camara', 'presidente de la mesa directiva',
      'coordinador parlamentario'
    ]
  },
  {
    category: 'Poder Judicial Federal',
    keywords: [
      'ministro de la suprema corte', 'ministra de la suprema corte', 'scjn',
      'magistrado federal', 'magistrada federal', 'juez federal', 'jueza federal',
      'consejero de la judicatura', 'consejera de la judicatura'
    ]
  },
  {
    category: 'Organismos autonomos y banca central',
    keywords: [
      'gobernador del banco de mexico', 'subgobernador del banco de mexico',
      'consejero del ine', 'consejera del ine', 'consejero presidente del ine',
      'comisionado de la cnbv', 'comisionado de la condusef', 'comisionado del inai',
      'presidente de la cndh'
    ]
  },
  {
    category: 'Ambito estatal',
    keywords: [
      'gobernador', 'gobernadora', 'secretario de gobierno estatal',
      'diputado local', 'diputada local', 'magistrado del tribunal superior de justicia',
      'fiscal general del estado', 'fiscal estatal'
    ]
  },
  {
    category: 'Ambito municipal',
    keywords: [
      'presidente municipal', 'presidenta municipal', 'sindico municipal',
      'sindica municipal', 'regidor', 'regidora'
    ]
  },
  {
    category: 'Partidos politicos',
    keywords: [
      'dirigente nacional de partido', 'dirigente estatal de partido',
      'presidente de partido politico', 'secretario general de partido politico'
    ]
  },
  {
    category: 'Fuerzas armadas y seguridad publica',
    keywords: [
      'secretario de la defensa nacional', 'secretario de marina',
      'general de division', 'general de brigada', 'almirante',
      'secretario de seguridad publica', 'comisionado de la guardia nacional',
      'director de la guardia nacional'
    ]
  },
  {
    category: 'Empresas productivas del Estado',
    keywords: [
      'director general de pemex', 'director general de cfe',
      'director general de banobras', 'director general de nafin'
    ]
  }
];

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const RELATIONSHIPS_THAT_EXTEND_PEP_STATUS = [
  'conyuge', 'esposo', 'esposa', 'concubino', 'concubina',
  'padre', 'madre', 'hijo', 'hija', 'hermano', 'hermana',
  'suegro', 'suegra', 'yerno', 'nuera', 'cunado', 'cunada',
  'socio', 'socia', 'allegado', 'allegada'
];

// Compara un cargo declarado (texto libre) contra el catalogo de cargos PEP.
// No requiere red ni API key: el catalogo es estatico y se mantiene en codigo.
export function screenCargoAgainstPepCatalog(declaredCargo, { relationship } = {}) {
  const trimmed = String(declaredCargo || '').trim();
  if (!trimmed) {
    return {
      status: 'skipped',
      detail: 'Sin cargo publico declarado para comparar contra el catalogo PEP',
      matchedCategory: null
    };
  }

  const normalized = normalizeText(trimmed);
  for (const { category, keywords } of PEP_CARGO_CATEGORIES) {
    const matchedKeyword = keywords.find((keyword) => normalized.includes(keyword));
    if (matchedKeyword) {
      const relationshipNote = relationship
        ? ` (declarado para: ${relationship})`
        : '';
      return {
        status: 'hit',
        detail: `El cargo declarado "${trimmed}"${relationshipNote} coincide con la categoria PEP "${category}" `
          + `del catalogo de cargos publicos (LFPIORPI). Requiere revision manual antes de actuar.`,
        matchedCategory: category
      };
    }
  }

  return {
    status: 'clear',
    detail: `El cargo declarado "${trimmed}" no coincide con ninguna categoria del catalogo PEP.`,
    matchedCategory: null
  };
}

// Bajo LFPIORPI, el estatus PEP se extiende a conyuge, parientes hasta 2o
// grado de consanguinidad/afinidad, y socios/allegados cercanos. Esta funcion
// solo informa si la relacion declarada cae en ese alcance; no determina por
// si sola el estatus PEP (eso depende de si el cargo del relacionado matchea).
export function relationshipExtendsPepStatus(relationship = '') {
  const normalized = normalizeText(relationship);
  return RELATIONSHIPS_THAT_EXTEND_PEP_STATUS.some((r) => normalized.includes(r));
}

export function getPepCatalogSummary() {
  return PEP_CARGO_CATEGORIES.map(({ category, keywords }) => ({
    category,
    keywordCount: keywords.length
  }));
}
