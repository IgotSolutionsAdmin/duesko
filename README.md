# DuesKo

DuesKo is a dues collection app for Philippine homeowners' associations. A resident sees only their own unit. An admin treasurer sees every unit and who has paid. Money is stored as integer centavos.

This repository is the Day 1 skeleton: the app shell, a mock sign-in, and the database migration. Supabase is not connected yet.

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
- `npm test` — mock repository access check

## Environment variables

Supabase is not wired up. When it is, set these names in `.env.local`. Copy `.env.example`. Values stay out of git.

| Name | Used by |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server. Row level security still applies. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Bypasses row level security. |

The dashboard may label the public key "anon public" or "publishable". Put that value in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Put the service role secret in `SUPABASE_SERVICE_ROLE_KEY`, and never in a `NEXT_PUBLIC_` name.

## Data layer

`DuesRepository` in `lib/repository.ts` is the seam. `getRepository()` in `lib/get-repository.ts` returns an in-memory repository over `lib/mock/seed.json`. A resident id returns only that resident's unit. An admin treasurer id returns every unit in the HOA.

The SQL for the same rules is `supabase/migrations/20261102120000_v3_initial.sql`. Tables: `hoas` (`registered_name`), `units` (flat or per-sqm rate), `users` (`admin_treasurer` or `resident`), `charges` (dues and special assessments), `payments` (PayMongo or manual cash, optional `hoa_reference_no`), and `payment_links`. Amounts are integer centavos. `users.id` references `auth.users`.

## What the owner needs before Supabase can replace the mock

1. A Supabase project (the free project is enough for the demo).
2. The three values named above, sent securely. Do not paste them into the README, a commit, or a chat that gets archived.
3. Apply `supabase/migrations/20261102120000_v3_initial.sql` in the SQL editor, or with the Supabase CLI against that project. The SQL editor runs as a role that bypasses row level security, so it can insert the first `hoas` row. Authenticated clients can update an HOA they already belong to, and the policies do not let them insert one.
4. Confirm row level security is enabled on `hoas`, `units`, `users`, `charges`, `payments`, and `payment_links`. A resident select returns only their unit's rows. An admin treasurer select returns every unit and the `who_has_paid` view.

After that, the next code change replaces `getRepository()` with a Supabase implementation of `DuesRepository` and replaces the DEV ONLY cookie with Supabase Auth. `public.users.id` must be the same id as `auth.users.id`. PayMongo keys are not required for this switch. They are required later, when checkout is added.

## Next steps

Later days, not in this skeleton:

- HOA setup and units, including flat and per-sqm amounts
- Monthly dues and one-off special assessments
- PayMongo checkout with the HOA's own test keys, and an idempotent webhook
- Manual cash with the optional HOA reference number, and the payment acknowledgment label
- Who-has-paid for the admin treasurer, the resident account, and a shareable pay link
- CSV export of payments and balances
