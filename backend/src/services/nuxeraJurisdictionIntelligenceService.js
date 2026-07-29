const DATASET_VERSION = 'jurisdiction-evidence-v1-2026-07-27';

function L(language, es, en) { return language === 'en' ? en : es; }
function norm(value) { return String(value || '').toLowerCase(); }
function any(context, terms) {
  const haystack = [context.sector, context.country, context.city, context.state, context.province, context.emirate, context.description, context.structure, ...(context.claims || [])].map(norm).join(' ');
  return terms.some((term) => haystack.includes(norm(term)));
}

const PROFILES = {
  AE: {
    name: ['Emiratos Arabes Unidos', 'United Arab Emirates'], region: 'MENA / Gulf', risk: 'medium',
    economy: ['Economia diversificada con comercio, energia, finanzas, turismo, real estate, logistica y activos digitales. El dirham esta vinculado al USD; vigilar tasas globales y liquidez regional.', 'Diversified economy with trade, energy, finance, tourism, real estate, logistics and digital assets. The dirham is pegged to USD; monitor global rates and regional liquidity.'],
    politics: ['Entorno politico estable. El riesgo de decision se concentra en licencia, actividad regulada, sanciones, UBO, origen de fondos y free zone.', 'Stable political environment. Decision risk concentrates on license, regulated activity, sanctions, UBO, source of funds and free zone.'],
    social: ['Mercado urbano e internacional con alta movilidad laboral. Revisar residencia, representantes autorizados, actividad real y consistencia documental.', 'Urban and international market with high labor mobility. Review residency, authorized representatives, real activity and document consistency.'],
    indicators: [['Currency', 'AED peg to USD', 'Rates and USD liquidity matter for debt service.'], ['Economic drivers', 'Trade / energy / finance / tourism', 'Read sector risk by emirate and free zone.'], ['Regulatory intensity', 'High if regulated activity', 'Finance, payments, insurance, exchange and virtual assets need sector sources.'], ['Territory sensitivity', 'Medium', 'Dubai, DIFC, ADGM, mainland and free zones have different authorities.']],
    territories: {
      dubai: { label: 'Dubai', risk: 'medium', focus: ['Comercio, turismo, real estate, fintech y activos virtuales. Revisar DET/DED, VARA y DFSA si aplica DIFC.', 'Trade, tourism, real estate, fintech and virtual assets. Review DET/DED, VARA and DFSA if DIFC applies.'], signals: ['Confirm local/free-zone trade license before inferring operating capacity.', 'For VASP, distinguish authorized activity, license status and enforcement.', 'Verify whether the address maps to mainland, DIFC or free zone.'] },
      'abu dhabi': { label: 'Abu Dhabi', risk: 'medium', focus: ['Energia, infraestructura, fondos, ADGM y servicios financieros. Revisar ADGM RA/FSRA si corresponde.', 'Energy, infrastructure, funds, ADGM and financial services. Review ADGM RA/FSRA where applicable.'], signals: ['If incorporated in ADGM, corporate registry and financial supervision are reviewed through ADGM/FSRA.', 'For infrastructure, request permits, land rights, concessions and public contracts when relevant.'] }
    }
  },
  MX: {
    name: ['Mexico', 'Mexico'], region: 'North America / LATAM', risk: 'medium',
    economy: ['Economia abierta integrada a Norteamerica, sensible a tasas, FX, seguridad regional, energia y permisos sectoriales.', 'Open economy integrated with North America, sensitive to rates, FX, regional security, energy and sector permits.'],
    politics: ['Riesgo politico/regulatorio variable por sector y entidad federativa; revisar permisos, propiedad, cumplimiento fiscal y contratacion publica cuando aplique.', 'Political/regulatory risk varies by sector and state; review permits, ownership, tax compliance and public contracting where applicable.'],
    social: ['El riesgo territorial cambia por estado/municipio: seguridad, infraestructura, conflictividad comunitaria y permisos locales.', 'Territorial risk changes by state/municipality: security, infrastructure, community conflict and local permits.'],
    indicators: [['Currency', 'MXN floating', 'Review USD revenue/debt and hedges.'], ['Drivers', 'Manufacturing / exports / services', 'Nearshoring supports growth but increases CAPEX demand.'], ['Territory risk', 'Medium', 'State and municipality can materially change execution risk.']],
    territories: { bajio: { label: 'Bajio', risk: 'medium', focus: ['Agroindustria, manufactura y exportacion; validar agua, permisos, logistica y contratos.', 'Agribusiness, manufacturing and exports; validate water, permits, logistics and contracts.'], signals: ['Request local permits, water/utility evidence and supply contracts.'] } }
  },
  CO: {
    name: ['Colombia', 'Colombia'], region: 'LATAM / Andean', risk: 'medium',
    economy: ['Mercado andino con ecosistema fintech/SaaS en crecimiento, sensible a FX, tasas, reforma tributaria y regulacion sectorial.', 'Andean market with growing fintech/SaaS ecosystem, sensitive to FX, rates, tax reform and sector regulation.'],
    politics: ['Riesgo politico y regulatorio moderado; para servicios financieros revisar SFC, datos personales, pagos y cumplimiento local.', 'Moderate political and regulatory risk; for financial services review SFC, personal data, payments and local compliance.'],
    social: ['Riesgo territorial variable por ciudad/departamento; revisar seguridad, contratacion enterprise y continuidad operativa.', 'Territorial risk varies by city/department; review security, enterprise contracting and operational continuity.'],
    indicators: [['Currency', 'COP floating', 'Review USD/COP revenue, debt and burn rate.'], ['Drivers', 'Services / energy / tech', 'Enterprise traction should be checked against contracts and churn.'], ['Regulatory risk', 'Medium', 'Sector regulation and data protection matter for SaaS/fintech.']],
    territories: { bogota: { label: 'Bogota', risk: 'medium', focus: ['Centro corporativo y SaaS; revisar contratos enterprise, proteccion de datos y ciberseguridad.', 'Corporate and SaaS hub; review enterprise contracts, data protection and cybersecurity.'], signals: ['Request enterprise pipeline evidence and recurring contracts.'] } }
  }
};

