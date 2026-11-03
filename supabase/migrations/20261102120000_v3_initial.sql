-- DuesKo v3 schema.
-- Money is integer centavos (₱1.00 = 100). Do not store pesos as a float.
--
-- users.id is auth.users.id once Supabase Auth is connected.
-- The Day 1 app uses a DEV ONLY cookie and does not write these tables.
--
-- Read rules:
--   a resident selects only rows for their own unit
--   an admin_treasurer selects every unit in their HOA, including who has paid
-- Write rules:
--   residents have no insert, update, or delete policies
--   an admin_treasurer writes rows in their own HOA
-- The service role bypasses RLS. Keep that key on the server.

create table public.hoas (
  id uuid primary key default gen_random_uuid(),
  registered_name text not null,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  hoa_id uuid not null references public.hoas (id) on delete cascade,
  label text not null,
  area_sqm numeric(10, 2),
  rate_type text not null,
  rate_centavos integer not null,
  created_at timestamptz not null default now(),
  constraint units_rate_type check (rate_type in ('flat', 'per_sqm')),
  constraint units_rate_nonnegative check (rate_centavos >= 0),
  constraint units_per_sqm_has_area check (
    rate_type <> 'per_sqm' or area_sqm is not null
  ),
  constraint units_label_unique unique (hoa_id, label),
  constraint units_id_hoa unique (id, hoa_id)
);

comment on column public.units.rate_centavos is
  'Flat: centavos per month. Per sqm: centavos per square metre.';

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  hoa_id uuid not null references public.hoas (id) on delete cascade,
  unit_id uuid,
  email text not null,
  full_name text not null,
  role text not null,
  created_at timestamptz not null default now(),
  constraint users_role check (role in ('admin_treasurer', 'resident')),
  constraint users_resident_has_unit check (
    role <> 'resident' or unit_id is not null
  ),
  constraint users_email_unique unique (hoa_id, email),
  constraint users_unit_same_hoa foreign key (unit_id, hoa_id)
    references public.units (id, hoa_id)
);

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  hoa_id uuid not null,
  unit_id uuid not null,
  kind text not null,
  description text not null,
  period text,
  amount_centavos integer not null,
  due_date date not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint charges_kind check (kind in ('dues', 'special')),
  constraint charges_amount_nonnegative check (amount_centavos >= 0),
  constraint charges_status check (status in ('unpaid', 'paid')),
  constraint charges_unit_same_hoa foreign key (unit_id, hoa_id)
    references public.units (id, hoa_id) on delete cascade,
  constraint charges_id_unit_hoa unique (id, unit_id, hoa_id)
);

comment on column public.charges.kind is
  'dues is the recurring charge. special is a one-off special assessment.';
comment on column public.charges.amount_centavos is
  'Charge amount in integer centavos.';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  hoa_id uuid not null,
  charge_id uuid not null,
  unit_id uuid not null,
  method text not null,
  amount_centavos integer not null,
  paid_at timestamptz not null,
  provider_payment_id text,
  hoa_reference_no text,
  recorded_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  constraint payments_method check (method in ('paymongo', 'cash')),
  constraint payments_amount_positive check (amount_centavos > 0),
  constraint payments_provider_unique unique (provider_payment_id),
  constraint payments_cash_has_no_provider check (
    method <> 'cash' or provider_payment_id is null
  ),
  constraint payments_cash_is_recorded check (
    method <> 'cash' or recorded_by is not null
  ),
  constraint payments_match_charge foreign key (charge_id, unit_id, hoa_id)
    references public.charges (id, unit_id, hoa_id)
);

comment on column public.payments.amount_centavos is
  'Payment amount in integer centavos.';
comment on column public.payments.hoa_reference_no is
  'Optional. The HOA''s own reference for a manual cash payment.';
comment on column public.payments.method is
  'cash is a manual payment recorded by an officer. paymongo is a checkout payment.';

create table public.payment_links (
  id uuid primary key default gen_random_uuid(),
  hoa_id uuid not null,
  charge_id uuid not null,
  unit_id uuid not null,
  token text not null,
  created_at timestamptz not null default now(),
  constraint payment_links_token_unique unique (token),
  constraint payment_links_match_charge foreign key (charge_id, unit_id, hoa_id)
    references public.charges (id, unit_id, hoa_id) on delete cascade
);

