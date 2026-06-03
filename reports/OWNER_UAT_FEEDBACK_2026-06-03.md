# MotionPic AI Owner UAT Feedback

Date: 2026-06-03

Scope: owner-reported UAT results plus read-only public verification. No private tokens, secrets, payment details, Supabase rows, Render settings, Creem settings, R2 writes, real payments, or real generation jobs were changed.

## Owner-Reported Results

The owner confirmed:

- After logging out, `/admin/analytics` requires the private analytics token.
- `/admin/ops` also requires the private analytics session/token.
- A manual owner-approved test credit grant was applied in Supabase.
- The credit ledger shows `manual-test-grant` with `+30` credits for `generation-test`.
- The test account balance is now `33` credits, enough for the first controlled generation samples.
- The following public pages display normally:
  - `/guides`
  - `/templates/product-video-ad`
  - `/templates/pet-animation`
  - `/templates/old-photo-alive`
  - `/privacy`
  - `/terms`
  - `/refund`

## Independent Public Check

A no-cookie public scrape also returned login pages with HTTP 403 for:

- `https://video.cozyguidehub.com/admin/analytics`
- `https://video.cozyguidehub.com/admin/ops`

This supports the owner's result that the admin pages are not publicly readable after logout.

## Remaining UAT Areas

- Real DashScope generation sample testing.
- Analytics event review after owner-approved test activity.
- Supabase advisor warning confirmation.
- Live Creem payment test.
- Object-storage write test.
- Support email monitoring confirmation.