const FALLBACK = { name: ['Pais no perfilado', 'Unprofiled country'], region: 'Global', risk: 'medium', economy: ['NUXERA requiere fuentes economicas y regulatorias adicionales antes de concluir una lectura del pais.', 'NUXERA requires additional economic and regulatory sources before concluding a country view.'], politics: ['Sin perfil local versionado; usar FATF, sanciones, Banco Mundial/IMF y revision humana.', 'No versioned local profile; use FATF, sanctions, World Bank/IMF and human review.'], social: ['Riesgo territorial pendiente de fuente local o proveedor especializado.', 'Territorial risk pending local source or specialized provider.'], indicators: [], territories: {} };

const SOURCES = [
  ['eocn-uae', 'AE', 'EOCN UAE / UN Sanctions', 'UAE / UN', 'public-feed', () => true, 'no-adverse-match', 'blocking-if-hit', ['Lista local de terroristas de EAU y sanciones del Consejo de Seguridad de Naciones Unidas.', 'UAE local terrorist list and United Nations Security Council sanctions.'], ['Nombre legal, aliases, UBO, representantes, nacionalidad y coincidencias difusas.', 'Legal name, aliases, UBO, representatives, nationality and fuzzy matches.'], ['No hay coincidencia adversa en el dataset controlado; una coincidencia potencial seria bloqueo hasta confirmar identidad.', 'No adverse match in the controlled dataset; a potential match would block until identity is confirmed.'], ['La ausencia de coincidencia no certifica cumplimiento; debe revalidarse contra fuente oficial antes de comite.', 'Absence of a match does not certify compliance; revalidate against the official source before committee.'], ['Revalidar con nombre legal, UBO y pasaportes antes de decision vinculante.', 'Revalidate with legal name, UBO and passports before any binding decision.']],
  ['cbuae', 'AE', 'Central Bank of the UAE', 'UAE federal', 'public-register-plus-provider', (c) => any(c, ['finance', 'fintech', 'payment', 'payments', 'bank', 'insurance', 'exchange']), 'manual-review-required', 'scoring-and-review', ['Bancos, financieras, aseguradoras, casas de cambio y proveedores de pagos licenciados.', 'Licensed banks, finance companies, insurers, exchange houses and payment service providers.'], ['Licencia, actividad autorizada, estatus y coincidencia con actividad declarada.', 'License, authorized activity, status and match against declared activity.'], ['La actividad declarada toca servicios financieros/pagos; el otorgante debe confirmar licencia o no aplicabilidad.', 'Declared activity touches financial/payment services; the grantor must confirm license or non-applicability.'], ['La verificacion automatica avanzada puede requerir convenio o fuente estructurada autorizada.', 'Advanced automated verification may require an agreement or authorized structured source.'], ['Pedir numero de licencia CBUAE o declaracion de no actividad regulada.', 'Request CBUAE license number or a statement of no regulated activity.']],
  ['vara', 'AE', 'VARA Public Register', 'Dubai', 'public-register', (c) => any(c, ['virtual', 'vasp', 'crypto', 'digital asset', 'asset']), 'manual-review-required', 'blocking-if-unauthorized', ['Proveedores de servicios de activos virtuales, actividades autorizadas, estatus y enforcement.', 'Virtual asset service providers, authorized activities, status and enforcement.'], ['Registro publico, enforcement, actividad VASP, nombre comercial y licencia.', 'Public register, enforcement, VASP activity, trade name and license.'], ['Por sector, VARA es fuente decision-relevante; sin licencia exacta, el resultado no debe leerse como validacion.', 'By sector, VARA is decision-relevant; without exact license, result should not be read as validation.'], ['Nombre parecido no basta. Debe cruzarse licencia, actividad autorizada y direccion/jurisdiccion.', 'Similar name is not enough. Cross-check license, authorized activity and address/jurisdiction.'], ['Solicitar licencia VARA, actividad autorizada y evidencia de no enforcement.', 'Request VARA license, authorized activity and evidence of no enforcement.']],
  ['dfsa', 'AE', 'DFSA Public Register', 'DIFC / Dubai', 'public-register', (c) => any(c, ['difc', 'fund', 'finance', 'investment', 'asset management']), 'conditional-not-applicable', 'conditional', ['Firmas, fondos, personas autorizadas y acciones regulatorias dentro del DIFC.', 'Firms, funds, authorized individuals and regulatory actions within DIFC.'], ['Presencia en DIFC, autorizaciones, personas aprobadas, restricciones y enforcement.', 'DIFC presence, authorizations, approved persons, restrictions and enforcement.'], ['Aplicable si la entidad opera o declara presencia en DIFC; si no, queda como fuente condicionada.', 'Applicable if the entity operates or declares presence in DIFC; otherwise it remains conditional.'], ['No cubre todo EAU; solo el perimetro DIFC.', 'Does not cover all UAE; only the DIFC perimeter.'], ['Confirmar si la entidad esta incorporada o regulada en DIFC.', 'Confirm whether the entity is incorporated or regulated in DIFC.']],
  ['fsra-adgm', 'AE', 'FSRA / ADGM Financial Register', 'ADGM / Abu Dhabi', 'public-register-planned', (c) => any(c, ['adgm', 'abu dhabi', 'fund', 'finance', 'investment']), 'provider-required', 'scoring-and-review', ['Servicios financieros, fondos, valores, personas autorizadas y acciones regulatorias en ADGM.', 'Financial services, funds, securities, authorized persons and regulatory actions in ADGM.'], ['Estatus regulado, permisos, restricciones y personas aprobadas.', 'Regulated status, permissions, restrictions and approved persons.'], ['La fuente es relevante si la estructura toca ADGM o servicios financieros de Abu Dhabi.', 'The source is relevant if the structure touches ADGM or Abu Dhabi financial services.'], ['Integracion automatica requiere mapeo del registro publico o acceso institucional.', 'Automated integration requires public-register mapping or institutional access.'], ['Confirmar jurisdiccion de incorporacion y pedir registro ADGM/FSRA si aplica.', 'Confirm incorporation jurisdiction and request ADGM/FSRA registration where applicable.']],
  ['adgm-ra', 'AE', 'ADGM Registration Authority', 'ADGM / Abu Dhabi', 'public-register-planned', (c) => any(c, ['adgm', 'abu dhabi']), 'provider-required', 'conditional', ['Existencia legal, licencia y estatus de companias registradas en ADGM.', 'Legal existence, license and status of companies registered in ADGM.'], ['Nombre legal, numero de registro, estatus, tipo de entidad y fecha.', 'Legal name, registration number, status, entity type and date.'], ['Obligatoria si el solicitante declara ADGM; condicionada si opera desde otro emirato.', 'Mandatory if the applicant declares ADGM; conditional if it operates from another emirate.'], ['No sustituye validacion de licencia financiera FSRA cuando la actividad es regulada.', 'Does not replace FSRA financial license validation when activity is regulated.'], ['Pedir certificado de incumbencia o extracto corporativo ADGM si corresponde.', 'Request certificate of incumbency or ADGM corporate extract where relevant.']],
  ['fta-trn', 'AE', 'Federal Tax Authority TRN', 'UAE federal', 'public-verification-limited', () => true, 'document-required', 'scoring', ['Verificacion de TRN, IVA y situacion tributaria autorizada.', 'TRN, VAT and authorized tax status verification.'], ['Formato TRN, consistencia fiscal, razon social y registro de IVA cuando aplica.', 'TRN format, tax consistency, legal name and VAT registration where applicable.'], ['Debe incorporarse TRN o declaracion de no obligacion fiscal segun actividad y umbrales.', 'TRN or a non-obligation statement should be included depending on activity and thresholds.'], ['La consulta avanzada puede requerir autorizacion institucional o evidencia cargada por el solicitante.', 'Advanced query may require institutional authorization or applicant-uploaded evidence.'], ['Solicitar TRN/certificado fiscal o justificacion de no registro.', 'Request TRN/tax certificate or justification for no registration.']],
  ['ner-ded', 'AE', 'National Economic Register / DET-DED', 'UAE / emirates', 'public-partial-provider-required', () => true, 'manual-review-required', 'scoring-and-review', ['Licencias comerciales, actividades economicas, nombre empresarial y registros locales por emirato.', 'Trade licenses, economic activities, business names and local emirate registrations.'], ['Licencia comercial, actividad, estatus, emirato, vigencia y nombre comercial.', 'Trade license, activity, status, emirate, validity and trade name.'], ['Para UAE, la licencia comercial local/free-zone es evidencia base antes de revisar capacidad operativa.', 'For UAE, the local/free-zone trade license is baseline evidence before assessing operating capacity.'], ['Los servicios publicos son parciales; API completa suele requerir convenio o credenciales.', 'Public services are partial; complete API usually requires agreement or credentials.'], ['Pedir trade license vigente y emirato/free zone de incorporacion.', 'Request current trade license and incorporation emirate/free zone.']],
  ['fatf-global', 'GLOBAL', 'FATF / Sanctions Country Risk', 'Global', 'public-list', () => true, 'jurisdiction-context', 'scoring', ['Jurisdicciones de alto riesgo, monitoreo aumentado y listas de sanciones globales.', 'High-risk jurisdictions, increased monitoring and global sanctions lists.'], ['Pais del proyecto, pais de UBO, origen de fondos y contraparte.', 'Project country, UBO country, source of funds and counterparty.'], ['Contexto pais usado para decidir revision humana, no para aprobar automaticamente.', 'Country context used to decide human review, not to approve automatically.'], ['Debe combinarse con fuentes locales y evidencia documental.', 'Must be combined with local sources and documentary evidence.'], ['Cruzar pais del proyecto, UBO y flujo de fondos.', 'Cross-check project country, UBO and funds flow.']]
];

