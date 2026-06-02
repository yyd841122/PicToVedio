# MotionPic AI First Revenue Playbook

Last updated: 2026-06-02

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

User/account actions required:

- Finish Creem live store verification.
- Create live Creator Pack and Commerce Pack products.
- Create a live webhook for `https://video.cozyguidehub.com/api/creem/webhook`.
- Copy the live API key, live product IDs, and live webhook signing secret.

Render environment changes:

- Replace test `CREEM_API_KEY` with the live key.
- Replace `CREEM_PRODUCT_CREATOR` and `CREEM_PRODUCT_COMMERCE` with live product IDs.
- Replace `CREEM_WEBHOOK_SECRET` with the live webhook signing secret.
- Set `CREEM_TEST_MODE=false`.
- Update `CREATOR_PACK_CREDITS`, `COMMERCE_PACK_CREDITS`, `CREATOR_PACK_PRICE_LABEL`, and `COMMERCE_PACK_PRICE_LABEL` so the website and Creem checkout match.
- Click `Save, rebuild, and deploy`.

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
