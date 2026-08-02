import { supabaseAdmin } from '../config/supabase.js';

const AUDIENCES = new Set(['grantor', 'applicant']);

function assertAudience(audience) {
  if (audience && !AUDIENCES.has(audience)) {
    throw new Error(`audience inválida: "${audience}". Debe ser una de: ${[...AUDIENCES].join(', ')}.`);
  }
}

function mapEntitlements(rows = []) {
  return rows.map((row) => ({
    key: row.entitlement_key,
    limitValue: row.limit_value === null ? null : Number(row.limit_value),
    unit: row.unit,
    resetPeriod: row.reset_period
  }));
}

function mapPrice(row) {
  if (!row) return null;
  return {
    currency: row.currency,
    amountCents: row.amount_cents === null ? null : Number(row.amount_cents),
    isCustomPricing: row.is_custom_pricing,
    billingInterval: row.billing_interval,
    metadata: row.metadata || {}
  };
}

function mapOffer(offer, priceRow, entitlementRows) {
  return {
    code: offer.code,
    audience: offer.audience,
    billingModel: offer.billing_model,
    name: { es: offer.name_es, en: offer.name_en },
    description: { es: offer.description_es, en: offer.description_en },
    sortOrder: offer.sort_order,
    price: mapPrice(priceRow),
    entitlements: mapEntitlements(entitlementRows)
  };
}

// Fuente única de precios/límites que consumen landing, /modalidades,
// checkout y administración (Fase 1 del plan comercial). Solo devuelve
// ofertas activas y publicly_visible; nunca acepta ni resuelve un precio
// a partir de datos enviados por el cliente.
export async function listCommercialOffers({ audience, currency = 'USD' } = {}) {
  assertAudience(audience);
  const nowIso = new Date().toISOString();

  let offersQuery = supabaseAdmin
    .from('commercial_offers')
    .select('*')
    .eq('active', true)
    .eq('publicly_visible', true)
    .order('sort_order', { ascending: true });

  if (audience) offersQuery = offersQuery.eq('audience', audience);

  const { data: offers, error: offersError } = await offersQuery;
  if (offersError) throw offersError;
  if (!offers?.length) return [];

  const offerIds = offers.map((o) => o.id);

  const { data: prices, error: pricesError } = await supabaseAdmin
    .from('commercial_prices')
    .select('*')
    .in('offer_id', offerIds)
    .eq('currency', currency)
    .eq('active', true)
    .lte('effective_from', nowIso)
    .or(`effective_to.is.null,effective_to.gte.${nowIso}`);
  if (pricesError) throw pricesError;

  const { data: entitlements, error: entitlementsError } = await supabaseAdmin
    .from('offer_entitlements')
    .select('*')
    .in('offer_id', offerIds);
  if (entitlementsError) throw entitlementsError;

  const priceByOffer = new Map();
  for (const price of prices || []) {
    // effective_from/effective_to may overlap during a price change; keep
    // the most recently started active price for the requested currency.
    const current = priceByOffer.get(price.offer_id);
    if (!current || new Date(price.effective_from) > new Date(current.effective_from)) {
      priceByOffer.set(price.offer_id, price);
    }
  }

  const entitlementsByOffer = new Map();
  for (const entitlement of entitlements || []) {
    const list = entitlementsByOffer.get(entitlement.offer_id) || [];
    list.push(entitlement);
    entitlementsByOffer.set(entitlement.offer_id, list);
  }

  return offers
    .filter((offer) => priceByOffer.has(offer.id))
    .map((offer) => mapOffer(offer, priceByOffer.get(offer.id), entitlementsByOffer.get(offer.id)));
}

export async function resolveOfferByCode(code, { currency = 'USD' } = {}) {
  const { data: offer, error: offerError } = await supabaseAdmin
    .from('commercial_offers')
    .select('*')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();
  if (offerError) throw offerError;
  if (!offer) return null;

  const nowIso = new Date().toISOString();
  const { data: price, error: priceError } = await supabaseAdmin
    .from('commercial_prices')
    .select('*')
    .eq('offer_id', offer.id)
    .eq('currency', currency)
    .eq('active', true)
    .lte('effective_from', nowIso)
    .or(`effective_to.is.null,effective_to.gte.${nowIso}`)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (priceError) throw priceError;
  if (!price) return null;

  const { data: entitlements, error: entitlementsError } = await supabaseAdmin
    .from('offer_entitlements')
    .select('*')
    .eq('offer_id', offer.id);
  if (entitlementsError) throw entitlementsError;

  return mapOffer(offer, price, entitlements);
}
