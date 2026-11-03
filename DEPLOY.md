# Deploy a public sample site

No accounts are created by this repository. The sample site uses the in-memory mock and two passwordless demo buttons. Set one env var and nothing else.

`NEXT_PUBLIC_DUESKO_TEST_SITE=true`

That flag shows the test banner and turns on demo sign-in in a production build. Sample edits, including uploaded proof photos, live in the server process memory and reset on a cold start.

Do not set the Supabase variables for this sample. Do not put secrets in the repo.

## Vercel Hobby

Vercel detects Next.js. No `vercel.json` and no extra build command.

1. In Vercel, choose **Add New… → Project** and import this GitHub repository.
2. Leave the framework preset as **Next.js**. Leave build and output settings on their defaults.
3. Add an environment variable: name `NEXT_PUBLIC_DUESKO_TEST_SITE`, value `true`. Apply it to Production.
4. Deploy.

Open the deployment URL. Officer sign-in is `/admin/login` (**Sign in as demo admin (Ana Reyes)**). Resident sign-in is `/resident/login` (**Sign in as demo resident (Juan dela Cruz)**).

A warm Vercel function keeps those sample edits until it goes cold. A second function instance does not see them.

## Cloudflare (OpenNext)

Cloudflare does not run `next start` as-is. A Next.js app needs the OpenNext adapter (`@opennextjs/cloudflare`) and a Workers config, so it is not zero-config.

The in-memory mock is a poor fit there. Each Worker isolate has its own memory, isolates are not shared, and they are discarded often. Demo sign-in can still open the built-in sample, but a charge, payment, or proof photo saved on one request can be gone on the next. Use the Vercel sample site if people need to click through a short flow.
