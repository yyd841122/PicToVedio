# MotionPic AI Live Readiness Review

Last updated: 2026-06-07

This review summarizes what is ready, what can still be checked locally, and what must wait for owner confirmation before MotionPic AI moves from a working public MVP toward real paid traffic.

## Current Readiness Summary

MotionPic AI is public, deployed, and technically close to a controlled live test. The site should not be treated as fully ready for public paid traffic until live payment, storage, support, and generation-quality checks are completed.

Current state:

- Public site is live at `https://video.cozyguidehub.com/`.
- Public `/health` reports `ok=true`, `provider=dashscope`, a safe short build id, and server time.
- DashScope has been configured on Render.
- Creem test checkout exists.
- Supabase schema and credit persistence exist.
- Supabase public table access has been tightened with the live security fix SQL.
- Private analytics and ops dashboards exist.
- SEO/GEO foundation is in place.
- Directory, search, demo asset, and launch checklists exist.
- Email login is available, homepage account status is visible, and paid checkout requires login when Supabase Auth is configured.

## Ready Now

Low-risk/public readiness:

- [x] Homepage and public SEO pages are live.
- [x] `robots.txt`, `sitemap.xml`, `llms.txt`, and `indexnow-key.txt` return 200.
- [x] Sitemap includes homepage, policy pages, template pages, guide pages, and `llms.txt`.
- [x] Account, launch-kit, admin, and API surfaces are excluded from sitemap or blocked from public indexing.
- [x] Homepage has title, description, canonical, Open Graph, Twitter Card, and JSON-LD.
- [x] Template and guide pages have canonical, H1, JSON-LD, Open Graph, and Twitter Card metadata.
- [x] Legal pages have canonical, H1, WebPage JSON-LD, Open Graph, and Twitter Card metadata.
- [x] Privacy, Terms, and Refund pages exist and are visible from the footer.
- [x] Homepage FAQ and refund/support copy explain failed-generation refunds, imperfect successful outputs, and support-request details.
- [x] Search submission, directory submission, SEO/GEO audit, and demo asset planning documents exist.
- [x] Public SEO readiness check report exists in `reports/PUBLIC_SEO_READINESS_CHECK_2026-06-03.md`.
- [x] Owner UAT checklist exists in `OWNER_UAT_CHECKLIST.md`.

Product foundation:

- [x] Upload UI, template selection, credit estimates, and generation history exist.
- [x] Anonymous user IDs replace the shared demo-user flow for normal browser traffic.
- [x] Server recalculates generation credit costs instead of trusting browser-supplied credit values.
- [x] Failed real generation requests can refund credits through ledger logic.
- [x] Real provider jobs have conservative daily caps before credit deduction.
- [x] Generation API errors return user-friendly codes for low credits, unsuitable images, busy providers, and quota limits.
- [x] Admin analytics and ops dashboards exist for review.
- [x] Ops dashboard includes live-payment preflight and owner-only action queue.

## Can Be Checked Locally Or With Public GET Requests

These checks are low risk and do not require changing production settings:

- [x] Homepage loads without obvious broken links.
- [x] Public template pages return 200.
- [x] Public guide pages return 200.
- [x] Public legal pages return 200.
- [x] Social preview metadata exists on public SEO pages.
- [x] JSON-LD blocks parse as valid JSON.
- [x] Internal root-relative links resolve to known routes.
- [x] Public health endpoint still reports DashScope.
- [x] `photo-to-video-hero.png` returns 200 for social preview images.
- [x] Local smoke coverage checks public pages, SEO metadata, login-required checkout, ops preflight, refund copy, and launch-kit copy.

## Needs Owner Confirmation Or Access

These cannot be completed safely without account access, private tokens, screenshots, or explicit owner action:

- [x] Confirm `/admin/analytics` requires the private analytics token in production.
- [x] Confirm `/admin/ops` requires the private analytics token in production.
- [x] Confirm upload, generation, checkout click, and checkout redirect events appear in analytics.
- [x] Supabase Security Advisor shows 0 errors after `SUPABASE_SECURITY_FIX.sql` as of 2026-06-07.
- [x] Six `RLS Enabled No Policy` info items are intentional for server-only core tables.
- [x] Confirm `support@cozyguidehub.com` receives mail in the monitored Gmail destination through Cloudflare Email Routing.
- [ ] Confirm final brand name remains MotionPic AI.
- [ ] Confirm whether Baidu submission matters for the first launch wave.
- [x] Confirm outbound support mail reaches an external mailbox as `support@cozyguidehub.com` through verified Resend SMTP.
- [x] Configure Gmail to reply from the same address that received the message.

