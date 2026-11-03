# DuesKo

DuesKo is a dues collection app for Philippine homeowners' associations. A resident sees only their own unit. An admin treasurer sees every unit and who has paid. Money is stored as integer centavos and shown as Philippine pesos.

Officers and residents use separate portals. Officers sign in at `/admin/login`. Residents sign in at `/resident/login`. A resident uploads a photo of a GCash, bank, or other payment. An officer approves or rejects it. Cash and other manual payments are recorded by the officer and approved immediately. There is no online checkout.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43117](http://127.0.0.1:43117).

Demo sign-in has no password. It is marked **DEV ONLY**, runs only when `NODE_ENV` is `development`, and sets a cookie for one of two seeded accounts at Villa Esperanza Homeowners Association, Inc. Production builds, including the public test site, do not offer passwordless demo login. Sign-in there is Supabase Auth only. The sample store resets on a cold start. See [DEPLOY.md](DEPLOY.md).

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
| `NEXT_PUBLIC_DUESKO_TEST_SITE` | Set to `true` for a public sample site. Turns on the test banner. The in-memory mock is used only when the Supabase URL and anon key are unset. Passwordless demo sign-in stays off in production. |

The dashboard may label the public key "anon public" or "publishable". Put that value in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Supabase setup

Apply the migration files in this order:

1. `supabase/migrations/20261102120000_v3_initial.sql`
2. `supabase/migrations/20261103120000_payment_proofs.sql`
3. `supabase/migrations/20261103180000_export_and_acknowledgments.sql`

The second migration adds proof status, the review audit columns, and a private Storage bucket named `payment-proofs`. Object paths are `{hoa_id}/{charge_id}/{uuid}.ext`. Only the resident for that charge can upload. That resident and the HOA officers can read the file through a short-lived signed URL.

`supabase/seed/test_hoa.sql` is sample data for a test association. It is not a migration and it contains no emails. Apply it by hand. Add `public.users` only after each person exists in Authentication, with `public.users.id` equal to `auth.users.id`.

Then:

1. In Authentication → URL Configuration, set the Site URL to the app origin and allow `https://<your-host>/**` as a redirect URL.
2. Invite each person from Authentication → Users. Send the invite with redirect `https://<your-host>/auth/callback`. Do not set a password for them. The link opens `/auth/callback`, then `/auth/set-password`, where they choose their own password. After that they go to `/admin` or `/resident` based on `public.users.role`.
3. A person who already has a password can also use **Email me a sign-in link** on the login page. That magic link returns to `/auth/callback` and exchanges the code for a session.
4. In the SQL editor, insert the association, its units, and `public.users`. A resident row needs `unit_id`. The SQL editor runs with rights that bypass row level security, which is required for the first association because authenticated clients cannot insert `hoas`.
5. Put the public Supabase URL and anon key in `.env.local` and restart the app. Demo sign-in is not shown. Sign in with the email and the password that person chose, or with a magic link.

`lib/supabase/service.ts` can build a service-role client for server-side maintenance. Pages and client components do not import it. PayMongo keys are not part of this step.

## Data layer

`DuesRepository` in `lib/repository.ts` is the seam. `getRepository()` returns an in-memory repository over `lib/mock/seed.json`, or `SupabaseDuesRepository` when the public env vars are set. A resident id returns only that resident's unit and charges. An admin treasurer id returns every unit in the HOA, and can save the registered name, edit units, create monthly dues for every unit, and create a special assessment for every unit or a chosen subset. Amounts are integer centavos.

The SQL is the two migration files above. Tables include `hoas`, `units`, `users`, `charges`, and `payments` (cash, GCash, bank transfer, or other, with a pending, approved, or rejected status). `payment_links` is left in the first migration and is not used. `users.id` references `auth.users`.

## Next steps

Later days:

- Downloadable payment acknowledgments and CSV export
- Who-has-paid for the admin treasurer, the resident account, and a shareable pay link
- CSV export of payments and balances
