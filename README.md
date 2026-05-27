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
- OpenAI video provider adapter placeholder
- Render deployment config
- Cloudflare custom domain deployment guide

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
OPENAI_API_KEY=
OPENAI_VIDEO_MODEL=sora-2
```

## Credit Packs

- Creator Pack: `$9` for `100 credits`
- Commerce Pack: `$29` for `400 credits`

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

The selector stores the visitor's language locally and updates page title, description, hero, tool, pricing, demand, and checkout copy.

## Deployment

The current deployment plan is:

```text
Render Web Service -> Cloudflare CNAME -> video.cozyguidehub.com
```

See [DEPLOY.md](./DEPLOY.md) for the full Render, Cloudflare, and Creem webhook setup.

Before switching Render to `DATA_PROVIDER=supabase`, open Supabase SQL Editor and run [supabase.sql](./supabase.sql). Then add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Render Environment and redeploy.

Before taking real payments, switch Creem from test mode to live mode in Render by setting `CREEM_TEST_MODE=false`, replacing the product ids, API key, and webhook secret with live Creem values, then paying a small live test order.

## Important Notes

- Do not commit `.env`; it is ignored by `.gitignore`.
- `data/db.json` is a demo database and is ignored.
- Use `VIDEO_PROVIDER=mock` while validating checkout and webhook behavior.
- Use Supabase/Postgres on Render before real traffic so paid credits survive restarts and redeploys.
- Store uploaded photos and generated videos in Cloudflare R2/S3 before real traffic.
- Keep webhook event ids and payment ids durable; they prevent duplicate credit grants when providers retry webhooks.

## Scripts

```bash
npm run dev
npm start
```