## Must Wait Before Public Paid Traffic

Generation and quality:

- [x] Run at least 4 real DashScope generations with different safer photo types.
- [x] Confirm successful jobs create rows in `video_jobs` through `/admin/ops`.
- [ ] Confirm failed jobs refund credits.
- [x] Record the current CNY 0.60 unit cost in `UNIT_ECONOMICS.md`.
- [x] Current observed DashScope unit price is CNY 0.60 per 4s/720p use; update economics once the owner confirms bill details.
- [ ] Tune `ESTIMATED_VIDEO_COST_CNY` after more real DashScope generations.
- [x] Identify at least 3 acceptable demo outputs before public promotion.

Credits and pricing:

- [x] Confirm one standard 4-second 720p generation charges 2 credits.
- [x] Confirm Render uses conservative `10 / 2` daily generation caps before broad promotion.
- [x] Align visible website package amounts, Render variables, Creem test product descriptions, and webhook credit grants.
- [x] Recommended controlled-live path is documented as `$9/40` and `$29/160` credits.
- [ ] Keep enough margin after provider cost, payment fees, failed jobs, retries, and support.

Storage:

- [ ] Decide object storage provider.
- [ ] Create Cloudflare R2 bucket or selected storage bucket.
- [ ] Add storage keys to Render.
- [ ] Set storage provider in Render.
- [ ] Confirm uploaded photos and generated videos persist outside browser/local JSON.
- [ ] Confirm generated output links still open after refresh.

Payments:

- [x] Controlled Creem test checkout uses the new MotionPic AI Creator Pack at `$9 / 40 credits`.
- [x] Controlled test payment returned successfully and increased the signed-in balance by exactly 40 credits on 2026-06-07.
- [x] Ops evidence confirms the matching test payment, `checkout.completed` webhook, and `+40 / creem-checkout` ledger entry.
- [x] MotionPic AI category pre-review request was sent to Creem on 2026-06-07.
- [ ] Receive written Creem confirmation before any live-mode configuration.
- [ ] Finish Creem live store verification.
- [ ] Create live Creator Pack product.
- [ ] Create live Commerce Pack product.
- [ ] Create live webhook for `https://video.cozyguidehub.com/api/creem/webhook`.
- [ ] Replace Render test values with live Creem key, product IDs, and webhook secret.
- [ ] Set `CREEM_TEST_MODE=false`.
- [ ] Make one low-price live payment test.
- [ ] Confirm Supabase `payments`, `credit_ledger`, and `webhook_events` record the live payment.
- [ ] Confirm the buyer can spend credits and receive a usable video.

## Promotion Gate

Do not run broad public promotion until these are true:

- [ ] Live payment has been tested once.
- [ ] Pricing and credit grants match across site, Creem, Render, and webhook logic.
- [x] Support receive path is tested and monitored.
- [x] Outbound replies use the approved `support@cozyguidehub.com` sender identity.
- [ ] At least 3 acceptable demo clips or screenshots are ready.
- [x] Stage 1 Good outputs are recorded as private candidate demos.
- [x] Object storage is enabled or the site clearly tells users to download outputs.
- [x] Refund policy is visible and matches the implemented technical-failure refund versus successful-output quality distinction.

## Safe Next Steps

Low-risk tasks that can continue without touching private systems:

- [x] Improve documentation around first live-payment test procedure.
- [x] Prepare a provider-cost sampling worksheet.
- [x] Prepare a demo-output evaluation rubric.
- [x] Prepare a support-response template for failed or distorted generations.
- [x] Prepare a storage setup review checklist based on `R2_SETUP_GUIDE.md`.
- [x] Add public download-soon guidance while object storage remains deferred.
- [x] Prepare guarded launch-kit copy and demo checklist without publishing.
- [x] Improve smoke/readiness checks without touching production settings.

## High-Risk Tasks That Need Explicit Confirmation

- [x] Run Supabase SQL.
- [ ] Change Render environment variables.
- [ ] Configure Creem live products or webhooks.
- [ ] Perform a real payment.
- [ ] Write to Cloudflare R2 or OSS.
- [ ] Submit IndexNow, Google Search Console, Bing Webmaster Tools, or paid directory listings.
- [ ] Publish Product Hunt or social launch posts.
