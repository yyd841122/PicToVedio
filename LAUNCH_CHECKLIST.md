# MotionPic AI Launch Checklist

Last updated: 2026-06-03

Use this checklist before moving from test mode to real public launch.

## 1. Production Health

- [x] Render latest deploy is live on `https://video.cozyguidehub.com`.
- [x] `/health` returns `{"ok":true,"provider":"dashscope"}`.
- [x] Owner UAT checklist is prepared in `OWNER_UAT_CHECKLIST.md`.
- [ ] Homepage loads without browser console errors.
- [ ] Upload, generate, download, and checkout clicks are tracked in analytics.
- [ ] `/admin/analytics` requires the private analytics token.
- [ ] `/admin/ops` requires the same private analytics session.

## 2. Video Generation

- [ ] Run at least 5 real DashScope generations with different photo types.
- [ ] Record average provider cost in `UNIT_ECONOMICS.md`.
- [ ] Confirm failed jobs refund credits.
- [ ] Confirm successful jobs create rows in `video_jobs`.
- [ ] Confirm `ESTIMATED_VIDEO_COST_CNY` in Render reflects the latest provider cost.
- [ ] Tune default prompts for less distortion before increasing traffic.

## 3. Credits And Pricing

- [ ] Confirm one 4-second 720p generation charges the intended credit amount.
- [ ] Update `CREATOR_PACK_CREDITS` and `COMMERCE_PACK_CREDITS` in Render before live payment.
- [ ] Update Creem product descriptions so checkout text matches Render credit grants.
- [ ] Keep enough gross margin after provider cost, Creem/payment fees, failed jobs, and support.
- [ ] Do one final Creem test payment and confirm credits persist after refresh.

## 4. Creem Live Payment

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
- [x] Create a search submission guide.
- [x] Create a directory submission pack.
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
- [ ] Support email is final and monitored.

## 8. First Promotion Wave

- [ ] Product Hunt draft.
- [ ] Toolify submission.
- [ ] Futurepedia submission.
- [ ] There Is An AI For That submission.
- [ ] Indie Hackers build-in-public post.
- [ ] X/Twitter short launch thread.
- [ ] Reddit post focused on lessons learned, not hard selling.
- [ ] Xiaohongshu/TikTok/YouTube Shorts demo clip.

## 9. First Revenue Goal

- [ ] Keep the first paid test small.
- [ ] Watch `/admin/ops` after every payment.
- [ ] Save the first successful paid order ID.
- [ ] Confirm the first real user can spend credits and receive a usable video.
- [ ] Write a short post about earning the first 1 RMB/USD from MotionPic AI.
