# MotionPic AI

MotionPic AI is a publishable MVP for an AI photo-to-video generator. It lets users upload a photo, choose a short-video template, estimate credits, and upgrade through a Creem test checkout flow.

The current build is intentionally lightweight: a static front end plus a zero-dependency Node.js server. Video generation runs in mock mode by default, so payment, credits, deployment, and product flow can be tested before spending money on model APIs.

## Features

- Photo upload UI with click and drag-and-drop support
- Template selection for creator, commerce, and emotional use cases
- Aspect ratio and quality controls
- Credit cost estimates and anonymous account balance
- Generation history and real or mock video jobs
- Creem checkout integration for credit packs
- Creem webhook endpoint for paid credit top-ups
- Webhook event deduplication
- Credit ledger entries for top-ups
- Lightweight analytics events for page views, uploads, generation, checkout, and paid credit grants
- Private analytics summary endpoint for checking recent conversion events
- SEO metadata, Open Graph, Twitter Card, JSON-LD, robots.txt, sitemap.xml, and custom 404 page
- `llms.txt` for GEO and AI-search discovery
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
ANALYTICS_ADMIN_TOKEN=
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

These visible pack amounts and backend credit grants can be configured without a code change:

```env
CREATOR_PACK_CREDITS=100
COMMERCE_PACK_CREDITS=400
CREATOR_PACK_PRICE_LABEL=$9
COMMERCE_PACK_PRICE_LABEL=$29
```

Keep these Render values aligned with the active Creem product descriptions before switching to live payments.

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

## Analytics

MotionPic records lightweight product events in `analytics_events`:

- `page_view`
- `upload_click`
- `upload_success`
- `generate_click`
- `generate_job_created`
- `generate_success`
- `generate_failed`
- `checkout_click`
- `checkout_redirect`
- `checkout_return_success`
- `payment_credit_granted`

Local development stores these events in `data/db.json`. Render/Supabase stores them in the `analytics_events` table. A private summary endpoint is available at:

```text
/api/admin/analytics?token=YOUR_ANALYTICS_ADMIN_TOKEN
```

For a readable internal dashboard, open:

```text
/admin/analytics?token=YOUR_ANALYTICS_ADMIN_TOKEN
```

The dashboard stores the token in an HttpOnly cookie and redirects to `/admin/analytics`, so future screenshots and refreshes do not expose the token in the URL. You can also open `/admin/analytics` and paste the token into the login form.

For business operations, open:

```text
/admin/ops
```

The ops dashboard uses the same protected cookie and shows recent users, credit balances, video jobs, payments, credit ledger entries, Creem webhook events, refund signals, and estimated DashScope provider cost.

Set `ESTIMATED_VIDEO_COST_CNY` in Render if the observed DashScope unit cost changes. The default is `0.6`, based on the current 4s / 720p / audio-off test cost. This is only an internal planning estimate and does not change the real provider bill.

If `ANALYTICS_ADMIN_TOKEN` is not set, the summary endpoint is only available from localhost. The public tracking endpoint is fire-and-forget from the browser, so failed analytics writes do not block upload, generation, or checkout.

## Language Strategy

The first indexed release is English-only. This avoids misleading visitors with a language selector while only some product, legal, template, and guide pages are translated.

When full translations are ready, add dedicated static SEO paths such as `/de/`, `/fr/`, `/es/`, `/ja/`, `/ko/`, and `/zh/` instead of relying on query-string translations.

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
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md): production launch, SEO submission, payment, and first-revenue checklist.
- [SEARCH_SUBMISSION_GUIDE.md](./SEARCH_SUBMISSION_GUIDE.md): Google, Bing, sitemap, and AI-search submission steps.
- [DIRECTORY_SUBMISSION_PACK.md](./DIRECTORY_SUBMISSION_PACK.md): copy-and-paste fields for AI tool directories and launch communities.

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

## SEO Guide Pages

- `/guides/best-photos-for-ai-video`
- `/guides/reduce-ai-video-distortion`
- `/guides/photo-to-video-cost`
- `/guides/ecommerce-product-video-ads`
- `/guides/pet-photo-animation`
- `/guides/old-photo-animation`

These guide pages answer practical questions around input quality, provider cost, distortion, ecommerce ads, pet clips, and old photo memories.

## AI Discovery

- `/llms.txt`: concise MotionPic AI context for AI search, answer engines, and directory reviewers.

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
