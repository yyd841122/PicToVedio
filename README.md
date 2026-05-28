# MotionPic AI

MotionPic AI is a publishable MVP for an AI photo-to-video generator. It lets users upload a photo, choose a short-video template, estimate credits, and upgrade through a Creem test checkout flow.

The current build is intentionally lightweight: a static front end plus a zero-dependency Node.js server. Video generation runs in mock mode by default, so payment, credits, deployment, and product flow can be tested before spending money on model APIs.

## Features

- Photo upload UI with click and drag-and-drop support
- Template selection for creator, commerce, and emotional use cases
- Aspect ratio and quality controls
- Credit cost estimates and demo account balance
- Generation history and mock video jobs
- Creem checkout integration for credit packs
- Creem webhook endpoint for paid credit top-ups
- Webhook event deduplication
- Credit ledger entries for top-ups
- UI language switcher for English, Chinese, German, Italian, French, Spanish, Japanese, and Korean
- SEO alternate links for multilingual launch URLs
- SEO metadata, Open Graph, Twitter Card, JSON-LD, robots.txt, sitemap.xml, and custom 404 page
- Privacy Policy, Terms of Service, Refund Policy, and footer contact links
- SEO template landing pages for AI Kiss Video, Product Video Ad, Pet Animation, and Old Photo Alive
- OpenAI video provider adapter placeholder
- Render deployment config
- Cloudflare custom domain deployment guide
- Project history, roadmap, SEO/GEO plan, and promotion copy documents

## Tech Stack

- Front end: plain HTML, CSS, and JavaScript
- Back end: Node.js `http` server
- Payments: Creem checkout and webhook support
- Deployment target: Render + Cloudflare DNS
- Data storage: local JSON for development, Supabase/Postgres for deployed credits

## Local Setup

Copy the Creem test template:

```bash
copy .env.creem.test.example .env
```

Paste your Creem API key into `.env`:

```env
CREEM_API_KEY=your_creem_api_key
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:8787
```

## Environment Variables

Required for Creem test checkout:

```env
APP_URL=http://localhost:8787
VIDEO_PROVIDER=mock
DATA_PROVIDER=file
PAYMENT_PROVIDER=creem
CREEM_TEST_MODE=true
CREEM_API_KEY=
CREEM_PRODUCT_CREATOR=prod_6Wza18GtJN57ME1FXSed2I
CREEM_PRODUCT_COMMERCE=prod_6YcTIRCZNVrZzwYXYqyKrH
CREEM_WEBHOOK_SECRET=
```

Required on Render after creating Supabase:

