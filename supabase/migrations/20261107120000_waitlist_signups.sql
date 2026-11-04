-- Public waitlist. Anon may insert only. Officers may read.
-- Service role bypasses RLS. There is no update or delete policy.

create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  mobile text,
  hoa_name text not null,
  city text not null,
  units_range text not null,
  role text not null,
  collect_methods text[] not null,
  notes text,
  consent_at timestamptz not null,
  user_agent text,
  constraint waitlist_full_name_present check (length(btrim(full_name)) > 0 and length(full_name) <= 200),
  constraint waitlist_email_present check (length(btrim(email)) > 0 and length(email) <= 320),
  constraint waitlist_hoa_present check (length(btrim(hoa_name)) > 0 and length(hoa_name) <= 200),
  constraint waitlist_city_present check (length(btrim(city)) > 0 and length(city) <= 120),
  constraint waitlist_units_range check (
    units_range in ('1-50', '51-150', '151-300', '301-500', '500+')
  ),
  constraint waitlist_role check (
    role in (
      'President',
      'Treasurer',
      'Secretary',
      'Board member',
      'Property manager or admin staff',
      'Homeowner',
      'Other'
    )
  ),
  constraint waitlist_collect_methods_present check (cardinality(collect_methods) >= 1),
  constraint waitlist_notes_length check (notes is null or length(notes) <= 2000),
  constraint waitlist_mobile_length check (mobile is null or length(mobile) <= 40)
);

comment on table public.waitlist_signups is
  'Public waitlist interest. Anon insert only. Officers may read. Not a payment table.';

alter table public.waitlist_signups enable row level security;

grant usage on schema public to anon, authenticated;
revoke all on table public.waitlist_signups from public, anon, authenticated;
grant insert on table public.waitlist_signups to anon;
grant select on table public.waitlist_signups to authenticated;

create policy waitlist_signups_anon_insert
  on public.waitlist_signups
  for insert
  to anon
  with check (true);

create policy waitlist_signups_officer_select
  on public.waitlist_signups
  for select
  to authenticated
  using (public.is_admin_treasurer());
