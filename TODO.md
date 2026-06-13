# FrameVela AI TODO

Last updated: 2026-06-13

## Done

- [x] Picked product direction: AI Photo to Video Generator.
- [x] Built the first product page and generator UI.
- [x] Added mock video generation flow.
- [x] Added credit balance and credit cost estimates.
- [x] Added Creator Pack and Commerce Pack pricing.
- [x] Created GitHub repository.
- [x] Deployed to Render.
- [x] Connected Cloudflare custom domain.
- [x] Connected Creem test checkout.
- [x] Added Creem webhook endpoint.
- [x] Added webhook signature verification.
- [x] Added Supabase schema and credit persistence.
- [x] Verified Creem test payment updates Supabase credits.
- [x] Sanitized payment return-query identifiers from new and historical analytics dashboard views.
- [x] Added read-only stale-processing diagnostics to `/admin/ops` without provider calls or database changes.
- [x] Added multilingual UI entry for EN/ZH/DE/IT/FR/ES/JA/KO.
- [x] Replaced internal demand-analysis copy with user-facing product copy.
- [x] Added SEO metadata, Open Graph, Twitter Card, JSON-LD, robots.txt, sitemap.xml, and 404.html.
- [x] Added project history, TODO, roadmap, SEO/GEO, and promotion copy documents.
- [x] Connected DashScope image-to-video generation on Render.
- [x] Ran real DashScope image-to-video generation successfully.
- [x] Reduced default generation cost by disabling audio.
- [x] Changed the default template and prompts toward lower-distortion portrait motion.
- [x] Disabled DashScope prompt expansion by default and added stronger identity/object guardrails to reduce distortion.
- [x] Added unit economics notes for credit pricing and margins.
- [x] Enforced server-side credit pricing for real generation requests.
- [x] Added optional Cloudflare R2 adapter for uploaded images and generated videos.
- [x] Replaced shared `demo-user` traffic with browser-based anonymous user IDs.
- [x] Added Privacy Policy, Terms of Service, Refund Policy, and footer contact links.
- [x] Added first SEO template pages for AI Kiss Video, Product Video Ad, Pet Animation, and Old Photo Alive.
- [x] Kept legal pages and template landing pages English-only to avoid partial-translation confusion.
- [x] Added analytics event tracking for page views, uploads, generation, checkout, and paid credit grants.
- [x] Added generation result feedback tracking for usable vs distorted outputs.
- [x] Added private analytics summary endpoint and Supabase `analytics_events` schema.
- [x] Added result-feedback quality metrics to the private analytics dashboard.
- [x] Added UTM/channel attribution tracking for launch links and promotion sources.
- [x] Added private ops dashboard for users, credits, payments, video jobs, ledger, and webhooks.
- [x] Added private ops cost/refund signals for estimated DashScope spend and credit refunds.
- [x] Hardened Supabase SQL defaults by enabling RLS and revoking direct `anon` / `authenticated` table access.
- [x] Added `SUPABASE_SECURITY_FIX.sql` for clearing Supabase public-access security warnings.
- [x] Ran the Supabase live security fix SQL successfully in the production Supabase SQL Editor.
- [x] Added `SUPABASE_ADVISOR_CONFIRMATION_GUIDE.md` for the final Supabase warning re-check.
- [x] Added template page deep links that preselect the matching generator template.
- [x] Added FAQPage and BreadcrumbList schema to template SEO pages.
- [x] Blocked admin and API surfaces from search indexing.
- [x] Removed the misleading language selector and consolidated the first indexed release around English canonical URLs.
- [x] Added first SEO guide pages for photo quality, distortion reduction, and generation cost.
- [x] Centralized credit pack amounts and price labels behind Render environment variables.
- [x] Rewrote homepage source copy to English for SEO and no-JS visitors.
- [x] Added photo quality guidance near upload to reduce distorted generations and wasted credits.
- [x] Fixed SEO guide and template CTAs to jump directly to the generator.
- [x] Added `llms.txt` for GEO and AI-search discovery.
- [x] Added a production launch checklist for payment, SEO, storage, and first-revenue validation.
- [x] Rebuilt promotion copy with clean English and Chinese launch snippets.
- [x] Added search engine submission guide and directory submission pack.
- [x] Added second-wave SEO guide pages for ecommerce product videos, pet photo animation, and old photo animation.
- [x] Added protected IndexNow submission endpoint and public verification file.
- [x] Added visible homepage resource links to the SEO guide pages.
- [x] Reset stale generated-video state when a user uploads a new photo.
- [x] Added first-revenue operating playbook for the live-payment transition.
- [x] Added a `/guides` hub page and directory-index serving for SEO guide discovery.
- [x] Added a Cloudflare R2 setup guide for deferred object-storage setup.
- [x] Added an anonymous `/account` page for credits, credit ledger history, and recent video jobs.
- [x] Added real-provider daily generation caps before credit deduction.
- [x] Added user-friendly generation API error codes for low credits, unsuitable images, busy providers, and daily quota limits.
- [x] Rechecked public sitemap coverage and normalized guide page Article/Breadcrumb/FAQ schema.
- [x] Replaced misleading free-preview copy with starter/current-credit copy on the homepage.
- [x] Added daily real-generation cap visibility to the private ops dashboard.
- [x] Added JPG/PNG/WebP and upload-size validation before credit deduction.
- [x] Added public download-soon guidance while long-term object storage is deferred.
- [x] Added storage provider, upload limit, and unit-cost visibility to the private ops dashboard.
- [x] Tightened low-motion template prompts and DashScope guardrails for faces, pets, products, and old photos.
- [x] Completed Stage 1 real-generation smoke tests for Product Motion, Pet Motion, Old Photo Alive, and Natural Portrait with owner-reported Good results.
- [x] Added configurable `STARTER_CREDITS` so anonymous free generation can be reduced before public promotion.
- [x] Added disabled-by-default Supabase Auth magic-link login scaffolding with browser-account merge.
- [x] Added a local smoke test for key pages, account API, checkout login gating, ops preflight, and inline scripts.
- [x] Added a local readiness classifier that separates low-risk status, blockers, and owner-required live-launch work without printing secrets.
- [x] Corrected homepage upload and option-group labels after owner browser-console UAT.
- [x] Replaced the temporary favicon with the owner-supplied legacy MotionPic AI logo set.
- [x] Replaced the visible navigation logo with a temporary text-based FrameVela `F` mark.
- [ ] Replace the legacy M favicon/PWA assets with owner-approved FrameVela artwork.
- [x] Added baseline browser security headers and disabled caching for JSON API responses.
- [x] Synced the local readiness report with the confirmed support inbox, outbound sender, and public email DNS status.
- [x] Added an end-to-end local mock test for failed-job debit, automatic refund, restored balance, and refund idempotency.
- [x] Updated `/account` copy so released email login is no longer described as a future feature.
- [x] Added current support, private Demo preservation, and local refund-test status to `/launch-kit`.
- [x] Restricted checkout return URLs and email-login callbacks to the configured FrameVela origin.
- [x] Drafted the Supabase atomic paid-credit RPC SQL and added local static checks without executing production SQL.
- [x] Staged backend payment-RPC integration behind a default-off environment flag.

