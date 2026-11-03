-- Live test association for project luenleqlgzivqlpiztzd.
-- Apply by hand in the SQL editor or via the Supabase MCP. This is not a migration.
-- No emails and no passwords. public.users is inserted only after Auth invites,
-- because users.id must equal auth.users.id.

insert into public.hoas (id, registered_name)
values (
  'a1111111-1111-4111-8111-111111111111',
  'DuesKo Test HOA (TEST DATA)'
)
on conflict (id) do update
set registered_name = excluded.registered_name;

insert into public.units (id, hoa_id, label, area_sqm, rate_type, rate_centavos)
values
  (
    'a2222222-2222-4222-8222-222222222201',
    'a1111111-1111-4111-8111-111111111111',
    'Blk 1 Lot 1',
    null,
    'flat',
    150000
  ),
  (
    'a2222222-2222-4222-8222-222222222202',
    'a1111111-1111-4111-8111-111111111111',
    'Blk 1 Lot 2',
    null,
    'flat',
    180000
  ),
  (
    'a2222222-2222-4222-8222-222222222203',
    'a1111111-1111-4111-8111-111111111111',
    'Blk 2 Lot 3',
    48.00,
    'per_sqm',
    3500
  ),
  (
    'a2222222-2222-4222-8222-222222222204',
    'a1111111-1111-4111-8111-111111111111',
    'Blk 2 Lot 4',
    60.00,
    'per_sqm',
    4200
  )
on conflict (id) do update
set
  label = excluded.label,
  area_sqm = excluded.area_sqm,
  rate_type = excluded.rate_type,
  rate_centavos = excluded.rate_centavos;

-- November 2026 dues for every unit, plus one special assessment on Blk 1 Lot 1.
insert into public.charges (
  id,
  hoa_id,
  unit_id,
  kind,
  description,
  period,
  amount_centavos,
  due_date,
  status
)
values
  (
    'a3333333-3333-4333-8333-333333333301',
    'a1111111-1111-4111-8111-111111111111',
    'a2222222-2222-4222-8222-222222222201',
    'dues',
    'November 2026 dues',
    '2026-11',
    150000,
    '2026-11-30',
    'unpaid'
  ),
  (
    'a3333333-3333-4333-8333-333333333302',
    'a1111111-1111-4111-8111-111111111111',
    'a2222222-2222-4222-8222-222222222202',
    'dues',
    'November 2026 dues',
    '2026-11',
    180000,
    '2026-11-30',
    'unpaid'
  ),
  (
    'a3333333-3333-4333-8333-333333333303',
    'a1111111-1111-4111-8111-111111111111',
    'a2222222-2222-4222-8222-222222222203',
    'dues',
    'November 2026 dues',
    '2026-11',
    168000,
    '2026-11-30',
    'unpaid'
  ),
  (
    'a3333333-3333-4333-8333-333333333304',
    'a1111111-1111-4111-8111-111111111111',
    'a2222222-2222-4222-8222-222222222204',
    'dues',
    'November 2026 dues',
    '2026-11',
    252000,
    '2026-11-30',
    'unpaid'
  ),
  (
    'a3333333-3333-4333-8333-333333333305',
    'a1111111-1111-4111-8111-111111111111',
    'a2222222-2222-4222-8222-222222222201',
    'special',
    'Special assessment (TEST DATA)',
    null,
    250000,
    '2026-11-20',
    'unpaid'
  )
on conflict (id) do update
set
  kind = excluded.kind,
  description = excluded.description,
  period = excluded.period,
  amount_centavos = excluded.amount_centavos,
  due_date = excluded.due_date,
  status = excluded.status;
