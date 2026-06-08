# MotionPic AI Launch Checklist

Last updated: 2026-06-08

Use this checklist before moving from test mode to real public launch.

## 1. Production Health

- [x] Render latest deploy is live on `https://video.cozyguidehub.com`.
- [x] `/health` reports `ok=true`, `provider=dashscope`, a safe short build id, and server time.
- [x] Owner UAT checklist is prepared in `OWNER_UAT_CHECKLIST.md`.
- [x] Homepage loads without site-owned browser console errors; observed `content.js` runtime messages belong to the browser translation extension.
- [x] Homepage shows email-login/account status and routes anonymous checkout to login before paid checkout.
- [x] Upload, generate, and checkout clicks are tracked in analytics.
- [x] `/admin/analytics` requires the private analytics token.
- [x] `/admin/ops` requires the same private analytics session.
- [x] Local smoke test covers public pages, SEO metadata, login-required checkout, ops preflight, and launch-kit copy.
- [x] HTML, static, JSON, and 404 responses include baseline browser security headers; JSON API responses use `no-store`.

## 1A. Database Security

- [x] Production Supabase security fix SQL ran successfully.
- [x] Public `anon` and `authenticated` direct table grants were revoked in the project SQL.
- [x] Row Level Security was enabled for MotionPic application tables.
- [x] Supabase advisor confirmation guide exists in `SUPABASE_ADVISOR_CONFIRMATION_GUIDE.md`.
- [x] Supabase Security Advisor was refreshed on 2026-06-07 and shows 0 errors; the prior critical public-access warnings are cleared.
- [x] Six `RLS Enabled No Policy` info items are expected because browser roles have no direct core-table access and the server uses `service_role`.
- [x] The remaining leaked-password-protection warning is accepted for the current passwordless Magic Link flow; enabling it requires Supabase Pro.

## 2. Video Generation

- [x] Complete Stage 1 real-generation checks for Product Motion, Pet Motion, Old Photo Alive, and Natural Portrait.
- [ ] Complete the 20-generation promotion-readiness matrix before broad promotion.
- [x] Record the current provider unit cost in `UNIT_ECONOMICS.md`.
- [x] Confirm the failed-job refund path end to end with the local mock provider, including duplicate-refund protection.
- [ ] Confirm failed jobs refund credits.
- [x] Confirm successful jobs create rows in `video_jobs` through `/admin/ops`.
- [x] Confirm `/admin/ops` reports `ESTIMATED_VIDEO_COST_CNY` as CNY 0.60.
- [x] Tune default prompts toward subtle motion and stronger identity/object preservation.

## 3. Credits And Pricing

- [x] Confirm one standard 4-second 720p generation charges 2 credits.
- [x] Controlled-live pricing path is documented as `$9/40` and `$29/160` credits.
- [x] Render test configuration uses `40 / 160` credits and `10 / 2` daily generation caps.
- [x] Creem test products and checkout text match the `40 / 160` Render credit grants.
- [ ] Supabase paid-credit grants use an owner-approved atomic RPC before any live payment test.
- [x] Backend RPC integration is staged behind default-off `SUPABASE_ATOMIC_CREDIT_RPC`.
- [x] Model the controlled-live direct provider margin at `$9/40` and `$29/160`.
- [ ] Validate actual net margin after Creem/payment fees, retries, refunds, and support.
- [x] Final Creator Pack test payment succeeded on 2026-06-07 and increased the signed-in balance by exactly 40 credits after return/refresh.
- [x] `/admin/ops` confirms the matching test payment, `checkout.completed` webhook, and `+40 / creem-checkout` ledger entry.

## 4. Creem Live Payment

