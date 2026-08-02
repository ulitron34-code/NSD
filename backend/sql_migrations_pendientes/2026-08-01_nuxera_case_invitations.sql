-- NUXERA case invitations + sponsorship draft migration (Fase 3 del plan
-- comercial: "Invitaciones patrocinadas").
-- Status: draft only. Do not apply to production until reviewed with
-- Supabase RLS and pricing owners.
--
-- Regla central (sección 2.3 del plan): un solicitante invitado por un
-- otorgante no paga por ingresar, cargar documentos ni atender el
-- expediente patrocinado. El otorgante absorbe el expediente activo, las UA
-- utilizadas y los consumos externos autorizados. Estas dos tablas son el
-- registro de esa relación.
--
-- Como el backend usa exclusivamente supabaseAdmin (service-role, ignora
-- RLS), estas policies son defensa en profundidad -- igual que en
-- 2026-08-01_nuxera_billing_accounts.sql. Doble control obligatorio
-- (sección 6.2): caseInvitationService.js/caseSponsorshipService.js deben
-- autorizar explícitamente en cada operación, una policy correcta no
-- reemplaza eso.

create table if not exists public.case_invitations (
  id                      uuid primary key default gen_random_uuid(),
  sponsor_billing_account_id uuid not null references public.billing_accounts(id),
  sponsor_user_id         uuid not null references public.users(id),
  order_id                uuid null references public.service_orders(id),
  recipient_email         text not null,
  token_hash              text not null unique,
  expires_at              timestamptz not null,
  accepted_at             timestamptz null,
  revoked_at              timestamptz null,
  accepted_by_user_id     uuid null references public.users(id),
  status                  text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  created_at              timestamptz not null default now()
);

create index if not exists idx_case_invitations_sponsor
  on public.case_invitations (sponsor_billing_account_id, status);

create index if not exists idx_case_invitations_recipient
  on public.case_invitations (lower(recipient_email), status);

-- token_hash ya es unique (y por lo tanto indexado); no se repite el índice.

create table if not exists public.case_sponsorships (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null unique references public.service_orders(id),
  sponsor_billing_account_id uuid not null references public.billing_accounts(id),
  applicant_user_id       uuid not null references public.users(id),
  source_invitation_id    uuid null references public.case_invitations(id),
  status                  text not null default 'active' check (status in ('active', 'closed', 'revoked')),
  started_at              timestamptz not null default now(),
  ended_at                timestamptz null
);

create index if not exists idx_case_sponsorships_sponsor
  on public.case_sponsorships (sponsor_billing_account_id, status);

create index if not exists idx_case_sponsorships_applicant
  on public.case_sponsorships (applicant_user_id, status);

alter table public.case_invitations enable row level security;
alter table public.case_sponsorships enable row level security;

-- El otorgante (dueño/miembro activo de la cuenta patrocinadora) puede leer
-- las invitaciones que envió.
create policy case_invitations_sponsor_select
  on public.case_invitations
  for select
  using (
    exists (
      select 1 from public.billing_accounts a
      where a.id = case_invitations.sponsor_billing_account_id
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

-- El destinatario puede leer su propia invitación (por correo, antes de
-- aceptar) o la que ya aceptó (por accepted_by_user_id). Nunca revela
-- invitaciones de otros destinatarios.
create policy case_invitations_recipient_select
  on public.case_invitations
  for select
  using (
    accepted_by_user_id = auth.uid()
    or lower(recipient_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy case_sponsorships_applicant_select
  on public.case_sponsorships
  for select
  using (applicant_user_id = auth.uid());

create policy case_sponsorships_sponsor_select
  on public.case_sponsorships
  for select
  using (
    exists (
      select 1 from public.billing_accounts a
      where a.id = case_sponsorships.sponsor_billing_account_id
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

-- No hay policies de insert/update/delete: la emisión, aceptación y
-- revocación de invitaciones, y la creación/cierre de patrocinios, son
-- exclusivas de supabaseAdmin (service role) a través de
-- caseInvitationService.js / caseSponsorshipService.js.
