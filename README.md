# MotionPic AI

MotionPic AI is a publishable MVP for an AI photo-to-video generator. It lets users upload a photo, choose a short-video template, estimate credits, and upgrade through a Creem test checkout flow.

The current build is intentionally lightweight: a static front end plus a zero-dependency Node.js server. Video generation runs in mock mode by default, so payment, credits, deployment, and product flow can be tested before spending money on model APIs.

## Features

- Photo upload UI with click and drag-and-drop support
- Template selection for creator, commerce, and emotional use cases
- Aspect ratio and quality controls
- Credit cost estimates and browser-local account balance
- Generation history and real or mock video jobs
- Account page for browser-local credits, credit ledger entries, and video jobs
- Creem checkout integration for credit packs
- Creem webhook endpoint for paid credit top-ups
- Webhook event deduplication
- Credit ledger entries for top-ups
- Lightweight analytics events for page views, uploads, generation, checkout, and paid credit grants
- Private analytics dashboard for checking recent conversion events
- Private ops dashboard for checking users, credits, jobs, payments, refunds, and webhooks
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
DASHSCOPE_PROMPT_EXTEND=false
MAX_DAILY_VIDEO_JOBS=20
MAX_DAILY_VIDEO_JOBS_PER_USER=3
MAX_UPLOAD_IMAGE_MB=8
STARTER_CREDITS=2
OPENAI_API_KEY=
OPENAI_VIDEO_MODEL=sora-2
```

To enable Alibaba Cloud Model Studio / Bailian image-to-video on Render:

```env
VIDEO_PROVIDER=dashscope
DASHSCOPE_API_KEY=sk-...
DASHSCOPE_VIDEO_MODEL=wan2.6-i2v-flash
DASHSCOPE_AUDIO=false
DASHSCOPE_PROMPT_EXTEND=false
MAX_DAILY_VIDEO_JOBS=20
MAX_DAILY_VIDEO_JOBS_PER_USER=3
MAX_UPLOAD_IMAGE_MB=8
STARTER_CREDITS=2
```

DashScope image-to-video jobs are async. MotionPic stores the returned `task_id`, polls `/api/v1/tasks/{task_id}`, and maps provider statuses to `queued`, `processing`, `succeeded`, or `failed`. MotionPic defaults to silent video generation with `DASHSCOPE_AUDIO=false` to reduce cost. If a provider request fails, credits are refunded through the ledger.

Real provider jobs are protected by conservative daily caps:

- `MAX_DAILY_VIDEO_JOBS`: sitewide real video jobs per UTC day. Default: `20`.
- `MAX_DAILY_VIDEO_JOBS_PER_USER`: real video jobs per anonymous user per UTC day. Default: `3`.

Mock jobs do not count toward these caps. If a user exceeds a cap, `/api/video/jobs` returns `429` with a friendly quota message and does not deduct credits.

Input uploads are also guarded before credits are deducted:

- Supported image formats: JPG, PNG, and WebP.
- `MAX_UPLOAD_IMAGE_MB`: maximum uploaded image size. Default: `8`.

If an upload is unsupported or too large, `/api/video/jobs` returns `400` or `413` with a friendly message and does not deduct credits.

New anonymous browser accounts receive `STARTER_CREDITS` credits. The default is `2`, enough for one standard 4-second 720p test generation. Public visitors can still browse, upload, and choose templates without login, but provider-spending generation is not fully open to every anonymous browser session.

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

Until `STORAGE_PROVIDER=r2` is enabled, generated videos use the provider output URL. Those links may expire, so the public generator tells users to open or download useful outputs soon after generation.

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

MotionPic creates a browser-local user id such as `mp_...` and sends it with API requests in the `X-MotionPic-User-ID` header. Credits, payments, and generation jobs are bound to this browser account id, so visitors no longer share a single `demo-user` balance. The old `demo-user` fallback remains only for old local tests and requests that do not send a valid anonymous id.

Users can open `/account` from the homepage credit panel to view their current browser-local account ID, credit balance, recent credit ledger entries, and recent video generation jobs. This page is marked `noindex` and excluded from `robots.txt` because it is an account utility page, not a public SEO landing page.

This is not a full login system. Anonymous credits are low-friction for early testing, but users can lose access if they clear browser storage or switch devices. Before larger paid traffic, add email login or another durable account system so free credits, purchases, and generated outputs follow a real user account.

## Analytics

MotionPic records lightweight product events in `analytics_events`:

- `page_view`
- `upload_click`
- `upload_success`
- `generate_click`
- `generate_job_created`
- `generate_success`
- `generate_failed`
- `result_feedback`
- `checkout_click`
- `checkout_redirect`
- `checkout_return_success`
- `payment_credit_granted`

Local development stores these events in `data/db.json`. Render/Supabase stores them in the `analytics_events` table. A private summary endpoint is available at:

`result_feedback` is fired from the generation history after a completed clip. It records whether the user marked the output as usable or distorted, which helps compare templates, prompts, and provider costs. The private analytics dashboard summarizes these clicks as usable-output rate and template-level feedback, so quality tuning can be based on real user reactions rather than only provider success status.

Launch links with `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` are saved in the browser and attached to later product events. The private analytics dashboard shows Channel Attribution so launch work can compare which directories, communities, and social platforms create page views, uploads, generations, checkout redirects, and paid credits.

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

## Supabase Security

The browser must not connect to Supabase directly. All public pages call the Render backend, and the backend uses `SUPABASE_SERVICE_ROLE_KEY` to read and write data.

If Supabase sends warnings such as `rls_disabled_in_public` or `sensitive_columns_exposed`, run `SUPABASE_SECURITY_FIX.sql` in the Supabase SQL Editor. This migration:

- Enables Row Level Security on all MotionPic tables.
- Revokes direct `anon` and `authenticated` access to public tables, sequences, and functions.
- Keeps `service_role` access for the Render backend.

After running it, test:

```text
/health
/api/account
/admin/analytics
/admin/ops
```

Then re-run the Supabase security advisor or click Resolve issue in the warning email.

The ops dashboard uses the same protected cookie and shows recent users, credit balances, video jobs, payments, credit ledger entries, Creem webhook events, refund signals, daily real-generation caps, today's real-generation count, and estimated DashScope provider cost.

For copy-and-paste launch fields, directory submission links, community post drafts, and UTM tracking URLs, open:

```text
/launch-kit
```

This internal page is marked `noindex` and excluded from `robots.txt`. It contains public promotion copy only, not credentials.

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
- [PROVIDER_COST_SAMPLING_WORKSHEET.md](./PROVIDER_COST_SAMPLING_WORKSHEET.md): provider cost sampling rules, log fields, and pricing review gates.
- [FIRST_REVENUE_PLAYBOOK.md](./FIRST_REVENUE_PLAYBOOK.md): final live-payment, pricing, storage, and first-revenue operating checklist.
- [LIVE_PAYMENT_TEST_PROCEDURE.md](./LIVE_PAYMENT_TEST_PROCEDURE.md): controlled live-payment test procedure, acceptance criteria, and rollback options.
- [OWNER_UAT_CHECKLIST.md](./OWNER_UAT_CHECKLIST.md): owner acceptance checklist for public pages, dashboards, generation, payment, storage, support, and promotion.
- [LIVE_READINESS_REVIEW.md](./LIVE_READINESS_REVIEW.md): readiness review for live payments, generation quality, storage, and promotion gates.
- [GENERATION_TEST_PLAN.md](./GENERATION_TEST_PLAN.md): controlled real-generation test matrix, safety rules, and quality rubric.
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md): production launch, SEO submission, payment, and first-revenue checklist.
- [SEARCH_SUBMISSION_GUIDE.md](./SEARCH_SUBMISSION_GUIDE.md): Google, Bing, sitemap, and AI-search submission steps.
- [SEARCH_ENGINE_SUBMISSION_CHECKLIST.md](./SEARCH_ENGINE_SUBMISSION_CHECKLIST.md): operator checklist for Google, Bing, and IndexNow submissions.
- [BAIDU_SUBMISSION_CHECKLIST.md](./BAIDU_SUBMISSION_CHECKLIST.md): optional Baidu Search Resource Platform checklist for Chinese search targeting.
- [DIRECTORY_SUBMISSION_PACK.md](./DIRECTORY_SUBMISSION_PACK.md): copy-and-paste fields for AI tool directories and launch communities.
- [DIRECTORY_SUBMISSION_CHECKLIST.md](./DIRECTORY_SUBMISSION_CHECKLIST.md): operator checklist for directory, community, and Product Hunt submissions.
- [DEMO_ASSET_CHECKLIST.md](./DEMO_ASSET_CHECKLIST.md): screenshot and short-video asset checklist for directories and social launch posts.
- [SUPPORT_RESPONSE_TEMPLATES.md](./SUPPORT_RESPONSE_TEMPLATES.md): support reply templates for failed generations, distorted outputs, credits, payments, and privacy concerns.
- [R2_SETUP_GUIDE.md](./R2_SETUP_GUIDE.md): Cloudflare R2 setup steps for storing uploaded photos and generated videos.
- [STORAGE_SETUP_REVIEW_CHECKLIST.md](./STORAGE_SETUP_REVIEW_CHECKLIST.md): object-storage cutover review checklist, acceptance criteria, and rollback plan.
- [reports/PUBLIC_SEO_READINESS_CHECK_2026-06-03.md](./reports/PUBLIC_SEO_READINESS_CHECK_2026-06-03.md): public SEO metadata, JSON-LD, internal-link, and endpoint readiness report.
- [reports/PUBLIC_ENDPOINT_STATUS_2026-06-03.md](./reports/PUBLIC_ENDPOINT_STATUS_2026-06-03.md): public health, robots, sitemap, llms, IndexNow key, and social image endpoint status.
- [reports/OWNER_UAT_FEEDBACK_2026-06-03.md](./reports/OWNER_UAT_FEEDBACK_2026-06-03.md): owner-reported UAT results for admin protection and public page display.
- [reports/GENERATION_STAGE1_RESULTS_2026-06-04.md](./reports/GENERATION_STAGE1_RESULTS_2026-06-04.md): owner-reported Stage 1 generation smoke-test results and quota-blocked pet test note.

## Search Discovery Helpers

- `/indexnow-key.txt`: public IndexNow verification key.
- `/api/admin/indexnow`: protected admin endpoint that reads `sitemap.xml` and submits public URLs to IndexNow. Open it from the `IndexNow` button in `/admin/analytics` or `/admin/ops` after important public-page deploys.

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

- `/guides`
- `/guides/best-photos-for-ai-video`
- `/guides/reduce-ai-video-distortion`
- `/guides/photo-to-video-cost`
- `/guides/ecommerce-product-video-ads`
- `/guides/pet-photo-animation`
- `/guides/old-photo-animation`

These guide pages answer practical questions around input quality, provider cost, distortion, ecommerce ads, pet clips, and old photo memories. The `/guides` hub links the guide layer together for users, crawlers, and AI answer engines.

## AI Discovery

- `/llms.txt`: concise MotionPic AI context for AI search, answer engines, and directory reviewers.

## Important Notes

- Do not commit `.env`; it is ignored by `.gitignore`.
- `data/db.json` is a demo database and is ignored.
- Use `VIDEO_PROVIDER=mock` while validating checkout and webhook behavior.
- Use `VIDEO_PROVIDER=dashscope` after adding `DASHSCOPE_API_KEY` to Render.
- Use Supabase/Postgres on Render before real traffic so paid credits survive restarts and redeploys.
- Store uploaded photos and generated videos in Cloudflare R2/S3 before real traffic.
- Use [R2_SETUP_GUIDE.md](./R2_SETUP_GUIDE.md) when you are ready to enable object storage.
- Keep webhook event ids and payment ids durable; they prevent duplicate credit grants when providers retry webhooks.

## Scripts

```bash
npm run dev
npm start
```
