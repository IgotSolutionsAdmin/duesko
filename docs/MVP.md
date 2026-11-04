# DuesKo MVP plan

## Product scope

Manual dues collection only: residents pay through their HOA’s usual channels (GCash, bank transfer, or cash), upload proof, and officers approve or reject with a reason. Officers record cash and other manual payments by hand. DuesKo does not host checkout or pay-by-link flows.

## Day 7 — Launch readiness

- Remove online-pay product wording from UI, docs, and tests; guard with automated scans.
- End-to-end pass: admin login, HOA and units, charges, resident How to pay, proof upload, approve/reject, cash recording, acknowledgments, history, export.
- Verify mobile (390×844) and desktop (1440×900).
- Production: `NEXT_PUBLIC_DUESKO_WAITLIST_OPEN` unset; `NEXT_PUBLIC_DUESKO_TEST_SITE` not `true`.
- Supabase: migrations applied, RLS on all public tables, private `payment-proofs` bucket.
- Deploy: Vercel production build green on `main`.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the operator checklist.
