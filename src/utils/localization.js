export const SUPPORTED_MARKETS = {
  MX: {
    label: "Mexico",
    locale: "es-MX",
    currency: "MXN",
    regulatorFocus: ["PLD/FT", "LFPDPPP", "SAT", "UIF"],
  },
  US: {
    label: "United States",
    locale: "en-US",
    currency: "USD",
    regulatorFocus: ["AML", "KYC", "FinCEN", "OFAC"],
  },
  CA: {
    label: "Canada",
    locale: "en-CA",
    currency: "CAD",
    regulatorFocus: ["AML", "FINTRAC", "Privacy"],
  },
  UK: {
    label: "United Kingdom",
    locale: "en-GB",
    currency: "GBP",
    regulatorFocus: ["AML", "FCA", "Companies House"],
  },
};

export function getMarketConfig(country = "MX") {
  return SUPPORTED_MARKETS[country] || SUPPORTED_MARKETS.MX;
}

export function formatMarketCurrency(amount = 0, country = "MX") {
  const market = getMarketConfig(country);
  return Number(amount || 0).toLocaleString(market.locale, {
    style: "currency",
    currency: market.currency,
    maximumFractionDigits: 0,
  });
}

export function formatMarketDate(value, country = "MX") {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat(getMarketConfig(country).locale).format(date);
}

export function buildInternationalReadiness(country = "MX") {
  const market = getMarketConfig(country);
  return [
    ["Mercado", market.label],
    ["Formato", `${market.locale} / ${market.currency}`],
    ["Enfoque regulatorio", market.regulatorFocus.join(", ")],
  ];
}

export function buildInternationalLaunchPlan() {
  return [
    {
      phase: "MVP internacional",
      markets: "Mexico + USA",
      status: "Recomendado",
      scope: "Copy, formatos, data room, disclaimers y scoring explicable para pilotos controlados.",
    },
    {
      phase: "Expansion inicial",
      markets: "Canada + UK",
      status: "Despues del piloto",
      scope: "Ajustes regulatorios, privacidad, formatos legales y validaciones por mercado.",
    },
    {
      phase: "Escalamiento",
      markets: "Europa / MENA",
      status: "No inmediato",
      scope: "Requiere revision legal, traduccion profesional, proveedores y soporte multi-region.",
    },
  ];
}
