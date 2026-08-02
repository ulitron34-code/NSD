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

// Los códigos `addon_*` (sección 2.2 del plan: UA extra, extensión de 30
// días) no son un grant independiente -- modifican una compra activa ya
// existente (paso 6, Fase 4). Se distinguen por el prefijo del código,
// mismo criterio que ya usan los seeds de Fase 1
// (2026-07-31_nuxera_commercial_catalog.sql) para nombrarlos.
function isAddonOfferCode(offerCode) {
  return offerCode.startsWith('addon_');
}

// Sección 9.1/12 (Fase 4): crea la compra en `pending` con el precio ya
// resuelto en servidor. El PaymentIntent se genera después (stripeBillingService)
// y la activación real llega solo por webhook (sección 9.2) -- crear la fila
// no otorga nada todavía. Para un adicional, `targetPurchaseId` identifica
// la compra activa que va a extender -- se valida acá, antes de cobrar
// nada, y viaja luego en la metadata del PaymentIntent para que la
// activación sepa a qué compra aplicar el efecto.
export async function createPendingPurchase({
  applicantUserId,
  billingAccountId,
  offerCode,
  currency = 'USD',
  targetPurchaseId = null
}) {
  if (!offerCode) throw new Error('offerCode es requerido');

  await assertBillingAccountMember(applicantUserId, billingAccountId);

  const resolved = await resolveApplicantOfferForPurchase(offerCode, currency);
  const isAddon = isAddonOfferCode(offerCode);

  if (isAddon) {
    if (!targetPurchaseId) {
      throw notFound('Este adicional requiere targetPurchaseId (la compra que extiende)', 'ADDON_TARGET_REQUIRED');
    }

    const { data: target, error: targetError } = await supabaseAdmin
      .from('package_purchases')
      .select('id, billing_account_id, status')
      .eq('id', targetPurchaseId)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target || target.billing_account_id !== billingAccountId) {
      throw notFound('La compra a extender no existe o no pertenece a esta cuenta', 'ADDON_TARGET_NOT_FOUND');
    }
    if (target.status !== 'active') {
      throw notFound('Solo se puede extender una compra activa', 'ADDON_TARGET_NOT_ACTIVE');
    }
  }

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
    validityDays: resolved.validityDays,
    isAddon,
    targetPurchaseId: isAddon ? targetPurchaseId : null
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

