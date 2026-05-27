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
- OpenAI video provider adapter placeholder
- Render deployment config
- Cloudflare custom domain deployment guide

## Tech Stack

- Front end: plain HTML, CSS, and JavaScript
- Back end: Node.js `http` server
- Payments: Creem checkout and webhook support
- Deployment target: Render + Cloudflare DNS
- Demo database: local JSON file at `data/db.json`

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
PAYMENT_PROVIDER=creem
CREEM_TEST_MODE=true
CREEM_API_KEY=
CREEM_PRODUCT_CREATOR=prod_6Wza18GtJN57ME1FXSed2I
CREEM_PRODUCT_COMMERCE=prod_6YcTIRCZNVrZzwYXYqyKrH
CREEM_WEBHOOK_SECRET=
```

Optional for real video generation later:

```env
OPENAI_API_KEY=
OPENAI_VIDEO_MODEL=sora-2
```

## Credit Packs

- Creator Pack: `$9` for `100 credits`
- Commerce Pack: `$29` for `400 credits`

## Deployment

The current deployment plan is:

```text
Render Web Service -> Cloudflare CNAME -> video.cozyguidehub.com
```

See [DEPLOY.md](./DEPLOY.md) for the full Render, Cloudflare, and Creem webhook setup.

## Important Notes

- Do not commit `.env`; it is ignored by `.gitignore`.
- `data/db.json` is a demo database and is ignored.
- Use `VIDEO_PROVIDER=mock` while validating checkout and webhook behavior.
- Move users, credits, jobs, and payments to Supabase/Postgres before real traffic.
- Store uploaded photos and generated videos in Cloudflare R2/S3 before real traffic.
- Keep webhook event ids and payment ids durable; they prevent duplicate credit grants when providers retry webhooks.

## Scripts

```bash
npm run dev
npm start
```
