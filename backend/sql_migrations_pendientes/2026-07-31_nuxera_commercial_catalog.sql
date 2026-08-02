-- NUXERA commercial catalog draft migration (Fase 1 del plan comercial)
-- Status: draft only. Do not apply to production until reviewed with Supabase RLS and pricing owners.
-- Read-only public catalog: offers, prices and their entitlement limits.
-- No billing_accounts, subscriptions, purchases, sponsorship or usage_ledger yet -- those are Fase 2+.

create table if not exists public.commercial_offers (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  audience          text not null check (audience in ('grantor', 'applicant')),
  billing_model     text not null check (billing_model in ('subscription', 'one_time', 'sow')),
  name_es           text not null,
  name_en           text not null,
  description_es    text null,
  description_en    text null,
  active            boolean not null default false,
  publicly_visible  boolean not null default false,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_commercial_offers_audience_active
  on public.commercial_offers (audience, active, publicly_visible);

create table if not exists public.commercial_prices (
  id                uuid primary key default gen_random_uuid(),
  offer_id          uuid not null references public.commercial_offers(id) on delete cascade,
  currency          text not null default 'USD',
  amount_cents      bigint null,
  is_custom_pricing boolean not null default false,
  billing_interval  text null check (billing_interval is null or billing_interval in ('month', 'year')),
  stripe_product_id text null,
  stripe_price_id   text null unique,
  effective_from    timestamptz not null default now(),
  effective_to      timestamptz null,
  active            boolean not null default true,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint commercial_prices_amount_or_custom check (
    is_custom_pricing = true or amount_cents is not null
  )
);

create index if not exists idx_commercial_prices_offer_active
  on public.commercial_prices (offer_id, currency, active)
  where effective_to is null;

create table if not exists public.offer_entitlements (
  id              uuid primary key default gen_random_uuid(),
  offer_id        uuid not null references public.commercial_offers(id) on delete cascade,
  entitlement_key text not null check (entitlement_key in (
    'internal_users', 'active_cases', 'analysis_units', 'package_validity_days',
    'projects', 'entities_per_project', 'storage_bytes', 'api_access', 'priority_support'
  )),
  limit_value     numeric null,
  unit            text null,
  reset_period    text not null default 'none' check (reset_period in ('none', 'billing_cycle')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (offer_id, entitlement_key)
);

create index if not exists idx_offer_entitlements_offer
  on public.offer_entitlements (offer_id);

alter table public.commercial_offers enable row level security;
alter table public.commercial_prices enable row level security;
alter table public.offer_entitlements enable row level security;

-- Public read policies: only active + publicly_visible offers, and only
-- prices/entitlements that belong to a publicly visible offer. Writes are
-- service-role only (backend uses supabaseAdmin), no insert/update/delete
-- policy is included here.
create policy commercial_offers_public_select
  on public.commercial_offers
  for select
  using (active = true and publicly_visible = true);

create policy commercial_prices_public_select
  on public.commercial_prices
  for select
  using (
    active = true
    and exists (
      select 1
      from public.commercial_offers o
      where o.id = commercial_prices.offer_id
        and o.active = true
        and o.publicly_visible = true
    )
  );

create policy offer_entitlements_public_select
  on public.offer_entitlements
  for select
  using (
    exists (
      select 1
      from public.commercial_offers o
      where o.id = offer_entitlements.offer_id
        and o.active = true
        and o.publicly_visible = true
    )
  );

-- Seeds: grantor subscription plans (section 2.1 of the commercial plan).
insert into public.commercial_offers (code, audience, billing_model, name_es, name_en, description_es, description_en, active, publicly_visible, sort_order)
values
  ('grantor_professional', 'grantor', 'subscription', 'Professional', 'Professional', 'Para otorgantes que inician su operación de expedientes patrocinados.', 'For grantors starting their sponsored-case operation.', true, true, 10),
  ('grantor_business', 'grantor', 'subscription', 'Business', 'Business', 'Para otorgantes con operación activa y equipo interno.', 'For grantors with active operations and an internal team.', true, true, 20),
  ('grantor_institutional', 'grantor', 'subscription', 'Institutional', 'Institutional', 'Contrato y configuración a medida para instituciones.', 'Custom contract and configuration for institutions.', true, true, 30),
  ('grantor_enterprise', 'grantor', 'sow', 'Enterprise', 'Enterprise', 'SOW y contrato de 24 a 36 meses.', 'SOW and 24-36 month contract.', true, true, 40)
on conflict (code) do nothing;

-- Seeds: applicant packages (section 2.2).
insert into public.commercial_offers (code, audience, billing_model, name_es, name_en, description_es, description_en, active, publicly_visible, sort_order)
values
  ('applicant_diagnostic', 'applicant', 'one_time', 'Diagnóstico NUXERA', 'NUXERA Diagnostic', 'Un objetivo, una entidad.', 'One objective, one entity.', true, true, 10),
  ('applicant_essential', 'applicant', 'one_time', 'Expediente Esencial', 'Essential Case File', 'Un objetivo, una entidad.', 'One objective, one entity.', true, true, 20),
  ('applicant_financing_ready', 'applicant', 'one_time', 'Financing Ready', 'Financing Ready', 'Un objetivo de financiamiento.', 'One financing objective.', true, true, 30),
  ('applicant_capital_ready', 'applicant', 'one_time', 'Capital Ready', 'Capital Ready', 'Un objetivo de capital.', 'One capital objective.', true, true, 40),
  ('applicant_managed', 'applicant', 'sow', 'Preparación administrada', 'Managed Preparation', 'Servicio profesional, definido por SOW.', 'Professional service, defined by SOW.', true, true, 50)
on conflict (code) do nothing;

-- Seeds: applicant add-ons (extra UA / extension days).
insert into public.commercial_offers (code, audience, billing_model, name_es, name_en, description_es, description_en, active, publicly_visible, sort_order)
values
  ('addon_ua_5', 'applicant', 'one_time', '5 UA adicionales', '5 additional AU', 'Adicional para Expediente Esencial.', 'Add-on for the Essential Case File.', true, true, 60),
  ('addon_ua_10', 'applicant', 'one_time', '10 UA adicionales', '10 additional AU', 'Adicional para Financing Ready.', 'Add-on for Financing Ready.', true, true, 61),
  ('addon_ua_20', 'applicant', 'one_time', '20 UA adicionales', '20 additional AU', 'Adicional para Capital Ready.', 'Add-on for Capital Ready.', true, true, 62),
  ('addon_extension_30_essential', 'applicant', 'one_time', 'Extensión de 30 días (Esencial)', '30-day extension (Essential)', 'Extiende la vigencia de Expediente Esencial.', 'Extends the validity of the Essential Case File.', true, true, 63),
  ('addon_extension_30_financing', 'applicant', 'one_time', 'Extensión de 30 días (Financing Ready)', '30-day extension (Financing Ready)', 'Extiende la vigencia de Financing Ready.', 'Extends the validity of Financing Ready.', true, true, 64),
  ('addon_extension_30_capital', 'applicant', 'one_time', 'Extensión de 30 días (Capital Ready)', '30-day extension (Capital Ready)', 'Extiende la vigencia de Capital Ready.', 'Extends the validity of Capital Ready.', true, true, 65)
on conflict (code) do nothing;

-- Prices in USD cents. Institutional/Enterprise/Managed use is_custom_pricing
-- with a floor amount in metadata instead of a fixed amount_cents.
insert into public.commercial_prices (offer_id, currency, amount_cents, is_custom_pricing, billing_interval, metadata)
select o.id, 'USD', v.amount_cents, v.is_custom, v.interval, v.metadata::jsonb
from public.commercial_offers o
join (values
  ('grantor_professional', 49500, false, 'month', '{}'),
  ('grantor_business', 175000, false, 'month', '{}'),
  ('grantor_institutional', 550000, true, 'month', '{"starting_at": true}'),
  ('grantor_enterprise', 1200000, true, null, '{"starting_at": true}'),
  ('applicant_diagnostic', 19500, false, null, '{}'),
  ('applicant_essential', 49500, false, null, '{}'),
  ('applicant_financing_ready', 125000, false, null, '{}'),
  ('applicant_capital_ready', 290000, false, null, '{}'),
  ('applicant_managed', 600000, true, null, '{"starting_at": true}'),
  ('addon_ua_5', 27500, false, null, '{}'),
  ('addon_ua_10', 45000, false, null, '{}'),
  ('addon_ua_20', 80000, false, null, '{}'),
  ('addon_extension_30_essential', 9900, false, null, '{}'),
  ('addon_extension_30_financing', 19500, false, null, '{}'),
  ('addon_extension_30_capital', 35000, false, null, '{}')
) as v(code, amount_cents, is_custom, interval, metadata)
  on v.code = o.code
where not exists (
  select 1 from public.commercial_prices p where p.offer_id = o.id and p.currency = 'USD'
);

-- Entitlements per offer (UA, seats, active cases, validity days).
insert into public.offer_entitlements (offer_id, entitlement_key, limit_value, unit, reset_period)
select o.id, v.entitlement_key, v.limit_value, v.unit, v.reset_period
from public.commercial_offers o
join (values
  ('grantor_professional', 'internal_users', 2, 'seats', 'none'),
  ('grantor_professional', 'active_cases', 20, 'cases', 'none'),
  ('grantor_professional', 'analysis_units', 12, 'ua', 'billing_cycle'),
  ('grantor_business', 'internal_users', 8, 'seats', 'none'),
  ('grantor_business', 'active_cases', 100, 'cases', 'none'),
  ('grantor_business', 'analysis_units', 65, 'ua', 'billing_cycle'),
  ('grantor_institutional', 'internal_users', 25, 'seats', 'none'),
  ('grantor_institutional', 'active_cases', 500, 'cases', 'none'),
  ('grantor_institutional', 'analysis_units', 260, 'ua', 'billing_cycle'),
  ('applicant_diagnostic', 'analysis_units', 3, 'ua', 'none'),
  ('applicant_diagnostic', 'package_validity_days', 15, 'days', 'none'),
  ('applicant_essential', 'analysis_units', 10, 'ua', 'none'),
  ('applicant_essential', 'package_validity_days', 45, 'days', 'none'),
  ('applicant_financing_ready', 'analysis_units', 25, 'ua', 'none'),
  ('applicant_financing_ready', 'package_validity_days', 90, 'days', 'none'),
  ('applicant_capital_ready', 'analysis_units', 50, 'ua', 'none'),
  ('applicant_capital_ready', 'package_validity_days', 120, 'days', 'none'),
  ('addon_ua_5', 'analysis_units', 5, 'ua', 'none'),
  ('addon_ua_10', 'analysis_units', 10, 'ua', 'none'),
  ('addon_ua_20', 'analysis_units', 20, 'ua', 'none'),
  ('addon_extension_30_essential', 'package_validity_days', 30, 'days', 'none'),
  ('addon_extension_30_financing', 'package_validity_days', 30, 'days', 'none'),
  ('addon_extension_30_capital', 'package_validity_days', 30, 'days', 'none')
) as v(code, entitlement_key, limit_value, unit, reset_period)
  on v.code = o.code
on conflict (offer_id, entitlement_key) do nothing;
