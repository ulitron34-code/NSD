import { pickLang } from "../../data/requisitosMinimos";

const DATASET_VERSION = "jurisdiction-evidence-v1-2026-07-27";

const profiles = {
  AE: {
    name: { es: "Emiratos Arabes Unidos", en: "United Arab Emirates" },
    region: "MENA / Gulf",
    risk: "medium",
    economy: { es: "Economia diversificada con comercio, energia, finanzas, turismo, real estate, logistica y activos digitales. El dirham esta vinculado al USD, lo que reduce volatilidad cambiaria directa pero mantiene sensibilidad a tasas globales.", en: "Diversified economy with trade, energy, finance, tourism, real estate, logistics and digital assets. The dirham is pegged to USD, reducing direct FX volatility but keeping sensitivity to global rates." },
    politics: { es: "Entorno politico estable e institucionalizado. El riesgo para el otorgante se concentra en licencia, actividad regulada, sanciones, UBO, origen de fondos y jurisdiccion/free zone.", en: "Stable and institutionalized political environment. Grantor risk concentrates on license, regulated activity, sanctions, UBO, source of funds and jurisdiction/free zone." },
    social: { es: "Mercado urbano e internacional con alta movilidad laboral. Revisar residencia, representantes autorizados, actividad real y consistencia documental.", en: "Urban and international market with high labor mobility. Review residency, authorized representatives, real activity and document consistency." },
    indicators: [
      ["Currency", "AED peg to USD", "Rates and USD liquidity matter for debt service."],
      ["Economic drivers", "Trade / energy / finance / tourism", "Read sector risk by emirate and free zone."],
      ["Regulatory intensity", "High if regulated activity", "Finance, payments, insurance, exchange and virtual assets need sector sources."],
      ["Territory sensitivity", "Medium", "Dubai, DIFC, ADGM, mainland and free zones have different authorities."]
    ],
    territories: {
      dubai: { label: "Dubai", risk: "medium", focus: { es: "Comercio, turismo, real estate, fintech y activos virtuales. Revisar DET/DED, VARA y DFSA si aplica DIFC.", en: "Trade, tourism, real estate, fintech and virtual assets. Review DET/DED, VARA and DFSA if DIFC applies." }, signals: ["Confirm local/free-zone trade license before inferring operating capacity.", "For VASP, distinguish authorized activity, license status and enforcement.", "Verify whether the address maps to mainland, DIFC or free zone."] },
      "abu dhabi": { label: "Abu Dhabi", risk: "medium", focus: { es: "Energia, infraestructura, fondos, ADGM y servicios financieros. Revisar ADGM RA/FSRA si corresponde.", en: "Energy, infrastructure, funds, ADGM and financial services. Review ADGM RA/FSRA where applicable." }, signals: ["If incorporated in ADGM, corporate registry and financial supervision are reviewed through ADGM/FSRA.", "For infrastructure, request permits, land rights, concessions and public contracts when relevant."] }
    }
  },
  MX: {
    name: { es: "Mexico", en: "Mexico" },
    region: "North America / LATAM",
    risk: "medium",
    economy: { es: "Economia abierta integrada a Norteamerica, sensible a tasas, FX, seguridad regional, energia y permisos sectoriales.", en: "Open economy integrated with North America, sensitive to rates, FX, regional security, energy and sector permits." },
    politics: { es: "Riesgo politico/regulatorio variable por sector y entidad federativa; revisar permisos, propiedad, cumplimiento fiscal y contratacion publica cuando aplique.", en: "Political/regulatory risk varies by sector and state; review permits, ownership, tax compliance and public contracting where applicable." },
    social: { es: "El riesgo territorial cambia por estado/municipio: seguridad, infraestructura, conflictividad comunitaria y permisos locales.", en: "Territorial risk changes by state/municipality: security, infrastructure, community conflict and local permits." },
    indicators: [["Currency", "MXN floating", "Review USD revenue/debt and hedges."], ["Drivers", "Manufacturing / exports / services", "Nearshoring supports growth but increases CAPEX demand."], ["Territory risk", "Medium", "State and municipality can materially change execution risk."]],
    territories: {
      bajio: { label: "Bajio", risk: "medium", focus: { es: "Agroindustria, manufactura y exportacion; validar agua, permisos, logistica y contratos.", en: "Agribusiness, manufacturing and exports; validate water, permits, logistics and contracts." }, signals: ["Request local permits, water/utility evidence and supply contracts."] },
      "nuevo leon": { label: "Nuevo Leon", risk: "medium", focus: { es: "Industria, energia y logistica; revisar infraestructura, energia y exposicion USD.", en: "Industry, energy and logistics; review infrastructure, energy and USD exposure." }, signals: ["Validate power capacity, municipal permits and customer contracts."] }
    }
  },
  CO: {
    name: { es: "Colombia", en: "Colombia" },
    region: "LATAM / Andean",
    risk: "medium",
    economy: { es: "Mercado andino con ecosistema fintech/SaaS en crecimiento, sensible a FX, tasas, reforma tributaria y regulacion sectorial.", en: "Andean market with growing fintech/SaaS ecosystem, sensitive to FX, rates, tax reform and sector regulation." },
    politics: { es: "Riesgo politico y regulatorio moderado; para servicios financieros revisar SFC, datos personales, pagos y cumplimiento local.", en: "Moderate political and regulatory risk; for financial services review SFC, personal data, payments and local compliance." },
    social: { es: "Riesgo territorial variable por ciudad/departamento; revisar seguridad, contratacion enterprise y continuidad operativa.", en: "Territorial risk varies by city/department; review security, enterprise contracting and operational continuity." },
    indicators: [["Currency", "COP floating", "Review USD/COP revenue, debt and burn rate."], ["Drivers", "Services / energy / tech", "Enterprise traction should be checked against contracts and churn."], ["Regulatory risk", "Medium", "Sector regulation and data protection matter for SaaS/fintech."]],
    territories: { bogota: { label: "Bogota", risk: "medium", focus: { es: "Centro corporativo y SaaS; revisar contratos enterprise, proteccion de datos y ciberseguridad.", en: "Corporate and SaaS hub; review enterprise contracts, data protection and cybersecurity." }, signals: ["Request enterprise pipeline evidence and recurring contracts."] } }
  }
};

