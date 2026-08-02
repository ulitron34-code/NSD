-- NUXERA billing accounts draft migration (Fase 2 del plan comercial:
-- "Cuentas y entitlements", modo lectura, sin cobrar).
-- Status: draft only. Do not apply to production until reviewed with
-- Supabase RLS and pricing owners.
--
-- Alcance: billing_accounts, billing_account_members, billing_subscriptions,
-- package_purchases (sección 5.2 del plan). No incluye case_invitations,
-- case_sponsorships ni usage_ledger -- esas son Fase 3+ y Fase 6.
--
-- Como el backend usa exclusivamente supabaseAdmin (service-role, ignora
-- RLS), estas policies son defensa en profundidad -- igual que en
-- 2026-07-10_core_tables_rls.sql. cada ruta backend debe seguir
-- autorizando explícitamente (assertBillingAccountMember en
-- billingAccountService.js), una policy correcta no reemplaza eso
-- (sección 6.2 del plan).

create table if not exists public.billing_accounts (
  id                uuid primary key default gen_random_uuid(),
  account_type      text not null check (account_type in ('organization', 'individual')),
  organization_name text null,
  owner_user_id     uuid not null references public.users(id),
  stripe_customer_id text unique null,
  status            text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_billing_accounts_owner
  on public.billing_accounts (owner_user_id);

create table if not exists public.billing_account_members (
  id                 uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references public.billing_accounts(id) on delete cascade,
  user_id            uuid not null references public.users(id),
  member_role        text not null check (member_role in ('owner', 'billing_admin', 'member')),
  status             text not null default 'active' check (status in ('active', 'removed')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (billing_account_id, user_id)
);

create index if not exists idx_billing_account_members_user
  on public.billing_account_members (user_id, status);

-- Fase 2 crea estas dos tablas para que entitlementService.js tenga un
-- destino de lectura estable, pero nada las escribe todavía: la emisión de
-- suscripciones/compras reales llega en Fase 4 (paquetes) y Fase 5
-- (suscripciones del otorgante), vía Stripe.
create table if not exists public.billing_subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  billing_account_id    uuid not null references public.billing_accounts(id) on delete cascade,
  offer_id              uuid not null references public.commercial_offers(id),
  commercial_price_id   uuid not null references public.commercial_prices(id),
  stripe_subscription_id text unique null,
  status                text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_start  timestamptz null,
  current_period_end    timestamptz null,
  cancel_at_period_end  boolean not null default false,
  quantity              integer not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_billing_subscriptions_account_status
  on public.billing_subscriptions (billing_account_id, status);

create unique index if not exists idx_billing_subscriptions_one_active_per_offer
  on public.billing_subscriptions (billing_account_id, offer_id)
  where status in ('trialing', 'active', 'past_due');

create table if not exists public.package_purchases (
  id                    uuid primary key default gen_random_uuid(),
  billing_account_id    uuid not null references public.billing_accounts(id) on delete cascade,
  purchaser_user_id     uuid not null references public.users(id),
  offer_id              uuid not null references public.commercial_offers(id),
  commercial_price_id   uuid not null references public.commercial_prices(id),
  order_id              uuid null references public.service_orders(id),
  stripe_payment_intent_id text unique null,
  status                text not null check (status in ('pending', 'active', 'expired', 'consumed', 'refunded', 'canceled')),
  starts_at             timestamptz null,
  expires_at            timestamptz null,
  purchased_ua          numeric null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_package_purchases_account_status
  on public.package_purchases (billing_account_id, status);

create index if not exists idx_package_purchases_order
  on public.package_purchases (order_id);

alter table public.billing_accounts enable row level security;
alter table public.billing_account_members enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.package_purchases enable row level security;

-- El dueño de la cuenta y sus miembros activos pueden leer la cuenta.
create policy billing_accounts_member_select
  on public.billing_accounts
  for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.billing_account_members m
      where m.billing_account_id = billing_accounts.id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- Un miembro solo ve la fila de membresía propia -- no la lista completa de
-- miembros de la cuenta (eso queda para un endpoint admin auditado, no RLS).
create policy billing_account_members_self_select
  on public.billing_account_members
  for select
  using (user_id = auth.uid());

create policy billing_subscriptions_member_select
  on public.billing_subscriptions
  for select
  using (
    exists (
      select 1 from public.billing_accounts a
      where a.id = billing_subscriptions.billing_account_id
        and (
          a.owner_user_id = auth.uid()
          or exists (
            select 1 from public.billing_account_members m
            where m.billing_account_id = a.id
              and m.user_id = auth.uid()
              and m.status = 'active'
          )
        )
    )
  );

create policy package_purchases_member_select
  on public.package_purchases
  for select
  using (
    purchaser_user_id = auth.uid()
    or exists (
      select 1 from public.billing_accounts a
      where a.id = package_purchases.billing_account_id
        and (
          a.owner_user_id = auth.uid()
          or exists (
            select 1 from public.billing_account_members m
            where m.billing_account_id = a.id
              and m.user_id = auth.uid()
              and m.status = 'active'
          )
        )
    )
  );

-- No hay policies de insert/update/delete: escritura es exclusiva de
-- supabaseAdmin (service role), igual que commercial_offers/prices.