// Un adicional no es un grant independiente: suma UA y/o extiende
// expires_at de la compra destino, y la fila propia del adicional queda
// como 'consumed' (no 'active') -- registra que se cobró y qué efecto tuvo,
// pero no vence por sí sola ni se cuenta dos veces. Idempotente: si el
// adicional ya está 'consumed', una segunda entrega del webhook no vuelve a
// sumar UA ni a extender la vigencia de nuevo.
async function activateAddonPurchase(addonPurchase, targetPurchaseId, paymentIntentId) {
  if (addonPurchase.status === 'consumed') return mapPurchase(addonPurchase);

  const { data: target, error: targetError } = await supabaseAdmin
    .from('package_purchases')
    .select('*')
    .eq('id', targetPurchaseId)
    .maybeSingle();
  if (targetError) throw targetError;
  if (!target) return mapPurchase(addonPurchase);

  const { data: entitlementRows, error: entitlementsError } = await supabaseAdmin
    .from('offer_entitlements')
    .select('entitlement_key, limit_value')
    .eq('offer_id', addonPurchase.offer_id)
    .in('entitlement_key', ['analysis_units', 'package_validity_days']);
  if (entitlementsError) throw entitlementsError;

  const addonUa = (entitlementRows || []).find((row) => row.entitlement_key === 'analysis_units');
  const addonValidity = (entitlementRows || []).find((row) => row.entitlement_key === 'package_validity_days');

  const targetUpdate = {};
  if (addonUa) {
    targetUpdate.purchased_ua = Number(target.purchased_ua || 0) + Number(addonUa.limit_value);
  }
  if (addonValidity) {
    const base = target.expires_at ? new Date(target.expires_at) : new Date();
    targetUpdate.expires_at = new Date(base.getTime() + Number(addonValidity.limit_value) * 24 * 60 * 60 * 1000).toISOString();
  }

  if (Object.keys(targetUpdate).length > 0) {
    const { error: updateTargetError } = await supabaseAdmin
      .from('package_purchases')
      .update(targetUpdate)
      .eq('id', targetPurchaseId);
    if (updateTargetError) throw updateTargetError;
  }

  const { data: updatedAddon, error: updateAddonError } = await supabaseAdmin
    .from('package_purchases')
    .update({ status: 'consumed', stripe_payment_intent_id: paymentIntentId })
    .eq('id', addonPurchase.id)
    .select()
    .single();
  if (updateAddonError) throw updateAddonError;

  return mapPurchase(updatedAddon);
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

  const targetPurchaseId = paymentIntent?.metadata?.targetPurchaseId || null;
  if (targetPurchaseId) {
    return activateAddonPurchase(purchase, targetPurchaseId, paymentIntent.id);
  }

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

// Paso 5, Fase 4: "un paquete se vincula a un solo expediente" -- solo una
// compra activa, sin vínculo previo, y el expediente debe pertenecer al
// mismo usuario que compró el paquete.
export async function linkPurchaseToOrder({ purchaseId, orderId, userId }) {
  const { data: purchase, error } = await supabaseAdmin
    .from('package_purchases')
    .select('*')
    .eq('id', purchaseId)
    .maybeSingle();
  if (error) throw error;
  if (!purchase) throw notFound('Compra no encontrada', 'PURCHASE_NOT_FOUND');
  if (purchase.purchaser_user_id !== userId) {
    throw notFound('Acceso denegado a esta compra', 'PURCHASE_ACCESS_DENIED');
  }
  if (purchase.status !== 'active') {
    throw notFound('Solo una compra activa puede vincularse a un expediente', 'PURCHASE_NOT_ACTIVE');
  }
  if (purchase.order_id) {
    throw notFound('Esta compra ya está vinculada a un expediente', 'PURCHASE_ALREADY_LINKED');
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('service_orders')
    .select('id, user_id')
    .eq('id', orderId)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) throw notFound('Expediente no encontrado', 'ORDER_NOT_FOUND');
  if (order.user_id !== userId) throw notFound('Acceso denegado a este expediente', 'ORDER_ACCESS_DENIED');

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('package_purchases')
    .update({ order_id: orderId })
    .eq('id', purchaseId)
    .select()
    .single();
  if (updateError) throw updateError;

  return mapPurchase(updated);
}

// Paso 7, Fase 4: revierte los derechos de una compra pagada sin borrar el
// historial (sección 5.5 del plan: "no borrar compras... ni movimientos
// financieros") -- el estado pasa a 'refunded' y expires_at se corta a
// ahora; la fila queda como evidencia de qué se compró y cuándo se revirtió.
export async function loadRefundablePurchase(purchaseId) {
  const { data: purchase, error } = await supabaseAdmin
    .from('package_purchases')
    .select('*')
    .eq('id', purchaseId)
    .maybeSingle();
  if (error) throw error;
  if (!purchase) throw notFound('Compra no encontrada', 'PURCHASE_NOT_FOUND');
  if (purchase.status !== 'active') {
    throw notFound('Solo una compra activa puede reembolsarse', 'PURCHASE_NOT_REFUNDABLE');
  }
  if (!purchase.stripe_payment_intent_id) {
    throw notFound('La compra no tiene un cobro de Stripe asociado', 'PURCHASE_NO_PAYMENT_INTENT');
  }

  return mapPurchase(purchase);
}

export async function markPurchaseRefunded(purchaseId) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('package_purchases')
    .update({ status: 'refunded', expires_at: nowIso })
    .eq('id', purchaseId)
    .select()
    .single();
  if (error) throw error;

  return mapPurchase(data);
}