create index units_hoa_id_idx on public.units (hoa_id);
create index users_hoa_id_idx on public.users (hoa_id);
create index users_unit_id_idx on public.users (unit_id);
create index charges_unit_id_idx on public.charges (unit_id);
create index charges_hoa_status_idx on public.charges (hoa_id, status);
create index payments_unit_id_idx on public.payments (unit_id);
create index payments_charge_id_idx on public.payments (charge_id);
create index payment_links_charge_id_idx on public.payment_links (charge_id);

-- Security definer helpers read public.users as the table owner so policies
-- on public.users do not recurse. The table owner bypasses RLS; do not
-- FORCE ROW LEVEL SECURITY on these tables or the helpers stop working.

create or replace function public.current_hoa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hoa_id from public.users where id = auth.uid()
$$;

create or replace function public.current_unit_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select unit_id from public.users where id = auth.uid()
$$;

create or replace function public.is_admin_treasurer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin_treasurer'
  )
$$;

create or replace function public.can_read_unit(target_hoa_id uuid, target_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_hoa_id is not null
    and target_hoa_id = public.current_hoa_id()
    and (
      public.is_admin_treasurer()
      or (
        target_unit_id is not null
        and target_unit_id = public.current_unit_id()
      )
    )
$$;

revoke all on function public.current_hoa_id() from public, anon;
revoke all on function public.current_unit_id() from public, anon;
revoke all on function public.is_admin_treasurer() from public, anon;
revoke all on function public.can_read_unit(uuid, uuid) from public, anon;

grant execute on function public.current_hoa_id() to authenticated;
grant execute on function public.current_unit_id() to authenticated;
grant execute on function public.is_admin_treasurer() to authenticated;
grant execute on function public.can_read_unit(uuid, uuid) to authenticated;

alter table public.hoas enable row level security;
alter table public.units enable row level security;
alter table public.users enable row level security;
alter table public.charges enable row level security;
alter table public.payments enable row level security;
alter table public.payment_links enable row level security;

create policy hoas_select on public.hoas
  for select to authenticated
  using (id = public.current_hoa_id());

create policy hoas_update on public.hoas
  for update to authenticated
  using (public.is_admin_treasurer() and id = public.current_hoa_id())
  with check (public.is_admin_treasurer() and id = public.current_hoa_id());

create policy units_select on public.units
  for select to authenticated
  using (public.can_read_unit(hoa_id, id));

create policy units_insert on public.units
  for insert to authenticated
  with check (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy units_update on public.units
  for update to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id())
  with check (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy units_delete on public.units
  for delete to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy users_select on public.users
  for select to authenticated
  using (
    hoa_id = public.current_hoa_id()
    and (public.is_admin_treasurer() or id = auth.uid())
  );

create policy users_insert on public.users
  for insert to authenticated
  with check (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy users_update on public.users
  for update to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id())
  with check (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy users_delete on public.users
  for delete to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy charges_select on public.charges
  for select to authenticated
  using (public.can_read_unit(hoa_id, unit_id));

create policy charges_insert on public.charges
  for insert to authenticated
  with check (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy charges_update on public.charges
  for update to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id())
  with check (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy charges_delete on public.charges
  for delete to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy payments_select on public.payments
  for select to authenticated
  using (public.can_read_unit(hoa_id, unit_id));

create policy payments_insert on public.payments
  for insert to authenticated
  with check (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy payments_update on public.payments
  for update to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id())
  with check (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy payments_delete on public.payments
  for delete to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy payment_links_select on public.payment_links
  for select to authenticated
  using (public.can_read_unit(hoa_id, unit_id));

create policy payment_links_insert on public.payment_links
  for insert to authenticated
  with check (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy payment_links_update on public.payment_links
  for update to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id())
  with check (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

create policy payment_links_delete on public.payment_links
  for delete to authenticated
  using (public.is_admin_treasurer() and hoa_id = public.current_hoa_id());

-- Officer list of payments. security_invoker keeps the payments RLS in force,
-- and the admin filter returns zero rows for a resident.
create view public.who_has_paid
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
where public.is_admin_treasurer();

revoke all on table public.hoas from anon;
revoke all on table public.units from anon;
revoke all on table public.users from anon;
revoke all on table public.charges from anon;
revoke all on table public.payments from anon;
revoke all on table public.payment_links from anon;
revoke all on table public.who_has_paid from anon;

grant select, update on table public.hoas to authenticated;
grant select, insert, update, delete on table public.units to authenticated;
grant select, insert, update, delete on table public.users to authenticated;
grant select, insert, update, delete on table public.charges to authenticated;
grant select, insert, update, delete on table public.payments to authenticated;
grant select, insert, update, delete on table public.payment_links to authenticated;
grant select on table public.who_has_paid to authenticated;