const RESULT_LABELS = {
  'no-adverse-match': ['Sin coincidencia adversa', 'No adverse match'],
  'manual-review-required': ['Revision manual requerida', 'Manual review required'],
  'provider-required': ['Proveedor/convenio requerido', 'Provider/agreement required'],
  'document-required': ['Documento requerido', 'Document required'],
  'conditional-not-applicable': ['Condicional / no aplicable aun', 'Conditional / not yet applicable'],
  'jurisdiction-context': ['Contexto jurisdiccional', 'Jurisdiction context']
};

const IMPACT_LABELS = {
  'blocking-if-hit': ['Bloquea si hay coincidencia confirmada', 'Blocks if confirmed hit'],
  'blocking-if-unauthorized': ['Bloquea si actividad regulada no esta autorizada', 'Blocks if regulated activity is unauthorized'],
  'scoring-and-review': ['Afecta score y revision humana', 'Affects score and human review'],
  scoring: ['Afecta score documental/regulatorio', 'Affects documentary/regulatory score'],
  conditional: ['Aplica si jurisdiccion/actividad coincide', 'Applies if jurisdiction/activity matches']
};

function contextFromTimeline(timeline) {
  const order = timeline?.order || {};
  const metadata = order.metadata || {};
  return {
    country: String(order.country || metadata.country || 'MX').toUpperCase(),
    sector: metadata.sector || order.sector || '',
    city: metadata.city || metadata.municipality || metadata.projectCity || '',
    state: metadata.state || metadata.province || metadata.region || '',
    province: metadata.province || metadata.state || metadata.emirate || '',
    emirate: metadata.emirate || metadata.province || metadata.state || '',
    description: metadata.description || metadata.useOfFunds || order.description || '',
    structure: metadata.structure || metadata.fundingStructure || '',
    claims: metadata.regulatoryClaims || metadata.activities || metadata.documents || [],
    applicant: metadata.companyName || order.applicantName || order.caseNumber || order.id || 'entity',
    riskLevel: norm(order.riskLevel || metadata.riskLevel || '')
  };
}

