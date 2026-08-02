-- NUXERA analysis-unit ledger (Fase 6). Apply in staging first.
create table if not exists public.analysis_unit_ledger (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references public.billing_accounts(id) on delete cascade,
  source_type text not null check (source_type in ('subscription', 'package_purchase', 'adjustment')),
  source_id uuid not null,
  order_id uuid null references public.service_orders(id),
  operation_key text not null,
  units numeric not null check (units <> 0),
  entry_type text not null check (entry_type in ('credit', 'debit', 'refund', 'adjustment')),
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null references public.users(id),
  created_at timestamptz not null default now(),
  unique (billing_account_id, operation_key)
);
create index if not exists idx_analysis_unit_ledger_account_created on public.analysis_unit_ledger (billing_account_id, created_at desc);
create index if not exists idx_analysis_unit_ledger_source on public.analysis_unit_ledger (source_type, source_id);
create index if not exists idx_analysis_unit_ledger_order on public.analysis_unit_ledger (order_id, created_at desc);
alter table public.analysis_unit_ledger enable row level security;
create policy analysis_unit_ledger_member_select on public.analysis_unit_ledger for select using (
  exists (select 1 from public.billing_accounts a where a.id = analysis_unit_ledger.billing_account_id and (
    a.owner_user_id = auth.uid() or exists (select 1 from public.billing_account_members m where m.billing_account_id = a.id and m.user_id = auth.uid() and m.status = 'active')
  ))
);
-- No client INSERT/UPDATE/DELETE policies. Writes are service-role only.