```env
DATA_PROVIDER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional for real video generation later:

```env
DASHSCOPE_API_KEY=
DASHSCOPE_VIDEO_MODEL=wan2.6-i2v-flash
DASHSCOPE_AUDIO=false
OPENAI_API_KEY=
OPENAI_VIDEO_MODEL=sora-2
```

To enable Alibaba Cloud Model Studio / Bailian image-to-video on Render:

```env
VIDEO_PROVIDER=dashscope
DASHSCOPE_API_KEY=sk-...
DASHSCOPE_VIDEO_MODEL=wan2.6-i2v-flash
DASHSCOPE_AUDIO=false
```

DashScope image-to-video jobs are async. MotionPic stores the returned `task_id`, polls `/api/v1/tasks/{task_id}`, and maps provider statuses to `queued`, `processing`, `succeeded`, or `failed`. MotionPic defaults to silent video generation with `DASHSCOPE_AUDIO=false` to reduce cost. If a provider request fails, credits are refunded through the ledger.

Optional for Cloudflare R2 object storage:

```env
STORAGE_PROVIDER=r2
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=motionpic-assets
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://assets.example.com
```

When R2 is enabled, uploaded photos are saved under `uploads/{userId}/{jobId}` and generated videos are copied under `outputs/{userId}/{jobId}.mp4`. If a public R2 URL is configured, MotionPic also passes that image URL to the video provider instead of a browser data URL.

## Credit Packs

- Creator Pack: `$9` for `100 credits`
- Commerce Pack: `$29` for `400 credits`

Current generation credit rules:

- 4s / 720p: `2 credits`
- 4s / 1080p: `4 credits`
- 4s / Pro: `6 credits`
- 8s uses 2x the base cost.
- 12s uses 3x the base cost.
- High-risk creative templates such as `Couple Kiss` add `1 credit`.

The server recalculates the credit cost for each generation request. It does not trust the `credits` value sent by the browser.

## Anonymous Users

MotionPic creates a browser-local anonymous user id such as `mp_...` and sends it with API requests in the `X-MotionPic-User-ID` header. Credits, payments, and generation jobs are bound to this id, so visitors no longer share a single `demo-user` balance. The old `demo-user` fallback remains only for old local tests and requests that do not send a valid anonymous id.

## Multilingual URLs

```text
/?lang=en
/?lang=zh
/?lang=de
/?lang=it
/?lang=fr
/?lang=es
/?lang=ja
/?lang=ko
```

The selector stores the visitor's language locally and updates page title, description, hero, tool, pricing, use cases, FAQ, and checkout copy.

Legal pages and template landing pages are intentionally English-only in this first stage to avoid misleading visitors with partial translations. Fully translated legal and template pages can be added later as dedicated SEO pages.

## Deployment

The current deployment plan is:

```text
Render Web Service -> Cloudflare CNAME -> video.cozyguidehub.com
```

See [DEPLOY.md](./DEPLOY.md) for the full Render, Cloudflare, and Creem webhook setup.

Before switching Render to `DATA_PROVIDER=supabase`, open Supabase SQL Editor and run [supabase.sql](./supabase.sql). Then add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Render Environment and redeploy.

Before taking real payments, switch Creem from test mode to live mode in Render by setting `CREEM_TEST_MODE=false`, replacing the product ids, API key, and webhook secret with live Creem values, then paying a small live test order.

## Project Documents

- [PROJECT_HISTORY.md](./PROJECT_HISTORY.md): from-zero project history and current state.
- [TODO.md](./TODO.md): completed work and remaining P0/P1/P2 tasks.
- [ROADMAP_PLAN.md](./ROADMAP_PLAN.md): milestone plan from MVP to real launch.
- [SEO_GEO_PROMOTION_PLAN.md](./SEO_GEO_PROMOTION_PLAN.md): SEO, GEO, and promotion execution plan.
- [PROMOTION_COPY.md](./PROMOTION_COPY.md): reusable launch and advertising copy.
- [UNIT_ECONOMICS.md](./UNIT_ECONOMICS.md): provider cost, credit pricing, and live-payment margin notes.

## Legal Pages

- `/privacy`: privacy policy for uploads, generated assets, payments, and support data.
- `/terms`: service terms for uploads, AI output, credits, payments, and acceptable use.
- `/refund`: refund policy for credit packs, failed jobs, and duplicate payments.

The footer currently uses `support@cozyguidehub.com` as the public support email. Replace it before launch if you prefer another address.

## SEO Template Pages

- `/templates/ai-kiss-video`
- `/templates/product-video-ad`
- `/templates/pet-animation`
- `/templates/old-photo-alive`

These pages give the first long-tail keywords dedicated entry points for search engines, AI search, and directory submissions.

## Important Notes

- Do not commit `.env`; it is ignored by `.gitignore`.
- `data/db.json` is a demo database and is ignored.
- Use `VIDEO_PROVIDER=mock` while validating checkout and webhook behavior.
- Use `VIDEO_PROVIDER=dashscope` after adding `DASHSCOPE_API_KEY` to Render.
- Use Supabase/Postgres on Render before real traffic so paid credits survive restarts and redeploys.
- Store uploaded photos and generated videos in Cloudflare R2/S3 before real traffic.
- Keep webhook event ids and payment ids durable; they prevent duplicate credit grants when providers retry webhooks.

## Scripts

```bash
npm run dev
npm start
```
