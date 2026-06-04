# MotionPic AI First Revenue Playbook

Last updated: 2026-06-04

This playbook is the final operating checklist for turning the current working test product into a small live product that can earn the first real paid order.

## Current Position

MotionPic AI already has:

- A public English homepage at `https://video.cozyguidehub.com`.
- Real DashScope image-to-video generation.
- Credit accounting in Supabase.
- Creem test checkout and webhook credit grants.
- Private analytics and ops dashboards.
- SEO pages, guide pages, sitemap, robots.txt, and llms.txt.

The product is close to a live test, but should not switch to real paid traffic until pricing, storage, and live Creem settings are aligned.

## Current Safety Guardrails

MotionPic now has conservative cost protection for real video generation:

- `MAX_DAILY_VIDEO_JOBS`: sitewide real jobs per UTC day. Default: `20`.
- `MAX_DAILY_VIDEO_JOBS_PER_USER`: real jobs per anonymous user per UTC day. Default: `3`.
- If a cap is reached, the API returns `429` and does not deduct credits.
- Mock jobs do not count toward the caps, so local testing can continue without spending provider budget.

Keep these caps conservative until the first live payment and first user-generated videos are reviewed.

## First Revenue Definition

The first revenue milestone is complete when all of these are true:

- A real customer or controlled live test pays through Creem live mode.
- Supabase records the payment, webhook event, and credit ledger entry.
- The buyer's credit balance persists after refresh.
- The buyer spends credits on a real DashScope generation.
- The output video can be opened after the generation finishes.
- `/admin/ops` shows the payment, job, cost estimate, and ledger movement.

## Pre-Live Product Checks

Before switching Creem live:

- Run 5 to 10 real generations across portrait, product, pet, old photo, and romantic templates.
- Record average cost in `UNIT_ECONOMICS.md`.
- Confirm the default 4s / 720p generation costs 2 credits.
- Confirm failed provider jobs refund credits.
- Confirm successful jobs appear in `/admin/ops`.
- Confirm new uploads clear stale generated output state.
- Confirm analytics records upload, generate, success, download, checkout click, and checkout redirect.

## Pricing Decision

Keep the first live pricing simple.

Recommended safer first live packages:

- Starter: US$9 for 40 credits.
- Creator: US$19 for 120 credits.
- Commerce: US$49 for 400 credits.

If keeping the current US$9 Creator Pack:

- Keep Creator Pack at 100 credits only if the normal 4s / 720p generation costs at least 2 credits.
- Keep 1080p and Pro outputs at higher credit costs.
- Do not advertise unlimited retries.
- Tell users that AI results can vary.

## Creem Live Switch

Owner actions required:

- Finish Creem live store verification.
- Create live Creator Pack and Commerce Pack products.
- Create a live webhook for `https://video.cozyguidehub.com/api/creem/webhook`.
- Copy the live API key, live product IDs, and live webhook signing secret.

Render environment changes that need owner confirmation:

- Replace test `CREEM_API_KEY` with the live key.
- Replace `CREEM_PRODUCT_CREATOR` and `CREEM_PRODUCT_COMMERCE` with live product IDs.
- Replace `CREEM_WEBHOOK_SECRET` with the live webhook signing secret.
- Set `CREEM_TEST_MODE=false`.
- Update `CREATOR_PACK_CREDITS`, `COMMERCE_PACK_CREDITS`, `CREATOR_PACK_PRICE_LABEL`, and `COMMERCE_PACK_PRICE_LABEL` so the website and Creem checkout match.
- Click `Save, rebuild, and deploy`.

Recommended first live settings:

```env
CREEM_TEST_MODE=false
CREATOR_PACK_CREDITS=40
COMMERCE_PACK_CREDITS=160
CREATOR_PACK_PRICE_LABEL=$9
COMMERCE_PACK_PRICE_LABEL=$29
MAX_DAILY_VIDEO_JOBS=10
MAX_DAILY_VIDEO_JOBS_PER_USER=2
```

Use the existing 100 / 400 credit packs only if the live Creem product descriptions still say 100 / 400 credits and you want the stronger marketing offer. At the current 2 credits per standard generation, US$9 / 100 credits is roughly 50 standard 4s / 720p generations, so it is not immediately loss-making at the current observed cost, but it leaves less buffer for retries, fees, support, and disliked outputs.

## What I Can Continue Without Owner Action

Low-risk work:

- Improve public copy, launch copy, and SEO guide content.
- Add more internal checklist detail.
- Improve frontend error states and photo-quality guidance.
- Add analytics labels and dashboard summaries.
- Prepare Render/Creem/Supabase step-by-step instructions.

Work that needs explicit owner confirmation:

- Change Render environment variables.
- Switch Creem to live mode.
- Create live Creem products or webhooks.
- Run Supabase SQL.
- Submit IndexNow, Google Search Console, Bing Webmaster Tools, paid directories, Product Hunt, Reddit, X, or Xiaohongshu posts.
- Make a live payment.
- Enable R2/OSS storage credentials.

## First Live Payment Test

Use a small live test before public promotion:

1. Open `https://video.cozyguidehub.com`.
2. Click `Buy credits`.
3. Complete payment through the live Creem checkout.
4. Return to the site and wait 5 to 10 seconds.
5. Refresh the page and confirm the credit balance remains increased.
6. Open `/admin/ops` and confirm payment, ledger, and webhook rows.
7. Generate one 4s / 720p video.
8. Open the output MP4.
9. Record provider cost and result quality.

Acceptance criteria:

- Checkout returns to the site successfully.
- Credits increase once, not twice.
- Refreshing the page keeps the new balance.
- `/admin/ops` shows one payment row, one webhook event row, and one positive credit ledger entry.
- The generated job deducts the expected credits.
- A failed job, if it happens, creates a `video-refund` ledger entry.
- The output is good enough to use as a demo or is marked as distorted through the feedback buttons.

## Storage Decision

Storage is not blocking the first controlled live test, but it is important before public traffic.

Preferred path:

- Create Cloudflare R2 bucket.
- Add R2 credentials to Render.
- Set `STORAGE_PROVIDER=r2`.
- Confirm uploaded photos and generated videos are stored outside the browser and remain available after refresh.

Until storage is enabled:

- DashScope output URLs may expire or become unavailable later.
- Do not promise long-term video hosting.
- Encourage users to download outputs after generation.

## Analytics To Watch

Open `/admin/analytics` after each test and check:

- Page View
- Upload Click
- Upload Success
- Generate Click
- Generation Job Created
- Generation Success
- Download Click
- Checkout Click
- Checkout Redirect

Open `/admin/ops` and check:

- User balance
- Recent video jobs
- Recent payments
- Recent webhooks
- Credit ledger net amount
- Estimated DashScope spend

## Promotion Gate

Do not start paid promotion until:

- Live payment has been tested once.
- At least 3 successful real videos are saved as examples.
- Pricing and credit grants match across homepage, Creem, Render, and webhook.
- Refund policy and support email are final.
- Object storage decision is made or the site clearly says users should download outputs.

## First Public Push

Start small:

- Post one build-in-public update on X or Indie Hackers.
- Submit one free directory listing, such as SaaSHub.
- Publish one short demo on Xiaohongshu or YouTube Shorts.
- Watch analytics and provider cost for 24 hours.

Only submit to larger paid directories after the first real customer workflow is stable.
