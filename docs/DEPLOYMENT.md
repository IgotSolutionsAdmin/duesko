# DuesKo deployment runbook

Production site: [https://duesko.vercel.app](https://duesko.vercel.app)  
Supabase project: `luenleqlgzivqlpiztzd` (region `ap-southeast-1`)  
Vercel project: `duesko` (team `igs21`)

The Deployment Agent owns deploy verification after `main` changes. Coding and design agents merge to `main`; Vercel deploys from GitHub automatically.

## Deploy flow

1. **Merge to `main`** — Vercel builds and promotes the production deployment (Next.js defaults; no custom `vercel.json` required).
2. **Confirm GitHub → Vercel** — On the latest commit, the **Vercel** commit status should be `success` (“Deployment has completed”).
3. **Apply Supabase migrations** (when schema changes land) — Only after review. See [Migration order](#migration-order) below. Use the Supabase dashboard SQL editor or `supabase db push` with the linked project; do not apply unreviewed SQL from ad hoc branches.
4. **Post-deploy checklist** — Run the [Post-deploy checklist](#post-deploy-checklist).

Optional seed data (not a migration): `supabase/seed/test_hoa.sql` for demo HOA data in Supabase. Run manually when needed; it does not run on deploy.

## Roll back (Vercel)

Use Vercel when a bad build reached production:

1. Open the project in Vercel → **Deployments**.
2. Find the last known-good deployment for `main`.
3. Open the **⋯** menu → **Promote to Production** (or **Instant Rollback**, depending on plan/UI).

Rolling back the app does **not** roll back Supabase schema. If a migration caused the issue, restore from a Supabase backup or ship a forward-fix migration (dashboard-only; coordinate with Lance).

## Migration order

Apply migrations in **filename sort order** under `supabase/migrations/`:

| Order | File | Purpose |
|------:|------|---------|
| 1 | `20261102120000_v3_initial.sql` | Core schema, RLS, helper functions |
| 2 | `20261103120000_payment_proofs.sql` | Payment proof storage and policies |
| 3 | `20261103180000_export_and_acknowledgments.sql` | Export audit log and acknowledgments |
| 4 | `20261103210000_how_to_pay.sql` | How-to-pay content |
| 5 | `20261107120000_waitlist_signups.sql` | Public waitlist signups |

Remote Supabase may record different version timestamps than the repo filenames; match by **migration name** (suffix after the timestamp). All four names above should appear in **Database → Migrations** before calling production healthy.

## Production environment (Vercel dashboard)

Set in Vercel → Project → **Settings → Environment Variables** (Production):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon / publishable key only |
| `NEXT_PUBLIC_DUESKO_TEST_SITE` | No | Must **not** be `true` in production (shows “TEST SITE” banner) |
| `NEXT_PUBLIC_DUESKO_WAITLIST_OPEN` | No | Must **not** be `true` until the privacy notice is approved |
| `SUPABASE_SERVICE_ROLE_KEY` | **Must not be set** | Bypasses RLS; keep off Vercel. Server code uses it only when explicitly configured locally. |

See also [DEPLOY.md](../DEPLOY.md) for sample-site vs real-auth behavior.

## Supabase Auth URLs (dashboard)

In Supabase → **Authentication → URL configuration**:

- **Site URL:** `https://duesko.vercel.app`
- **Redirect URLs:** include `https://duesko.vercel.app/**` (and `/auth/callback` flows)

Invite and magic links should use redirect `https://duesko.vercel.app/auth/callback`.

## Launch readiness (Day 7)

- [ ] Landing at `/` and portal chooser at `/login`; no test-site banner in production
- [ ] Waitlist closed (`NEXT_PUBLIC_DUESKO_WAITLIST_OPEN` unset); POST `/api/waitlist` returns 403
- [ ] Product copy scan passes (`npm test` → forbidden online-pay wording)
- [ ] Supabase migrations through `waitlist_signups`; RLS on every `public` table; `payment-proofs` bucket private
- [ ] Smoke: officer charges, resident proof upload, approve/reject, cash record, acknowledgment, CSV export

## Post-deploy checklist

- [ ] Latest `main` commit has Vercel status **success**.
- [ ] Smoke HTTP **200**: `/`, `/admin/login`, `/resident/login`.
- [ ] No **“TEST SITE”** banner on those pages.
- [ ] Supabase migrations: repo files match applied migration **names** (no pending DDL).
- [ ] All `public` tables have **RLS enabled**.
- [ ] Run Supabase **Security** and **Performance** advisors; triage new WARN items.
- [ ] Auth Site URL and redirect URLs include `https://duesko.vercel.app`.
- [ ] Production env: `NEXT_PUBLIC_DUESKO_TEST_SITE` ≠ `true`; `SUPABASE_SERVICE_ROLE_KEY` **absent**.

## Agent integrations

| Integration | Used for |
|-------------|----------|
| GitHub | `main` SHA, Vercel commit status, repo migrations |
| Vercel | Deployments, env vars, rollback (requires MCP auth in Cursor) |
| Supabase | Migrations list, RLS/advisors, SQL read-only checks |

Never commit secrets; the repository is public.
