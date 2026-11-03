# DuesKo

DuesKo is a dues collection app for Philippine homeowners' associations. A resident sees only their own unit. An admin treasurer sees every unit and who has paid. Money is stored as integer centavos and shown as Philippine pesos.

Day 3 adds charges and an optional Supabase path. With no env values, the app stays on the mock repository and the DEV ONLY demo sign-in. When the public Supabase URL and anon key are set, `getRepository()` uses `SupabaseDuesRepository` and sign-in is Supabase Auth email and password.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43117](http://127.0.0.1:43117).

Demo sign-in has no password. It is marked **DEV ONLY** and sets a cookie for one of two seeded accounts at Villa Esperanza Homeowners Association, Inc.:

- Ana Reyes, admin treasurer
- Juan dela Cruz, resident of Blk 1 Lot 4

## Scripts

- `npm run dev` — app at port 43117
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — dues math, mock repository access, and the local Postgres RLS check when `psql` is available
- `npm run test:e2e` — headless Playwright against the mock repository

## Environment variables

Copy `.env.example` to `.env.local`. Leave the values empty to use the mock. Fill them to use Supabase. Do not commit values.

| Name | Used by |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server. Together with the anon key, this switches the app off the mock. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server. Row level security still applies. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only, in `lib/supabase/service.ts`. Bypasses row level security. Never use a `NEXT_PUBLIC_` name for it. |

The dashboard may label the public key "anon public" or "publishable". Put that value in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Supabase setup

Apply the migration files in this order:

1. `supabase/migrations/20261102120000_v3_initial.sql`

Then:

1. In Authentication, enable the email provider. Create each person with email and password. For a local demo, turn off email confirmation so the password sign-in works immediately.
2. In the SQL editor, insert the association, its units, and `public.users`. `public.users.id` must be the same id as `auth.users.id`. A resident row needs `unit_id`. The SQL editor runs with rights that bypass row level security, which is required for the first association because authenticated clients cannot insert `hoas`.
3. Put the three names above in `.env.local` and restart the app. Demo sign-in is not shown. Sign in with the email and password.

`lib/supabase/service.ts` can build a service-role client for server-side maintenance. Pages and client components do not import it. PayMongo keys are not part of this step.

## Data layer

`DuesRepository` in `lib/repository.ts` is the seam. `getRepository()` returns an in-memory repository over `lib/mock/seed.json`, or `SupabaseDuesRepository` when the public env vars are set. A resident id returns only that resident's unit and charges. An admin treasurer id returns every unit in the HOA, and can save the registered name, edit units, create monthly dues for every unit, and create a special assessment for every unit or a chosen subset. Amounts are integer centavos.

The SQL for the same rules is `supabase/migrations/20261102120000_v3_initial.sql`. Tables: `hoas` (`registered_name`), `units` (flat or per-sqm rate), `users` (`admin_treasurer` or `resident`), `charges` (dues and special assessments, unpaid or paid), `payments` (PayMongo or manual cash, optional `hoa_reference_no`), and `payment_links`. `users.id` references `auth.users`.

## Next steps

Later days:

- PayMongo checkout with the HOA's own test keys, and an idempotent webhook
- Manual cash with the optional HOA reference number, and the payment acknowledgment label
- Who-has-paid for the admin treasurer, the resident account, and a shareable pay link
- CSV export of payments and balances
