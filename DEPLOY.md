# Deploy a public sample site

No accounts are created by this repository. The sample site can show a test banner. Production sign-in is Supabase Auth only. Passwordless demo buttons are local development only.

`NEXT_PUBLIC_DUESKO_TEST_SITE=true`

That flag shows the test banner. It does not turn on cookie demo sign-in in a production build. Sample edits, including uploaded proof photos, live in the server process memory and reset on a cold start.

A production deploy that people can sign into needs the public Supabase URL and anon key, plus invited Auth users. The test-site flag alone no longer unlocks passwordless demo buttons. Do not put secrets or the service role key in the repo.

## Vercel Hobby

Vercel detects Next.js. No `vercel.json` and no extra build command.

1. In Vercel, choose **Add New… → Project** and import this GitHub repository.
2. Leave the framework preset as **Next.js**. Leave build and output settings on their defaults.
3. Add an environment variable: name `NEXT_PUBLIC_DUESKO_TEST_SITE`, value `true`. Apply it to Production.
4. Deploy.

Open the deployment URL. Officer sign-in is `/admin/login`. Resident sign-in is `/resident/login`. Both use Supabase Auth (email and password, or a one-time link). The DEV ONLY role switch and demo cookie session are absent.

## Real accounts on the same project

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, the app uses Supabase even if the test-site flag is still on. The flag keeps the test banner. Do not put the service role key in Vercel.

Invite links and magic links land on `/auth/callback`. An invited person then chooses a password at `/auth/set-password`. In the Supabase dashboard, set the Site URL to `https://duesko.vercel.app` and add redirect URL `https://duesko.vercel.app/**`. Send invites with redirect `https://duesko.vercel.app/auth/callback`. The app does not set passwords.

`supabase/seed/test_hoa.sql` loads the test association, four units, November dues, and one special assessment. It is not a migration and it has no emails.

A warm Vercel function keeps those sample edits until it goes cold. A second function instance does not see them.

## Cloudflare (OpenNext)

Cloudflare does not run `next start` as-is. A Next.js app needs the OpenNext adapter (`@opennextjs/cloudflare`) and a Workers config, so it is not zero-config.

The in-memory mock is a poor fit there. Each Worker isolate has its own memory, isolates are not shared, and they are discarded often. Demo sign-in can still open the built-in sample, but a charge, payment, or proof photo saved on one request can be gone on the next. Use the Vercel sample site if people need to click through a short flow.
