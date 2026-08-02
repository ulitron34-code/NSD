import { supabaseAdmin } from '../config/supabase.js';

function notFound(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function mapSubscription(row) {
  if (!row) return null;
  return {
    id: row.id,
    billingAccountId: row.billing_account_id,
    offerId: row.offer_id,
    commercialPriceId: row.commercial_price_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    quantity: row.quantity,
    createdAt: row.created_at
  };
}

// Resuelve el plan de otorgante y su Stripe Price ID directo del catálogo
// -- igual que packagePurchaseService.resolveApplicantOfferForPurchase,
// nunca un precio que llegue del cliente (sección 7.2 del plan). Institutional
// y Enterprise usan is_custom_pricing (contrato/SOW, sección 2.1) y quedan
// fuera del autoservicio. Un precio sin stripe_price_id configurado es un
// estado operativo real -- el catálogo puede tener el plan activo antes de
// que alguien haya creado el Price correspondiente en Stripe.
export async function resolveGrantorOfferForCheckout(offerCode, currency = 'USD') {
  const { data: offer, error: offerError } = await supabaseAdmin
    .from('commercial_offers')
    .select('id, code, audience, active')
    .eq('code', offerCode)
    .eq('active', true)
    .maybeSingle();
  if (offerError) throw offerError;
  if (!offer) throw notFound(`Oferta "${offerCode}" no encontrada o inactiva`, 'OFFER_NOT_FOUND');
  if (offer.audience !== 'grantor') {
    throw notFound('Esta oferta no es un plan de otorgante', 'OFFER_WRONG_AUDIENCE');
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
    throw notFound('Este plan requiere una propuesta comercial (contrato), no autoservicio', 'CUSTOM_PRICING_REQUIRES_SOW');
  }
  if (!price.stripe_price_id) {
    throw notFound(`El precio de "${offerCode}" todavía no tiene un Stripe Price ID configurado`, 'STRIPE_PRICE_NOT_CONFIGURED');
  }

  return {
    offerId: offer.id,
    priceId: price.id,
    stripePriceId: price.stripe_price_id,
    amountCents: Number(price.amount_cents),
    currency: price.currency,
    billingInterval: price.billing_interval
  };
}

// Idempotente por stripe_subscription_id (sección 9.2: "rechazar eventos
// duplicados"): tanto `customer.subscription.created` como `.updated` pasan
// por acá y se resuelven con un upsert -- la base termina reflejando el
// último estado que Stripe reportó, sin depender de en qué orden lleguen
// los eventos (sección 12, Fase 5, criterio de salida: "la base refleja
// Stripe y puede reconstruirse desde eventos"). Ignora silenciosamente
// suscripciones que no sean nuestras (sin billingAccountId/offerId en
// metadata) -- no todo lo que llega a este webhook es necesariamente un
// plan de otorgante NUXERA.
export async function upsertSubscriptionFromStripeEvent(subscription) {
  const billingAccountId = subscription?.metadata?.billingAccountId;
  const offerId = subscription?.metadata?.offerId;
  if (!billingAccountId || !offerId) return null;

  const stripePriceId = subscription.items?.data?.[0]?.price?.id || null;
  let commercialPriceId = null;
  if (stripePriceId) {
    const { data: priceRow, error: priceError } = await supabaseAdmin
      .from('commercial_prices')
      .select('id')
      .eq('stripe_price_id', stripePriceId)
      .maybeSingle();
    if (priceError) throw priceError;
    commercialPriceId = priceRow?.id || null;
  }

  const payload = {
    billing_account_id: billingAccountId,
    offer_id: offerId,
    commercial_price_id: commercialPriceId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_start: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    quantity: subscription.items?.data?.[0]?.quantity || 1
  };

  const { data, error } = await supabaseAdmin
    .from('billing_subscriptions')
    .upsert(payload, { onConflict: 'stripe_subscription_id' })
    .select()
    .single();
  if (error) throw error;

  return mapSubscription(data);
}

// `customer.subscription.deleted`: estado, no borrado (sección 17.2 del
// plan: "todas las migraciones son aditivas... revertir mediante flags y
// estados"). La fila queda como evidencia de que existió la suscripción.
export async function markSubscriptionCanceled(subscription) {
  const { data, error } = await supabaseAdmin
    .from('billing_subscriptions')
    .update({ status: 'canceled', cancel_at_period_end: false })
    .eq('stripe_subscription_id', subscription.id)
    .select()
    .maybeSingle();
  if (error) throw error;

  return mapSubscription(data);
}

// `invoice.paid`: refresca el ciclo vigente por si llega antes o en vez de
// `customer.subscription.updated` -- best-effort, no falla si la invoice no
// trae información de periodo o no corresponde a ninguna suscripción
// nuestra.
export async function syncSubscriptionPeriodFromInvoice(invoice) {
  const subscriptionId = invoice?.subscription;
  if (!subscriptionId) return null;

  const period = invoice.lines?.data?.[0]?.period;
  if (!period?.start || !period?.end) return null;

  const { data, error } = await supabaseAdmin
    .from('billing_subscriptions')
    .update({
      current_period_start: new Date(period.start * 1000).toISOString(),
      current_period_end: new Date(period.end * 1000).toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)
    .select()
    .maybeSingle();
  if (error) throw error;

  return mapSubscription(data);
}
