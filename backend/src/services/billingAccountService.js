import { supabaseAdmin } from '../config/supabase.js';

function mapAccount(row) {
  if (!row) return null;
  return {
    id: row.id,
    accountType: row.account_type,
    organizationName: row.organization_name,
    ownerUserId: row.owner_user_id,
    stripeCustomerId: row.stripe_customer_id || null,
    status: row.status,
    createdAt: row.created_at
  };
}

// Fase 2 del plan comercial: una cuenta por usuario, creada perezosamente.
// No hay migración masiva de usuarios existentes (sección 16 del plan: solo
// si se requiere para compatibilidad) ni flujo de creación de organización
// todavía -- eso es una decisión de producto explícita, no algo a inferir
// por dominio de correo (sección 12, Fase 2, paso 3).
export async function getBillingAccountForUser(userId) {
  if (!userId) throw new Error('userId es requerido');

  const { data: owned, error: ownedError } = await supabaseAdmin
    .from('billing_accounts')
    .select('*')
    .eq('owner_user_id', userId)
    .maybeSingle();
  if (ownedError) throw ownedError;
  if (owned) return mapAccount(owned);

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('billing_account_members')
    .select('billing_account_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) return null;

  const { data: account, error: accountError } = await supabaseAdmin
    .from('billing_accounts')
    .select('*')
    .eq('id', membership.billing_account_id)
    .maybeSingle();
  if (accountError) throw accountError;

  return mapAccount(account);
}

export async function getOrCreateIndividualAccount(userId) {
  const existing = await getBillingAccountForUser(userId);
  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from('billing_accounts')
    .insert({ account_type: 'individual', owner_user_id: userId, status: 'active' })
    .select('*')
    .single();
  if (error) throw error;

  return mapAccount(data);
}

// Fase 5, paso 1: persiste el Stripe Customer creado para esta cuenta la
// primera vez que se necesita (checkout de suscripción de otorgante). Se
// llama una sola vez por cuenta -- las llamadas siguientes a checkout
// reutilizan el customer ya guardado en vez de crear uno nuevo por Stripe.
export async function attachStripeCustomer(billingAccountId, stripeCustomerId) {
  const { data, error } = await supabaseAdmin
    .from('billing_accounts')
    .update({ stripe_customer_id: stripeCustomerId })
    .eq('id', billingAccountId)
    .select('*')
    .single();
  if (error) throw error;

  return mapAccount(data);
}

// Doble control obligatorio (sección 6.2 del plan): supabaseAdmin omite
// RLS, así que cada ruta que lea/escriba sobre una cuenta de facturación
// ajena debe llamar esto explícitamente antes de actuar.
export async function assertBillingAccountMember(userId, billingAccountId) {
  if (!userId || !billingAccountId) {
    throw new Error('userId y billingAccountId son requeridos');
  }

  const { data: account, error: accountError } = await supabaseAdmin
    .from('billing_accounts')
    .select('id, owner_user_id')
    .eq('id', billingAccountId)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account) {
    const err = new Error('Cuenta de facturación no encontrada');
    err.code = 'BILLING_ACCOUNT_NOT_FOUND';
    throw err;
  }
  if (account.owner_user_id === userId) return true;

  const { data: member, error: memberError } = await supabaseAdmin
    .from('billing_account_members')
    .select('id')
    .eq('billing_account_id', billingAccountId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (memberError) throw memberError;

  if (!member) {
    const err = new Error('Acceso denegado a la cuenta de facturación');
    err.code = 'BILLING_ACCOUNT_ACCESS_DENIED';
    throw err;
  }

  return true;
}
