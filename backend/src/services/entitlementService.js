import { supabaseAdmin } from '../config/supabase.js';
import { getBillingAccountForUser } from './billingAccountService.js';

const ACTIVE_SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due'];

function mapEntitlement(row, { allowed, remaining, source, reasonCode }) {
  return {
    key: row.entitlement_key,
    limit: row.limit_value === null ? null : Number(row.limit_value),
    remaining,
    unit: row.unit,
    resetPeriod: row.reset_period,
    allowed,
    source,
    reasonCode
  };
}

// Fase 2 del plan comercial ("Cuentas y entitlements", modo lectura): esta
// función resuelve qué derechos tiene una cuenta a partir de suscripciones y
// compras activas, sin bloquear ni debitar nada. Como usage_ledger todavía
// no existe (Fase 6), `remaining` es igual a `limit` -- no hay forma honesta
// de descontar consumo que el sistema todavía no registra. La reserva/débito
// real llega con usageLedgerService en Fase 6.
export async function resolveEntitlements(billingAccountId) {
  if (!billingAccountId) throw new Error('billingAccountId es requerido');

  const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
    .from('billing_subscriptions')
    .select('*')
    .eq('billing_account_id', billingAccountId)
    .in('status', ACTIVE_SUBSCRIPTION_STATUSES);
  if (subscriptionsError) throw subscriptionsError;

  const { data: purchases, error: purchasesError } = await supabaseAdmin
    .from('package_purchases')
    .select('*')
    .eq('billing_account_id', billingAccountId)
    .eq('status', 'active');
  if (purchasesError) throw purchasesError;

  const offerIds = [
    ...(subscriptions || []).map((s) => s.offer_id),
    ...(purchases || []).map((p) => p.offer_id)
  ];

  if (!offerIds.length) {
    return { entitlements: [] };
  }

  const { data: entitlementRows, error: entitlementsError } = await supabaseAdmin
    .from('offer_entitlements')
    .select('*')
    .in('offer_id', offerIds);
  if (entitlementsError) throw entitlementsError;

  const nowMs = Date.now();
  const entitlements = [];

  for (const subscription of subscriptions || []) {
    // Fase 5, paso 6: "suspender nuevas operaciones ante past_due". Se sigue
    // leyendo la suscripción (no se oculta -- "no borrar datos"), pero sus
    // entitlements quedan `allowed: false` mientras el pago no se resuelva.
    // assertSponsorshipCapacity (Fase 3) ya filtra por `allowed`, así que
    // esto basta para bloquear nuevas invitaciones sin tocar ese archivo.
    const isPastDue = subscription.status === 'past_due';
    const rows = (entitlementRows || []).filter((row) => row.offer_id === subscription.offer_id);
    for (const row of rows) {
      entitlements.push(
        mapEntitlement(row, {
          allowed: !isPastDue,
          remaining: isPastDue || row.limit_value === null ? null : Number(row.limit_value),
          source: { type: 'subscription', id: subscription.id, offerId: subscription.offer_id },
          reasonCode: isPastDue ? 'subscription_past_due' : 'active_subscription'
        })
      );
    }
  }

  for (const purchase of purchases || []) {
    const expired = Boolean(purchase.expires_at) && new Date(purchase.expires_at).getTime() < nowMs;
    const rows = (entitlementRows || []).filter((row) => row.offer_id === purchase.offer_id);
    for (const row of rows) {
      entitlements.push(
        mapEntitlement(row, {
          allowed: !expired,
          remaining: expired || row.limit_value === null ? null : Number(row.limit_value),
          source: { type: 'package_purchase', id: purchase.id, offerId: purchase.offer_id },
          reasonCode: expired ? 'package_expired' : 'active_package'
        })
      );
    }
  }

  return { entitlements };
}

export async function resolveEntitlementsForUser(userId) {
  const billingAccount = await getBillingAccountForUser(userId);
  if (!billingAccount) {
    return { billingAccount: null, entitlements: [] };
  }

  const { entitlements } = await resolveEntitlements(billingAccount.id);
  return { billingAccount, entitlements };
}