## In Progress

- [x] Prepare the site for real video generation.
- [x] Decide the first real video API provider: Alibaba Cloud Model Studio / Bailian DashScope.
- [x] Configure Render with `DASHSCOPE_API_KEY` and switch `VIDEO_PROVIDER=dashscope`.
- [ ] Decide object storage provider.
- [ ] Create Cloudflare R2 bucket and access keys.
- [x] Re-run the Supabase Security Advisor and confirm 0 errors; retain the intentional server-only `RLS Enabled No Policy` info items.
- [x] Keep Creem in test mode until Stage 1 real generation works.
- [x] Keep Creem in test mode until owner approves the controlled live-payment switch.
- [x] Decide launch access policy: open browsing/upload with low starter credits, require email login before paid checkout, and keep larger promotion gated on live-payment readiness.
- [x] Build the first SEO/GEO content layer around the homepage and templates.

## Next: P0

- [x] Add a provider adapter for DashScope.
- [x] Support DashScope job creation and status polling.
- [x] Normalize job states: `queued`, `processing`, `succeeded`, `failed`.
- [x] Default DashScope output to silent video and identity-preserving prompts to reduce cost and distortion.
- [x] Run one real DashScope image-to-video test.
- [x] Revise first-pass credit economics before charging real users.
- [x] Revisit visible Creem package amounts before switching to live mode.
- [x] Align Creem test product descriptions and Render credit-pack variables at `40 / 160`.
- [x] Receive conditional Creem category guidance: generally acceptable if buyer data is not saved, subject to KYC/KYB.
- [x] Send Creem the current limited transaction-reference and Supabase Auth email boundary for clarification.
- [x] Creem confirmed the current limited payment/event references and Supabase Auth email boundary satisfy its buyer-data condition.
- [ ] Repeat the product-id, description, and Render-variable alignment only after KYC/KYB and actual live-mode activation.
- [ ] Prepare, owner-approve, and apply the Supabase atomic paid-credit RPC before any live payment test.
- [x] Confirm actual Alibaba Cloud / DashScope bill cost for the completed Stage 1 generations: CNY 0.60 per use.
- [x] Keep `ESTIMATED_VIDEO_COST_CNY=0.6` as the current planning value after owner cost confirmation.
- [ ] Re-check `ESTIMATED_VIDEO_COST_CNY` after more real DashScope generations, 1080p tests, 8-second tests, or audio-on tests.
- [x] Chose the controlled-live pricing path: `$9 / 40 credits` and `$29 / 160 credits`, with `10 / 2` daily generation caps.
- [ ] Run at least 20 real quality tests and track good vs distorted outputs in the analytics dashboard.
- [ ] Store uploaded photos outside the browser and local JSON.
- [ ] Store generated videos in object storage.
- [ ] Follow `R2_SETUP_GUIDE.md` when enabling Cloudflare R2 in Render.
- [x] Replace `demo-user` with anonymous device IDs.
- [x] Bind credits to each anonymous user ID.
- [x] Add safe credit refund behavior when real generation fails.
- [x] Add conservative daily real-generation limits with `MAX_DAILY_VIDEO_JOBS` and `MAX_DAILY_VIDEO_JOBS_PER_USER`.
- [x] Return `429` without deducting credits when daily generation caps are reached.
- [x] Reject unsupported or oversized input images before creating jobs or deducting credits.
- [x] Add private `/admin/ops` live-payment preflight checks for Auth, Creem, pricing, caps, and storage.
- [ ] Switch Creem from test to live only after data-boundary clarification, KYC/KYB, actual live activation, and explicit owner confirmation.
- [ ] Create a low-price live product for first live payment testing.
- [x] Set the default anonymous starter balance to `STARTER_CREDITS=2`.