const fallbackProfile = {
  name: { es: "Pais no perfilado", en: "Unprofiled country" },
  region: "Global",
  risk: "medium",
  economy: { es: "NUXERA requiere fuentes economicas y regulatorias adicionales antes de concluir una lectura del pais.", en: "NUXERA requires additional economic and regulatory sources before concluding a country view." },
  politics: { es: "Sin perfil local versionado; usar FATF, sanciones, Banco Mundial/IMF y revision humana.", en: "No versioned local profile; use FATF, sanctions, World Bank/IMF and human review." },
  social: { es: "Riesgo territorial pendiente de fuente local o proveedor especializado.", en: "Territorial risk pending local source or specialized provider." },
  indicators: [],
  territories: {}
};

const sourceCatalog = [
  ["eocn-uae", "AE", "EOCN UAE / UN Sanctions", "UAE / UN", "public-feed", () => true, "no-adverse-match", "blocking-if-hit", {
    coverage: { es: "Lista local de terroristas de EAU y sanciones del Consejo de Seguridad de Naciones Unidas.", en: "UAE local terrorist list and United Nations Security Council sanctions." },
    checked: { es: "Nombre legal, aliases, UBO, representantes, nacionalidad y coincidencias difusas.", en: "Legal name, aliases, UBO, representatives, nationality and fuzzy matches." },
    meaning: { es: "No hay coincidencia adversa simulada en el dataset controlado; una coincidencia potencial seria bloqueo hasta confirmar identidad.", en: "No adverse match in the controlled dataset; a potential match would block until identity is confirmed." },
    limitation: { es: "La ausencia de coincidencia no certifica cumplimiento; debe revalidarse contra fuente oficial antes de comite.", en: "Absence of a match does not certify compliance; revalidate against the official source before committee." },
    next: { es: "Revalidar con nombre legal, UBO y pasaportes antes de decision vinculante.", en: "Revalidate with legal name, UBO and passports before any binding decision." }
  }],
  ["cbuae", "AE", "Central Bank of the UAE", "UAE federal", "public-register-plus-provider", (c) => hasAny(c, ["finance", "fintech", "payment", "payments", "bank", "insurance", "exchange"]), "manual-review-required", "scoring-and-review", {
    coverage: { es: "Bancos, financieras, aseguradoras, casas de cambio y proveedores de pagos licenciados.", en: "Licensed banks, finance companies, insurers, exchange houses and payment service providers." },
    checked: { es: "Licencia, actividad autorizada, estatus y coincidencia con actividad declarada.", en: "License, authorized activity, status and match against declared activity." },
    meaning: { es: "La actividad declarada toca servicios financieros/pagos; el otorgante debe confirmar licencia o no aplicabilidad.", en: "Declared activity touches financial/payment services; the grantor must confirm license or non-applicability." },
    limitation: { es: "La verificacion automatica avanzada puede requerir convenio o fuente estructurada autorizada.", en: "Advanced automated verification may require an agreement or authorized structured source." },
    next: { es: "Pedir numero de licencia CBUAE o declaracion de no actividad regulada.", en: "Request CBUAE license number or a statement of no regulated activity." }
  }],
  ["vara", "AE", "VARA Public Register", "Dubai", "public-register", (c) => hasAny(c, ["virtual", "vasp", "crypto", "digital asset", "asset"]), "manual-review-required", "blocking-if-unauthorized", {
    coverage: { es: "Proveedores de servicios de activos virtuales, actividades autorizadas, estatus y enforcement.", en: "Virtual asset service providers, authorized activities, status and enforcement." },
    checked: { es: "Registro publico, enforcement, actividad VASP, nombre comercial y licencia.", en: "Public register, enforcement, VASP activity, trade name and license." },
    meaning: { es: "Por sector, VARA es fuente decision-relevante; sin licencia exacta, el resultado no debe leerse como validacion.", en: "By sector, VARA is decision-relevant; without exact license, result should not be read as validation." },
    limitation: { es: "Nombre parecido no basta. Debe cruzarse licencia, actividad autorizada y direccion/jurisdiccion.", en: "Similar name is not enough. Cross-check license, authorized activity and address/jurisdiction." },
    next: { es: "Solicitar licencia VARA, actividad autorizada y evidencia de no enforcement.", en: "Request VARA license, authorized activity and evidence of no enforcement." }
  }],
  ["dfsa", "AE", "DFSA Public Register", "DIFC / Dubai", "public-register", (c) => hasAny(c, ["difc", "fund", "finance", "investment", "asset management"]), "conditional-not-applicable", "conditional", {
    coverage: { es: "Firmas, fondos, personas autorizadas y acciones regulatorias dentro del DIFC.", en: "Firms, funds, authorized individuals and regulatory actions within DIFC." },
    checked: { es: "Presencia en DIFC, autorizaciones, personas aprobadas, restricciones y enforcement.", en: "DIFC presence, authorizations, approved persons, restrictions and enforcement." },
    meaning: { es: "Aplicable si la entidad opera o declara presencia en DIFC; si no, queda como fuente condicionada.", en: "Applicable if the entity operates or declares presence in DIFC; otherwise it remains conditional." },
    limitation: { es: "No cubre todo EAU; solo el perimetro DIFC.", en: "Does not cover all UAE; only the DIFC perimeter." },
    next: { es: "Confirmar si la entidad esta incorporada o regulada en DIFC.", en: "Confirm whether the entity is incorporated or regulated in DIFC." }
  }],
  ["fsra-adgm", "AE", "FSRA / ADGM Financial Register", "ADGM / Abu Dhabi", "public-register-planned", (c) => hasAny(c, ["adgm", "abu dhabi", "fund", "finance", "investment"]), "provider-required", "scoring-and-review", {
    coverage: { es: "Servicios financieros, fondos, valores, personas autorizadas y acciones regulatorias en ADGM.", en: "Financial services, funds, securities, authorized persons and regulatory actions in ADGM." },
    checked: { es: "Estatus regulado, permisos, restricciones y personas aprobadas.", en: "Regulated status, permissions, restrictions and approved persons." },
    meaning: { es: "La fuente es relevante si la estructura toca ADGM o servicios financieros de Abu Dhabi.", en: "The source is relevant if the structure touches ADGM or Abu Dhabi financial services." },
    limitation: { es: "Integracion automatica requiere mapeo del registro publico o acceso institucional.", en: "Automated integration requires public-register mapping or institutional access." },
    next: { es: "Confirmar jurisdiccion de incorporacion y pedir registro ADGM/FSRA si aplica.", en: "Confirm incorporation jurisdiction and request ADGM/FSRA registration where applicable." }
  }],
  ["adgm-ra", "AE", "ADGM Registration Authority", "ADGM / Abu Dhabi", "public-register-planned", (c) => hasAny(c, ["adgm", "abu dhabi"]), "provider-required", "conditional", {
    coverage: { es: "Existencia legal, licencia y estatus de companias registradas en ADGM.", en: "Legal existence, license and status of companies registered in ADGM." },
    checked: { es: "Nombre legal, numero de registro, estatus, tipo de entidad y fecha.", en: "Legal name, registration number, status, entity type and date." },
    meaning: { es: "Obligatoria si el solicitante declara ADGM; condicionada si opera desde otro emirato.", en: "Mandatory if the applicant declares ADGM; conditional if it operates from another emirate." },
    limitation: { es: "No sustituye validacion de licencia financiera FSRA cuando la actividad es regulada.", en: "Does not replace FSRA financial license validation when activity is regulated." },
    next: { es: "Pedir certificado de incumbencia o extracto corporativo ADGM si corresponde.", en: "Request certificate of incumbency or ADGM corporate extract where relevant." }
  }],
  ["fta-trn", "AE", "Federal Tax Authority TRN", "UAE federal", "public-verification-limited", () => true, "document-required", "scoring", {
    coverage: { es: "Verificacion de TRN, IVA y situacion tributaria autorizada.", en: "TRN, VAT and authorized tax status verification." },
    checked: { es: "Formato TRN, consistencia fiscal, razon social y registro de IVA cuando aplica.", en: "TRN format, tax consistency, legal name and VAT registration where applicable." },
    meaning: { es: "Debe incorporarse TRN o declaracion de no obligacion fiscal segun actividad y umbrales.", en: "TRN or a non-obligation statement should be included depending on activity and thresholds." },
    limitation: { es: "La consulta avanzada puede requerir autorizacion institucional o evidencia cargada por el solicitante.", en: "Advanced query may require institutional authorization or applicant-uploaded evidence." },
    next: { es: "Solicitar TRN/certificado fiscal o justificacion de no registro.", en: "Request TRN/tax certificate or justification for no registration." }
  }],
  ["ner-ded", "AE", "National Economic Register / DET-DED", "UAE / emirates", "public-partial-provider-required", () => true, "manual-review-required", "scoring-and-review", {
    coverage: { es: "Licencias comerciales, actividades economicas, nombre empresarial y registros locales por emirato.", en: "Trade licenses, economic activities, business names and local emirate registrations." },
    checked: { es: "Licencia comercial, actividad, estatus, emirato, vigencia y nombre comercial.", en: "Trade license, activity, status, emirate, validity and trade name." },
    meaning: { es: "Para UAE, la licencia comercial local/free-zone es evidencia base antes de revisar capacidad operativa.", en: "For UAE, the local/free-zone trade license is baseline evidence before assessing operating capacity." },
    limitation: { es: "Los servicios publicos son parciales; API completa suele requerir convenio o credenciales.", en: "Public services are partial; complete API usually requires agreement or credentials." },
    next: { es: "Pedir trade license vigente y emirato/free zone de incorporacion.", en: "Request current trade license and incorporation emirate/free zone." }
  }],
  ["fatf-global", "GLOBAL", "FATF / Sanctions Country Risk", "Global", "public-list", () => true, "jurisdiction-context", "scoring", {
    coverage: { es: "Jurisdicciones de alto riesgo, monitoreo aumentado y listas de sanciones globales.", en: "High-risk jurisdictions, increased monitoring and global sanctions lists." },
    checked: { es: "Pais del proyecto, pais de UBO, origen de fondos y contraparte.", en: "Project country, UBO country, source of funds and counterparty." },
    meaning: { es: "Contexto pais usado para decidir revision humana, no para aprobar automaticamente.", en: "Country context used to decide human review, not to approve automatically." },
    limitation: { es: "Debe combinarse con fuentes locales y evidencia documental.", en: "Must be combined with local sources and documentary evidence." },
    next: { es: "Cruzar pais del proyecto, UBO y flujo de fondos.", en: "Cross-check project country, UBO and funds flow." }
  }]
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function hasAny(context, terms) {
  const haystack = [context.sector, context.country, context.city, context.state, context.province, context.emirate, context.description, context.structure, ...(context.claims || [])].map(normalize).join(" ");
  return terms.some((term) => haystack.includes(normalize(term)));
}

function getContext(caseItem) {
  const metadata = caseItem?.order?.metadata || {};
  return {
    country: String(caseItem?.country || metadata.country || "MX").toUpperCase(),
    sector: metadata.sector || caseItem?.sector || "",
    city: metadata.city || metadata.municipality || metadata.projectCity || "",
    state: metadata.state || metadata.province || metadata.region || "",
    province: metadata.province || metadata.state || metadata.emirate || "",
    emirate: metadata.emirate || metadata.province || metadata.state || "",
    description: metadata.description || caseItem?.use || "",
    structure: metadata.structure || caseItem?.structure || "",
    claims: metadata.regulatoryClaims || metadata.activities || metadata.documents || []
  };
}

function resultLabel(result, language) {
  const labels = {
    "no-adverse-match": { es: "Sin coincidencia adversa", en: "No adverse match" },
    "manual-review-required": { es: "Revision manual requerida", en: "Manual review required" },
    "provider-required": { es: "Proveedor/convenio requerido", en: "Provider/agreement required" },
    "document-required": { es: "Documento requerido", en: "Document required" },
    "conditional-not-applicable": { es: "Condicional / no aplicable aun", en: "Conditional / not yet applicable" },
    "jurisdiction-context": { es: "Contexto jurisdiccional", en: "Jurisdiction context" }
  };
  return pickLang(labels[result] || { es: result, en: result }, language);
}

function decisionImpact(weight, language) {
  const labels = {
    "blocking-if-hit": { es: "Bloquea si hay coincidencia confirmada", en: "Blocks if confirmed hit" },
    "blocking-if-unauthorized": { es: "Bloquea si actividad regulada no esta autorizada", en: "Blocks if regulated activity is unauthorized" },
    "scoring-and-review": { es: "Afecta score y revision humana", en: "Affects score and human review" },
    scoring: { es: "Afecta score documental/regulatorio", en: "Affects documentary/regulatory score" },
    conditional: { es: "Aplica si jurisdiccion/actividad coincide", en: "Applies if jurisdiction/activity matches" }
  };
  return pickLang(labels[weight] || { es: "Informativo", en: "Informative" }, language);
}

function localizeSource(row, context, language) {
  const [id, country, name, jurisdiction, sourceMode, applies, result, weight, copy] = row;
  const applicable = country === "GLOBAL" || applies(context);
  return {
    id,
    country,
    name,
    jurisdiction,
    sourceMode,
    applicable,
    result,
    resultLabel: resultLabel(result, language),
    decisionImpact: decisionImpact(weight, language),
    coverage: pickLang(copy.coverage, language),
    checked: pickLang(copy.checked, language),
    meaning: pickLang(copy.meaning, language),
    limitation: pickLang(copy.limitation, language),
    nextAction: pickLang(copy.next, language)
  };
}

function resolveTerritory(profile, context, language) {
  const keys = [context.city, context.province, context.state, context.emirate, context.description].map(normalize).filter(Boolean);
  const found = Object.entries(profile.territories || {}).find(([key]) => keys.some((value) => value.includes(key) || key.includes(value)));
  const territory = found?.[1] || {
    label: context.city || context.province || context.state || pickLang({ es: "Territorio no especificado", en: "Unspecified territory" }, language),
    risk: profile.risk || "medium",
    focus: { es: "Sin perfil subnacional versionado; usar fuentes locales, evidencia documental y revision humana.", en: "No versioned subnational profile; use local sources, documentary evidence and human review." },
    signals: ["Request operating address, local license and municipal/provincial permits where applicable.", "Do not conclude territorial risk without local source or document verification."]
  };
  return {
    label: typeof territory.label === "object" ? pickLang(territory.label, language) : territory.label,
    risk: territory.risk,
    focus: pickLang(territory.focus, language),
    signals: territory.signals || []
  };
}

function riskLabel(risk, language) {
  return pickLang({ low: { es: "Bajo", en: "Low" }, medium: { es: "Medio", en: "Medium" }, high: { es: "Alto", en: "High" } }[risk] || { es: "Medio", en: "Medium" }, language);
}

function computeRisk(profileRisk, caseRisk, sources) {
  const weights = { low: 1, medium: 2, high: 3 };
  const pressure = sources.filter((source) => source.applicable && ["manual-review-required", "provider-required", "document-required"].includes(source.result)).length;
  const score = Math.min(3, Math.max(weights[profileRisk] || 2, weights[caseRisk] || 2) + (pressure >= 3 ? 1 : 0));
  return score >= 3 ? "high" : score === 2 ? "medium" : "low";
}

export function buildGrantorJurisdictionEvidence(caseItem, language = "es") {
  const context = getContext(caseItem);
  const profile = profiles[context.country] || fallbackProfile;
  const sources = sourceCatalog
    .filter((source) => source[1] === "GLOBAL" || source[1] === context.country)
    .map((source) => localizeSource(source, context, language))
    .sort((a, b) => Number(b.applicable) - Number(a.applicable));
  const activeSources = sources.filter((source) => source.applicable);
  const unavailable = activeSources.filter((source) => ["provider-required", "document-required"].includes(source.result));
  const review = activeSources.filter((source) => ["manual-review-required", "provider-required", "document-required"].includes(source.result));
  const riskTier = computeRisk(profile.risk, caseItem?.riskLevel, activeSources);
  const territory = resolveTerritory(profile, context, language);

  return {
    datasetVersion: DATASET_VERSION,
    status: review.length ? pickLang({ es: "Revision ampliada", en: "Enhanced review" }, language) : pickLang({ es: "Sin bloqueos evidentes", en: "No evident blockers" }, language),
    title: pickLang({ es: "Evidencia regulatoria y jurisdiccional", en: "Regulatory & Jurisdiction Evidence" }, language),
    country: context.country,
    countryName: pickLang(profile.name, language),
    region: profile.region,
    territory,
    riskTier,
    riskLabel: riskLabel(riskTier, language),
    decisionImpact: riskTier === "high"
      ? pickLang({ es: "No avanzar a decision vinculante sin subsanar fuentes criticas.", en: "Do not move to binding decision without remediating critical sources." }, language)
      : pickLang({ es: "Puede avanzar a revision humana documentada, sujeto a evidencia pendiente.", en: "May proceed to documented human review, subject to pending evidence." }, language),
    coverage: {
      reviewed: activeSources.length,
      unavailable: unavailable.length,
      conditional: sources.filter((source) => !source.applicable).length,
      mode: unavailable.length ? pickLang({ es: "Cobertura parcial con fuentes manuales/proveedor", en: "Partial coverage with manual/provider sources" }, language) : pickLang({ es: "Cobertura local controlada", en: "Controlled local coverage" }, language)
    },
    countryBrief: {
      economy: pickLang(profile.economy, language),
      politics: pickLang(profile.politics, language),
      social: pickLang(profile.social, language),
      indicators: (profile.indicators || []).map(([label, value, interpretation]) => ({ label, value, interpretation }))
    },
    sourceMap: activeSources.map((source) => ({ id: source.id, name: source.name, jurisdiction: source.jurisdiction, resultLabel: source.resultLabel, decisionImpact: source.decisionImpact, nextAction: source.nextAction })),
    findings: activeSources,
    conditionalSources: sources.filter((source) => !source.applicable).slice(0, 4).map((source) => ({ id: source.id, name: source.name, jurisdiction: source.jurisdiction, reason: pickLang({ es: "No aplica salvo que actividad, free zone o estructura lo detone.", en: "Not applicable unless activity, free zone or structure triggers it." }, language) })),
    humanReviewChecklist: [
      pickLang({ es: `Confirmar pais, ciudad/provincia/estado y direccion operativa de ${caseItem?.applicant || "la entidad"}.`, en: `Confirm country, city/province/state and operating address for ${caseItem?.applicant || "the entity"}.` }, language),
      pickLang({ es: "Cruzar actividad declarada contra licencia, permisos y regulador sectorial aplicable.", en: "Cross-check declared activity against license, permits and applicable sector regulator." }, language),
      pickLang({ es: "Verificar beneficiarios finales, representantes, origen de fondos y listas de sanciones.", en: "Verify UBOs, representatives, source of funds and sanctions lists." }, language),
      pickLang({ es: "Documentar fuente, fecha, alcance y limite antes de presentar a comite.", en: "Document source, timestamp, scope and limitation before committee presentation." }, language)
    ],
    scoreImpacts: [
      pickLang({ es: "Fuentes regulatorias aplicables alimentan score de cumplimiento, readiness documental y blockers.", en: "Applicable regulatory sources feed compliance score, documentary readiness and blockers." }, language),
      pickLang({ es: "Fuentes sin convenio no deben bajar automaticamente el score; generan solicitud documental o revision manual.", en: "Sources without agreement should not automatically lower the score; they generate document requests or manual review." }, language),
      pickLang({ es: "Coincidencias confirmadas en sanciones, actividad no autorizada o licencia vencida si pueden bloquear exposicion a otorgantes.", en: "Confirmed sanctions hits, unauthorized activity or expired license can block exposure to funders." }, language)
    ],
    guardrails: [
      pickLang({ es: "Dataset local versionado para decision support; no certifica cumplimiento ni sustituye consulta oficial.", en: "Versioned local dataset for decision support; it does not certify compliance or replace official queries." }, language),
      pickLang({ es: "Toda coincidencia o ausencia de coincidencia requiere evidencia documental y revision humana autorizada.", en: "Every match or absence of match requires documentary evidence and authorized human review." }, language)
    ]
  };
}
