import { commercialCatalogAPI } from './api';

// Fuente única de precios/límites para landing, /modalidades y checkout
// (Fase 1 del plan comercial). El precio siempre viene resuelto por el
// backend desde commercial_prices; este archivo solo formatea para UI,
// nunca calcula ni asume un monto.
export async function fetchCommercialOffers({ audience, currency = 'USD' } = {}) {
  const { data } = await commercialCatalogAPI.listOffers(audience, currency);
  return data?.offers || [];
}

export function formatOfferPrice(offer, locale = 'es-MX') {
  const price = offer?.price;
  if (!price) return null;
  if (price.isCustomPricing) {
    const startingAt = price.metadata?.starting_at;
    const formatted = price.amountCents != null
      ? new Intl.NumberFormat(locale, { style: 'currency', currency: price.currency, maximumFractionDigits: 0 }).format(price.amountCents / 100)
      : null;
    if (!formatted) return null;
    return startingAt ? { amount: `${formatted}+`, interval: price.billingInterval } : { amount: formatted, interval: price.billingInterval };
  }
  if (price.amountCents == null) return null;
  const amount = new Intl.NumberFormat(locale, { style: 'currency', currency: price.currency, maximumFractionDigits: 0 }).format(price.amountCents / 100);
  return { amount, interval: price.billingInterval };
}

export function getEntitlement(offer, key) {
  return offer?.entitlements?.find((e) => e.key === key) || null;
}