- [x] Sent MotionPic AI category pre-review request to Creem on 2026-06-07.
- [ ] Receive written confirmation that MotionPic AI is eligible for Creem live mode.
- [ ] Finish Creem live store verification.
- [ ] Create live Creator Pack product.
- [ ] Create live Commerce Pack product.
- [ ] Create live webhook for `https://video.cozyguidehub.com/api/creem/webhook`.
- [ ] Replace Render test values with live Creem API key, product ids, and webhook signing secret.
- [ ] Set `CREEM_TEST_MODE=false`.
- [ ] Save, rebuild, and deploy.
- [ ] Make one low-price live payment test.
- [ ] Confirm Supabase `payments`, `credit_ledger`, and `webhook_events` record the live payment.

## 5. Storage

- [ ] Decide object storage provider.
- [ ] Create Cloudflare R2 bucket or Alibaba Cloud OSS bucket.
- [ ] Add storage keys to Render.
- [ ] Set `STORAGE_PROVIDER=r2` or the selected provider.
- [ ] Confirm uploaded images and generated videos are stored outside the browser.
- [ ] Confirm generated output links still open after page refresh.

## 6. SEO And GEO

- [x] `/robots.txt` returns 200.
- [x] `/sitemap.xml` returns 200.
- [x] `/llms.txt` returns 200.
- [x] `/indexnow-key.txt` returns 200.
- [x] Homepage source contains title, description, canonical, Open Graph, Twitter Card, and JSON-LD.
- [x] Homepage FAQ covers login, failed-generation refunds, support details, watermark, downloads, and commercial use.
- [x] Create a search submission guide.
- [x] Create a directory submission pack.
- [x] Low-risk code and SEO review report exists in `reports/LOW_RISK_CODE_SEO_REVIEW_2026-06-06.md`.
- [ ] After the latest deploy, click `IndexNow` in `/admin/analytics` and confirm the JSON response.
- [ ] Submit `https://video.cozyguidehub.com/sitemap.xml` to Google Search Console.
- [ ] Submit the same sitemap to Bing Webmaster Tools.
- [ ] Submit the homepage and template pages to AI tool directories.
- [ ] Keep first indexed release English-only until translated pages are fully written.

## 7. Public Pages

- [x] Homepage explains what the site does, who it is for, and how credits work.
- [x] Homepage links to photo quality, distortion, cost, ecommerce, pet, and old-photo guides from a visible resource section.
- [x] Template pages have one clear H1, FAQ schema, and a CTA back to the generator.
- [x] Guide pages explain photo quality, distortion reduction, and cost.
- [x] Second-wave guide pages cover ecommerce, pet, and old-photo use cases.
- [x] Privacy, Terms, and Refund pages are visible from the footer.
- [x] Refund page explains failed technical jobs, imperfect successful outputs, and support-request details.
- [x] `support@cozyguidehub.com` test message was received through Cloudflare Email Routing in the monitored Gmail inbox on 2026-06-07.
- [x] Resend verified `cozyguidehub.com` for outbound email, and Gmail sent a successful test as `MotionPic AI Support <support@cozyguidehub.com>`.
- [x] Gmail is configured to reply from the same address that received the message.
- [x] Public inbound MX, DKIM, return-path MX, SPF, and DMARC records pass `npm run email:dns`.

## 8. First Promotion Wave

- [x] Product Hunt draft.
- [ ] Toolify submission.
- [ ] Futurepedia submission.
- [ ] There Is An AI For That submission.
- [x] Indie Hackers build-in-public draft.
- [x] X/Twitter short launch thread draft.
- [x] Reddit draft focused on lessons learned, not hard selling.
- [ ] Xiaohongshu/TikTok/YouTube Shorts demo clip.
- [x] Launch kit contains guarded copy blocks, UTM links, launch gates, and unpublished social drafts.
- [x] Demo asset checklist records Stage 1 Good outputs as private candidate demos.
- [x] At least 3 Stage 1 Good output files are preserved privately outside expiring provider URLs.

## 9. First Revenue Goal

- [ ] Keep the first paid test small.
- [ ] Watch `/admin/ops` after every payment.
- [ ] Save the first successful paid order ID.
- [ ] Confirm the first real user can spend credits and receive a usable video.
- [ ] Write a short post about earning the first 1 RMB/USD from MotionPic AI.
