-- Officer CSV export audit, and a unique DuesKo reference on each payment.
-- No resident consent table. Acknowledgments are per recorded or approved payment.

alter table public.payments
  add column if not exists duesko_reference text;

update public.payments
set duesko_reference = 'DK-' || upper(replace(id::text, '-', ''))
where duesko_reference is null;

create unique index payments_duesko_reference_uidx
  on public.payments (duesko_reference)
  where duesko_reference is not null;

comment on column public.payments.duesko_reference is
  'DuesKo-issued payment reference shown on the acknowledgment. Not an official receipt number.';

create table public.export_audit_log (
  id uuid primary key default gen_random_uuid(),
  hoa_id uuid not null references public.hoas (id),
  exported_by uuid not null references public.users (id),
  kind text not null,
  month text,
  status text,
  created_at timestamptz not null default now(),
  constraint export_audit_kind check (kind in ('units', 'charges', 'payments')),
  constraint export_audit_month check (month is null or month ~ '^[0-9]{4}-[0-9]{2}$')
);

comment on table public.export_audit_log is
  'One row each time an officer downloads a units, charges, or payments CSV.';

create index export_audit_log_hoa_created_idx
  on public.export_audit_log (hoa_id, created_at desc);

alter table public.export_audit_log enable row level security;

create policy export_audit_log_select on public.export_audit_log
  for select to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy export_audit_log_insert on public.export_audit_log
  for insert to authenticated
  with check (
    public.is_admin_treasurer()
    and hoa_id = public.current_hoa_id()
    and exported_by = auth.uid()
  );

revoke all on table public.export_audit_log from anon;
grant select, insert on table public.export_audit_log to authenticated;
