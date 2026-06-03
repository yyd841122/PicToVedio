# MotionPic AI Live Readiness Review

Last updated: 2026-06-03

This review summarizes what is ready, what can still be checked locally, and what must wait for owner confirmation before MotionPic AI moves from a working public MVP toward real paid traffic.

## Current Readiness Summary

MotionPic AI is public, deployed, and technically close to a controlled live test. The site should not be treated as fully ready for public paid traffic until live payment, storage, support, and generation-quality checks are completed.

Current state:

- Public site is live at `https://video.cozyguidehub.com/`.
- Public `/health` returns `{"ok":true,"provider":"dashscope"}`.
- DashScope has been configured on Render.
- Creem test checkout exists.
- Supabase schema and credit persistence exist.
- Private analytics and ops dashboards exist.
- SEO/GEO foundation is in place.
- Directory, search, demo asset, and launch checklists exist.

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
- [x] Search submission, directory submission, SEO/GEO audit, and demo asset planning documents exist.
- [x] Public SEO readiness check report exists in `reports/PUBLIC_SEO_READINESS_CHECK_2026-06-03.md`.

Product foundation:

- [x] Upload UI, template selection, credit estimates, and generation history exist.
- [x] Anonymous user IDs replace the shared demo-user flow for normal browser traffic.
- [x] Server recalculates generation credit costs instead of trusting browser-supplied credit values.
- [x] Failed real generation requests can refund credits through ledger logic.
- [x] Admin analytics and ops dashboards exist for review.

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

## Needs Owner Confirmation Or Access

These cannot be completed safely without account access, private tokens, screenshots, or explicit owner action:

- [ ] Confirm `/admin/analytics` requires the private analytics token in production.
- [ ] Confirm `/admin/ops` requires the private analytics token in production.
- [ ] Confirm upload, generation, download, checkout click, and checkout redirect events appear in analytics.
- [ ] Confirm Supabase advisor warnings are cleared after `SUPABASE_SECURITY_FIX.sql`.
- [ ] Confirm support email is final and monitored.
- [ ] Confirm final brand name remains MotionPic AI.
- [ ] Confirm whether Baidu submission matters for the first launch wave.

## Must Wait Before Public Paid Traffic

Generation and quality:

- [ ] Run at least 5 real DashScope generations with different photo types.
- [ ] Confirm successful jobs create rows in `video_jobs`.
- [ ] Confirm failed jobs refund credits.
- [ ] Record average provider cost in `UNIT_ECONOMICS.md`.
- [ ] Tune `ESTIMATED_VIDEO_COST_CNY` after more real DashScope generations.
- [ ] Save at least 3 acceptable demo outputs before public promotion.

Credits and pricing:

- [ ] Confirm one 4-second 720p generation charges the intended credit amount.
- [ ] Align visible website package amounts, Render variables, Creem product descriptions, and webhook credit grants.
- [ ] Keep enough margin after provider cost, payment fees, failed jobs, retries, and support.

Storage:

- [ ] Decide object storage provider.
- [ ] Create Cloudflare R2 bucket or selected storage bucket.
- [ ] Add storage keys to Render.
- [ ] Set storage provider in Render.
- [ ] Confirm uploaded photos and generated videos persist outside browser/local JSON.
- [ ] Confirm generated output links still open after refresh.

Payments:

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
- [ ] Support email is final and monitored.
- [ ] At least 3 acceptable demo clips or screenshots are ready.
- [ ] Object storage is enabled or the site clearly tells users to download outputs.
- [ ] Refund policy is visible and matches real operating behavior.

## Safe Next Steps

Low-risk tasks that can continue without touching private systems:

- [x] Improve documentation around first live-payment test procedure.
- [ ] Prepare a provider-cost sampling worksheet.
- [ ] Prepare a demo-output evaluation rubric.
- [ ] Prepare a support-response template for failed or distorted generations.
- [ ] Prepare a storage setup review checklist based on `R2_SETUP_GUIDE.md`.

## High-Risk Tasks That Need Explicit Confirmation

- [ ] Run Supabase SQL.
- [ ] Change Render environment variables.
- [ ] Configure Creem live products or webhooks.
- [ ] Perform a real payment.
- [ ] Write to Cloudflare R2 or OSS.
- [ ] Submit IndexNow, Google Search Console, Bing Webmaster Tools, or paid directory listings.
- [ ] Publish Product Hunt or social launch posts.