function territory(profile, context, language) {
  const keys = [context.city, context.province, context.state, context.emirate, context.description].map(norm).filter(Boolean);
  const hit = Object.entries(profile.territories || {}).find(([key]) => keys.some((value) => value.includes(key) || key.includes(value)));
  const row = hit?.[1] || { label: context.city || context.province || context.state || L(language, 'Territorio no especificado', 'Unspecified territory'), risk: profile.risk || 'medium', focus: ['Sin perfil subnacional versionado; usar fuentes locales, evidencia documental y revision humana.', 'No versioned subnational profile; use local sources, documentary evidence and human review.'], signals: ['Request operating address, local license and municipal/provincial permits where applicable.', 'Do not conclude territorial risk without local source or document verification.'] };
  return { label: row.label, risk: row.risk, focus: Array.isArray(row.focus) ? L(language, row.focus[0], row.focus[1]) : row.focus, signals: row.signals || [] };
}

function localizeSource(row, context, language) {
  const [id, country, name, jurisdiction, sourceMode, applies, result, weight, coverage, checked, meaning, limitation, next] = row;
  const applicable = country === 'GLOBAL' || applies(context);
  return { id, country, name, jurisdiction, sourceMode, applicable, result, resultLabel: L(language, ...(RESULT_LABELS[result] || [result, result])), decisionImpact: L(language, ...(IMPACT_LABELS[weight] || ['Informativo', 'Informative'])), coverage: L(language, coverage[0], coverage[1]), checked: L(language, checked[0], checked[1]), meaning: L(language, meaning[0], meaning[1]), limitation: L(language, limitation[0], limitation[1]), nextAction: L(language, next[0], next[1]) };
}

