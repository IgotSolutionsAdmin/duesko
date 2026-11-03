-- Officer-edited How to pay text. DuesKo does not process payments.
-- Existing hoas_select lets residents read their HOA row.
-- Existing hoas_update lets officers edit their HOA row, including how_to_pay.

alter table public.hoas
  add column if not exists how_to_pay text;

update public.hoas
set how_to_pay = 'DuesKo does not process payments. Pay your HOA through its usual channels, then upload your proof here.'
where how_to_pay is null or btrim(how_to_pay) = '';

alter table public.hoas
  alter column how_to_pay set default
    'DuesKo does not process payments. Pay your HOA through its usual channels, then upload your proof here.';

alter table public.hoas
  alter column how_to_pay set not null;

alter table public.hoas drop constraint if exists hoas_how_to_pay_length;

alter table public.hoas
  add constraint hoas_how_to_pay_length
  check (length(btrim(how_to_pay)) > 0 and length(how_to_pay) <= 2000);

comment on column public.hoas.how_to_pay is
  'Officer-edited instructions. Residents see this on home and upload. Not a payment link, GCash, or QR Ph flow.';

-- One pending proof per charge. Re-upload is allowed after reject.
create unique index if not exists payments_one_pending_per_charge
  on public.payments (charge_id)
  where status = 'pending';

-- Proofs are JPG, PNG, or PDF. 5 MB. WebP is no longer accepted.
update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf']
where id = 'payment-proofs';
