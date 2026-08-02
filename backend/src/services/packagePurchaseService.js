import { supabaseAdmin } from '../config/supabase.js';
import { assertBillingAccountMember } from './billingAccountService.js';

function mapPurchase(row) {
  if (!row) return null;
  return {
    id: row.id,
    billingAccountId: row.billing_account_id,
    purchaserUserId: row.purchaser_user_id,
    offerId: row.offer_id,
    commercialPriceId: row.commercial_price_id,
    orderId: row.order_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    status: row.status,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    purchasedUa: row.purchased_ua === null || row.purchased_ua === undefined ? null : Number(row.purchased_ua),
    createdAt: row.created_at
  };
}

function notFound(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// Resuelve el precio y los límites de UA/vigencia directamente del catálogo
// -- nunca desde `offerCode` acompañado de un monto del cliente (sección
// 7.2 del plan: "nunca acepta un monto arbitrario del cliente"). No
// reutiliza commercialCatalogService.resolveOfferByCode porque esa función
// es la fuente pública de precios (usada por landing/checkout) y no expone
// los ids crudos de offer/price que esta compra necesita para sus foreign
// keys -- ampliar su contrato público solo para este caso interno hubiera
// sido un cambio innecesario a una pieza ya cubierta por sus propios tests.
async function resolveApplicantOfferForPurchase(offerCode, currency) {
  const { data: offer, error: offerError } = await supabaseAdmin
    .from('commercial_offers')
    .select('id, code, audience, active')
    .eq('code', offerCode)
    .eq('active', true)
    .maybeSingle();
  if (offerError) throw offerError;
  if (!offer) throw notFound(`Oferta "${offerCode}" no encontrada o inactiva`, 'OFFER_NOT_FOUND');
  if (offer.audience !== 'applicant') {
    throw notFound('Esta oferta no es un paquete de solicitante', 'OFFER_WRONG_AUDIENCE');
  }

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
  if (!price) throw notFound(`No hay un precio activo para "${offerCode}" en ${currency}`, 'PRICE_NOT_FOUND');
  if (price.is_custom_pricing) {
    throw notFound('Esta oferta requiere una propuesta administrada (SOW), no autoservicio', 'CUSTOM_PRICING_REQUIRES_SOW');
  }

  const { data: entitlementRows, error: entitlementsError } = await supabaseAdmin
    .from('offer_entitlements')
    .select('entitlement_key, limit_value')
    .eq('offer_id', offer.id);
  if (entitlementsError) throw entitlementsError;

  const ua = (entitlementRows || []).find((row) => row.entitlement_key === 'analysis_units');
  const validity = (entitlementRows || []).find((row) => row.entitlement_key === 'package_validity_days');

  return {
    offerId: offer.id,
    priceId: price.id,
    amountCents: Number(price.amount_cents),
    currency: price.currency,
    purchasedUa: ua ? Number(ua.limit_value) : null,
    validityDays: validity ? Number(validity.limit_value) : null
  };
}

// Sección 9.1/12 (Fase 4): crea la compra en `pending` con el precio ya
// resuelto en servidor. El PaymentIntent se genera después (stripeBillingService)
// y la activación real llega solo por webhook (sección 9.2) -- crear la fila
// no otorga nada todavía.
export async function createPendingPurchase({ applicantUserId, billingAccountId, offerCode, currency = 'USD' }) {
  if (!offerCode) throw new Error('offerCode es requerido');

  await assertBillingAccountMember(applicantUserId, billingAccountId);

  const resolved = await resolveApplicantOfferForPurchase(offerCode, currency);

  const { data, error } = await supabaseAdmin
    .from('package_purchases')
    .insert({
      billing_account_id: billingAccountId,
      purchaser_user_id: applicantUserId,
      offer_id: resolved.offerId,
      commercial_price_id: resolved.priceId,
      status: 'pending',
      purchased_ua: resolved.purchasedUa
    })
    .select()
    .single();
  if (error) throw error;

  return {
    purchase: mapPurchase(data),
    amountCents: resolved.amountCents,
    currency: resolved.currency,
    validityDays: resolved.validityDays
  };
}

export async function attachPaymentIntent(purchaseId, paymentIntentId) {
  const { data, error } = await supabaseAdmin
    .from('package_purchases')
    .update({ stripe_payment_intent_id: paymentIntentId })
    .eq('id', purchaseId)
    .select()
    .single();
  if (error) throw error;
  return mapPurchase(data);
}

// Idempotente por diseño (sección 9.2: "rechazar eventos duplicados"): si la
// compra ya está activa, no vuelve a fijar vigencia ni a acreditar UA de
// nuevo. Solo el webhook llama esto -- nunca la respuesta del navegador
// (sección 10.3: "no declarar éxito sólo por la respuesta del navegador").
export async function activatePackagePurchaseFromPaymentIntent(paymentIntent) {
  const purchaseId = paymentIntent?.metadata?.purchaseId;
  if (!purchaseId) return null;

  const { data: purchase, error } = await supabaseAdmin
    .from('package_purchases')
    .select('*')
    .eq('id', purchaseId)
    .maybeSingle();
  if (error) throw error;
  if (!purchase) return null;

  if (purchase.status === 'active') return mapPurchase(purchase);

  const { data: validityRow, error: validityError } = await supabaseAdmin
    .from('offer_entitlements')
    .select('limit_value')
    .eq('offer_id', purchase.offer_id)
    .eq('entitlement_key', 'package_validity_days')
    .maybeSingle();
  if (validityError) throw validityError;

  const startsAt = new Date();
  const expiresAt = validityRow?.limit_value
    ? new Date(startsAt.getTime() + Number(validityRow.limit_value) * 24 * 60 * 60 * 1000)
    : null;

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('package_purchases')
    .update({
      status: 'active',
      stripe_payment_intent_id: paymentIntent.id,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null
    })
    .eq('id', purchaseId)
    .select()
    .single();
  if (updateError) throw updateError;

  return mapPurchase(updated);
}
