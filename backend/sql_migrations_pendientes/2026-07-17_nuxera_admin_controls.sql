-- NUXERA admin controls draft migration
-- Status: draft only. Do not apply to production until reviewed with Supabase RLS and role policy owners.

create table if not exists public.nuxera_admin_controls (
  id uuid primary key default gen_random_uuid(),
  control_type text not null check (control_type in ('release_gate','incident','readiness','policy')),
  scope text not null check (scope in ('global','applicant','grantor','admin','engine')),
  status text not null,
  severity text null check (severity in ('low','medium','high','critical')),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id),
  updated_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null
);

create index if not exists idx_nuxera_admin_controls_active_type
  on public.nuxera_admin_controls (control_type, status)
  where archived_at is null;

create index if not exists idx_nuxera_admin_controls_active_scope
  on public.nuxera_admin_controls (scope, severity)
  where archived_at is null;

alter table public.nuxera_admin_controls enable row level security;

-- Read policy draft only. Administrators can inspect active controls.
-- No insert/update/delete policies are included in NU-ADM-CTRL-001.
create policy nuxera_admin_controls_admin_select
  on public.nuxera_admin_controls
  for select
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.profile_type = 'administrador'
    )
  );