-- Proof-of-payment and manual recording. No online checkout.
-- payment_links stays unused. Do not store PayMongo ids.

alter table public.payments drop constraint payments_method;

alter table public.payments add constraint payments_method
  check (method in ('cash', 'gcash', 'bank_transfer', 'other'));

comment on column public.payments.method is
  'cash, gcash, bank_transfer, or other. There is no online checkout.';

alter table public.payments
  add column status text,
  add column reference_no text,
  add column proof_path text,
  add column rejection_reason text,
  add column reviewed_by uuid references public.users (id),
  add column reviewed_at timestamptz,
  add column note text;

update public.payments
set status = 'approved'
where status is null;

update public.payments
set reviewed_by = recorded_by,
    reviewed_at = paid_at
where status = 'approved'
  and reviewed_by is null
  and recorded_by is not null;

alter table public.payments alter column status set not null;

alter table public.payments add constraint payments_status
  check (status in ('pending', 'approved', 'rejected'));

alter table public.payments add constraint payments_pending_unreviewed
  check (
    status <> 'pending'
    or (reviewed_by is null and reviewed_at is null and rejection_reason is null)
  );

alter table public.payments add constraint payments_rejected_has_reason
  check (
    status <> 'rejected'
    or (
      rejection_reason is not null
      and length(btrim(rejection_reason)) > 0
      and reviewed_by is not null
      and reviewed_at is not null
    )
  );

alter table public.payments add constraint payments_approved_is_reviewed
  check (
    status <> 'approved'
    or (reviewed_by is not null and reviewed_at is not null)
  );

comment on column public.payments.status is
  'pending waits for an officer. approved counts toward the charge. rejected keeps the charge unpaid.';
comment on column public.payments.reference_no is
  'The payer reference, such as a GCash or bank reference.';
comment on column public.payments.proof_path is
  'Private storage path: {hoa_id}/{charge_id}/{uuid}.ext in the payment-proofs bucket.';
comment on column public.payments.reviewed_by is
  'Officer who approved or rejected the payment.';
comment on column public.payments.reviewed_at is
  'When the officer approved or rejected the payment.';

create index payments_hoa_status_idx on public.payments (hoa_id, status);

-- A resident may submit a pending proof for their own charge.
-- Officers keep the existing insert and update policies.
create policy payments_resident_insert on public.payments
  for insert to authenticated
  with check (
    status = 'pending'
    and proof_path is not null
    and reviewed_by is null
    and reviewed_at is null
    and rejection_reason is null
    and hoa_id = public.current_hoa_id()
    and unit_id = public.current_unit_id()
    and unit_id is not null
    and exists (
      select 1
      from public.charges
      where charges.id = payments.charge_id
        and charges.hoa_id = payments.hoa_id
        and charges.unit_id = payments.unit_id
        and charges.unit_id = public.current_unit_id()
    )
  );

create or replace view public.who_has_paid
with (security_invoker = true) as
select
  payments.id,
  payments.hoa_id,
  payments.unit_id,
  units.label as unit_label,
  charges.kind,
  charges.description as charge_description,
  payments.method,
  payments.amount_centavos,
  payments.paid_at,
  payments.hoa_reference_no,
  payments.recorded_by
from public.payments
join public.units on units.id = payments.unit_id
join public.charges on charges.id = payments.charge_id
where public.is_admin_treasurer()
  and payments.status = 'approved';

grant select on table public.who_has_paid to authenticated;

-- Private bucket. Hosted Supabase already owns storage.objects and storage.buckets:
-- RLS is enabled there, and authenticated already has the table grants.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy payment_proofs_bucket_read on storage.buckets
  for select to authenticated
  using (id = 'payment-proofs');

create policy payment_proofs_resident_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and public.current_unit_id() is not null
    and split_part(name, '/', 1) = public.current_hoa_id()::text
    and exists (
      select 1
      from public.charges
      where charges.id::text = split_part(name, '/', 2)
        and charges.hoa_id = public.current_hoa_id()
        and charges.unit_id = public.current_unit_id()
    )
  );

create policy payment_proofs_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and split_part(name, '/', 1) = public.current_hoa_id()::text
    and exists (
      select 1
      from public.charges
      where charges.id::text = split_part(name, '/', 2)
        and charges.hoa_id = public.current_hoa_id()
        and (
          public.is_admin_treasurer()
          or charges.unit_id = public.current_unit_id()
        )
    )
  );