## Next: P1

- [x] Add Privacy Policy.
- [x] Add Terms of Service.
- [x] Add Refund Policy.
- [x] Add contact email in footer.
- [x] Add analytics events:
  - Page view.
  - Upload.
  - Generate click.
  - Job success.
  - Job failure.
  - Checkout click.
  - Checkout success.
- [x] Add SEO landing pages for:
  - AI Kiss Video.
  - Product Video Ad.
  - Pet Animation.
  - Old Photo Alive.
- [x] Add FAQ and comparison copy to each template page.
- [x] Add structured FAQ and breadcrumb schema to each template page.
- [x] Let template SEO pages open the generator with the matching template selected.
- [ ] Create fully translated legal and template pages for EN/ZH/DE/IT/FR/ES/JA/KO.
- [ ] Submit sitemap to Google Search Console and Bing Webmaster Tools.
- [x] Add protected IndexNow submit helper for sitemap URLs.
- [x] Check `/llms.txt` after deploy and keep it aligned with new public pages.
- [x] Add a guide hub so crawler and AI-search entry points are not only individual articles.
- [x] Prepare copy-and-paste submission fields for AI tool directories and launch communities.
- [x] Add an internal `/launch-kit` page with directory links, UTM links, and reusable launch copy.
- [x] Recheck local JSON-LD syntax and sitemap coverage for public SEO pages.
- [x] Prepare Baidu submission checklist if targeting Chinese search.
- [x] Add durable email login before larger promotion so purchases and credits are not tied only to browser storage.
- [x] Configure Supabase Auth redirect URL and Render `SUPABASE_AUTH_ANON_KEY` before exposing `/login` publicly.
- [x] Show login/account state on the homepage and require email login before paid checkout when Auth is configured.

## Later: P2

- [x] Add email login.
- [x] Add account page.
- [x] Add admin view for payments and generation jobs.
- [ ] Add A/B tests for hero copy and pricing.
- [ ] Add referral or watermark-sharing growth loop.
- [ ] Publish blog posts around photo-to-video use cases.
- [x] Publish first static guide pages around photo-to-video use cases.
- [ ] Submit to AI tool directories.
- [ ] Launch on Product Hunt.
- [ ] Post build-in-public updates on Indie Hackers and X.
- [ ] Create short demo videos for TikTok, YouTube Shorts, and Xiaohongshu.

## Blocked By User Input

- [x] Real video API key.
- [ ] Object storage account and access keys.
- [ ] Creem live API key, live product IDs, and live webhook signing secret.
- [x] Public contact email placeholder.
- [x] Confirmed the public brand name `FrameVela AI` on 2026-06-13 after an exact-name conflict review.
- [ ] Rename the two Creem test products from MotionPic AI to FrameVela AI before resuming KYC/KYB.
- [ ] Update the Gmail sender display name from MotionPic AI Support to FrameVela AI Support.
