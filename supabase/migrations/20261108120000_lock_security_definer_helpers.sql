-- Move the RLS helpers out of the Data API schema.
-- The Next.js app never calls them over RPC. Policies and the
-- security-invoker who_has_paid view still run as `authenticated`,
-- so that role keeps EXECUTE. anon, public, and service_role do not.
-- Each function only returns the caller's own membership.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

comment on schema private is
  'RLS helpers. Not exposed through the Data API. EXECUTE is limited to authenticated so policies can run.';

create or replace function private.current_hoa_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select users.hoa_id
  from public.users
  where users.id = (select auth.uid())
    and (select auth.uid()) is not null
$$;

create or replace function private.current_unit_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select users.unit_id
  from public.users
  where users.id = (select auth.uid())
    and (select auth.uid()) is not null
$$;

create or replace function private.is_admin_treasurer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where users.id = (select auth.uid())
      and (select auth.uid()) is not null
      and users.role = 'admin_treasurer'
  )
$$;

create or replace function private.can_read_unit(target_hoa_id uuid, target_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(private.current_hoa_id() = target_hoa_id, false)
    and (
      private.is_admin_treasurer()
      or coalesce(private.current_unit_id() = target_unit_id, false)
    )
$$;

revoke all on function private.current_hoa_id() from public, anon, authenticated;
revoke all on function private.current_unit_id() from public, anon, authenticated;
revoke all on function private.is_admin_treasurer() from public, anon, authenticated;
revoke all on function private.can_read_unit(uuid, uuid) from public, anon, authenticated;

grant execute on function private.current_hoa_id() to authenticated;
grant execute on function private.current_unit_id() to authenticated;
grant execute on function private.is_admin_treasurer() to authenticated;
grant execute on function private.can_read_unit(uuid, uuid) to authenticated;

do $lock$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke all on function private.current_hoa_id() from service_role';
    execute 'revoke all on function private.current_unit_id() from service_role';
    execute 'revoke all on function private.is_admin_treasurer() from service_role';
    execute 'revoke all on function private.can_read_unit(uuid, uuid) from service_role';
  end if;
end
$lock$;

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
where private.is_admin_treasurer()
  and payments.status = 'approved';

alter policy hoas_select on public.hoas
  using (id = private.current_hoa_id());

alter policy hoas_update on public.hoas
  using (private.is_admin_treasurer() and id = private.current_hoa_id())
  with check (private.is_admin_treasurer() and id = private.current_hoa_id());

alter policy units_select on public.units
  using (private.can_read_unit(hoa_id, id));

alter policy units_insert on public.units
  with check (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy units_update on public.units
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id())
  with check (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy units_delete on public.units
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy users_select on public.users
  using (
    hoa_id = private.current_hoa_id()
    and (private.is_admin_treasurer() or id = (select auth.uid()))
  );

alter policy users_insert on public.users
  with check (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy users_update on public.users
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id())
  with check (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy users_delete on public.users
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy charges_select on public.charges
  using (private.can_read_unit(hoa_id, unit_id));

alter policy charges_insert on public.charges
  with check (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy charges_update on public.charges
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id())
  with check (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy charges_delete on public.charges
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy payments_select on public.payments
  using (private.can_read_unit(hoa_id, unit_id));

alter policy payments_insert on public.payments
  with check (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy payments_update on public.payments
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id())
  with check (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy payments_delete on public.payments
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy payments_resident_insert on public.payments
  with check (
    status = 'pending'
    and proof_path is not null
    and reviewed_by is null
    and reviewed_at is null
    and rejection_reason is null
    and hoa_id = private.current_hoa_id()
    and unit_id = private.current_unit_id()
    and unit_id is not null
    and exists (
      select 1
      from public.charges
      where charges.id = payments.charge_id
        and charges.hoa_id = payments.hoa_id
        and charges.unit_id = payments.unit_id
        and charges.unit_id = private.current_unit_id()
    )
  );

alter policy payment_links_select on public.payment_links
  using (private.can_read_unit(hoa_id, unit_id));

alter policy payment_links_insert on public.payment_links
  with check (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy payment_links_update on public.payment_links
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id())
  with check (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy payment_links_delete on public.payment_links
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy export_audit_log_select on public.export_audit_log
  using (private.is_admin_treasurer() and hoa_id = private.current_hoa_id());

alter policy export_audit_log_insert on public.export_audit_log
  with check (
    private.is_admin_treasurer()
    and hoa_id = private.current_hoa_id()
    and exported_by = (select auth.uid())
  );

alter policy waitlist_signups_officer_select on public.waitlist_signups
  using (private.is_admin_treasurer());

alter policy payment_proofs_resident_insert on storage.objects
  with check (
    bucket_id = 'payment-proofs'
    and private.current_unit_id() is not null
    and split_part(name, '/', 1) = private.current_hoa_id()::text
    and exists (
      select 1
      from public.charges
      where charges.id::text = split_part(name, '/', 2)
        and charges.hoa_id = private.current_hoa_id()
        and charges.unit_id = private.current_unit_id()
    )
  );

alter policy payment_proofs_read on storage.objects
  using (
    bucket_id = 'payment-proofs'
    and split_part(name, '/', 1) = private.current_hoa_id()::text
    and exists (
      select 1
      from public.charges
      where charges.id::text = split_part(name, '/', 2)
        and charges.hoa_id = private.current_hoa_id()
        and (
          private.is_admin_treasurer()
          or charges.unit_id = private.current_unit_id()
        )
    )
  );

drop function public.can_read_unit(uuid, uuid);
drop function public.current_hoa_id();
drop function public.current_unit_id();
drop function public.is_admin_treasurer();