function riskLabel(language, risk) { return L(language, { low: 'Bajo', medium: 'Medio', high: 'Alto' }[risk] || 'Medio', { low: 'Low', medium: 'Medium', high: 'High' }[risk] || 'Medium'); }
function computeRisk(profileRisk, caseRisk, sources) {
  const weights = { low: 1, medium: 2, high: 3 };
  const pressure = sources.filter((source) => source.applicable && ['manual-review-required', 'provider-required', 'document-required'].includes(source.result)).length;
  const score = Math.min(3, Math.max(weights[profileRisk] || 2, weights[caseRisk] || 2) + (pressure >= 3 ? 1 : 0));
  return score >= 3 ? 'high' : score === 2 ? 'medium' : 'low';
}

export function buildJurisdictionEvidenceFromTimeline(timeline, { language = 'es', workspaceRole = 'grantor' } = {}) {
  const context = contextFromTimeline(timeline);
  const profile = PROFILES[context.country] || FALLBACK;
  const sources = SOURCES.filter((row) => row[1] === 'GLOBAL' || row[1] === context.country).map((row) => localizeSource(row, context, language)).sort((a, b) => Number(b.applicable) - Number(a.applicable));
  const active = sources.filter((source) => source.applicable);
  const unavailable = active.filter((source) => ['provider-required', 'document-required'].includes(source.result));
  const review = active.filter((source) => ['manual-review-required', 'provider-required', 'document-required'].includes(source.result));
  const riskTier = computeRisk(profile.risk, context.riskLevel, active);
  return {
    id: `nuxera-jurisdiction:${timeline?.orderId || timeline?.order?.id || 'unknown'}:${workspaceRole}`,
    source: 'remote-backend-controlled',
    datasetVersion: DATASET_VERSION,
    status: review.length ? L(language, 'Revision ampliada', 'Enhanced review') : L(language, 'Sin bloqueos evidentes', 'No evident blockers'),
    title: L(language, 'Evidencia regulatoria y jurisdiccional', 'Regulatory & Jurisdiction Evidence'),
    country: context.country,
    countryName: L(language, profile.name[0], profile.name[1]),
    region: profile.region,
    territory: territory(profile, context, language),
    riskTier,
    riskLabel: riskLabel(language, riskTier),
    decisionImpact: riskTier === 'high' ? L(language, 'No avanzar a decision vinculante sin subsanar fuentes criticas.', 'Do not move to binding decision without remediating critical sources.') : L(language, 'Puede avanzar a revision humana documentada, sujeto a evidencia pendiente.', 'May proceed to documented human review, subject to pending evidence.'),
    coverage: { reviewed: active.length, unavailable: unavailable.length, conditional: sources.filter((source) => !source.applicable).length, mode: unavailable.length ? L(language, 'Cobertura parcial con fuentes manuales/proveedor', 'Partial coverage with manual/provider sources') : L(language, 'Cobertura local controlada', 'Controlled local coverage') },
    countryBrief: { economy: L(language, profile.economy[0], profile.economy[1]), politics: L(language, profile.politics[0], profile.politics[1]), social: L(language, profile.social[0], profile.social[1]), indicators: (profile.indicators || []).map(([label, value, interpretation]) => ({ label, value, interpretation })) },
    sourceMap: active.map((source) => ({ id: source.id, name: source.name, jurisdiction: source.jurisdiction, resultLabel: source.resultLabel, decisionImpact: source.decisionImpact, nextAction: source.nextAction })),
    findings: active,
    conditionalSources: sources.filter((source) => !source.applicable).slice(0, 4).map((source) => ({ id: source.id, name: source.name, jurisdiction: source.jurisdiction, reason: L(language, 'No aplica salvo que actividad, free zone o estructura lo detone.', 'Not applicable unless activity, free zone or structure triggers it.') })),
    humanReviewChecklist: [
      L(language, `Confirmar pais, ciudad/provincia/estado y direccion operativa de ${context.applicant}.`, `Confirm country, city/province/state and operating address for ${context.applicant}.`),
      L(language, 'Cruzar actividad declarada contra licencia, permisos y regulador sectorial aplicable.', 'Cross-check declared activity against license, permits and applicable sector regulator.'),
      L(language, 'Verificar beneficiarios finales, representantes, origen de fondos y listas de sanciones.', 'Verify UBOs, representatives, source of funds and sanctions lists.'),
      L(language, 'Documentar fuente, fecha, alcance y limite antes de presentar a comite.', 'Document source, timestamp, scope and limitation before committee presentation.')
    ],
    scoreImpacts: [
      L(language, 'Fuentes regulatorias aplicables alimentan score de cumplimiento, readiness documental y blockers.', 'Applicable regulatory sources feed compliance score, documentary readiness and blockers.'),
      L(language, 'Fuentes sin convenio no deben bajar automaticamente el score; generan solicitud documental o revision manual.', 'Sources without agreement should not automatically lower the score; they generate document requests or manual review.'),
      L(language, 'Coincidencias confirmadas en sanciones, actividad no autorizada o licencia vencida si pueden bloquear exposicion a otorgantes.', 'Confirmed sanctions hits, unauthorized activity or expired license can block exposure to funders.')
    ],
    providerPlan: {
      publicApis: ['World Bank Indicators', 'World Governance Indicators', 'IMF DataMapper', 'FATF public lists', 'UN/EOCN sanctions feeds'],
      privateOrAgreement: ['UAE PASS', 'CBUAE structured register', 'ADGM/FSRA structured access', 'FTA advanced TRN verification', 'NER/DET/DED full electronic connection'],
      runtimePolicy: 'allowlisted-sources-only; store source URL, timestamp, query and response summary; no approval from absence of match'
    },
    guardrails: [
      'Jurisdiction evidence is read-only and cannot approve, reject, issue a term sheet or send notifications.',
      'Absence of a public match is not certification of compliance; official source revalidation and human review remain required.',
      'Live public/API calls must be allowlisted and provenance-logged before production use.'
    ]
  };
}
