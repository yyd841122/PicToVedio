# MotionPic AI TODO

Last updated: 2026-06-02

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
- [x] Added multilingual UI entry for EN/ZH/DE/IT/FR/ES/JA/KO.
- [x] Replaced internal demand-analysis copy with user-facing product copy.
- [x] Added SEO metadata, Open Graph, Twitter Card, JSON-LD, robots.txt, sitemap.xml, and 404.html.
- [x] Added project history, TODO, roadmap, SEO/GEO, and promotion copy documents.
- [x] Connected DashScope image-to-video generation on Render.
- [x] Ran real DashScope image-to-video generation successfully.
- [x] Reduced default generation cost by disabling audio.
- [x] Changed the default template and prompts toward lower-distortion portrait motion.
- [x] Added unit economics notes for credit pricing and margins.
- [x] Enforced server-side credit pricing for real generation requests.
- [x] Added optional Cloudflare R2 adapter for uploaded images and generated videos.
- [x] Replaced shared `demo-user` traffic with browser-based anonymous user IDs.
- [x] Added Privacy Policy, Terms of Service, Refund Policy, and footer contact links.
- [x] Added first SEO template pages for AI Kiss Video, Product Video Ad, Pet Animation, and Old Photo Alive.
- [x] Kept legal pages and template landing pages English-only to avoid partial-translation confusion.
- [x] Added analytics event tracking for page views, uploads, generation, checkout, and paid credit grants.
- [x] Added private analytics summary endpoint and Supabase `analytics_events` schema.
- [x] Added private ops dashboard for users, credits, payments, video jobs, ledger, and webhooks.
- [x] Added private ops cost/refund signals for estimated DashScope spend and credit refunds.
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

## In Progress

- [ ] Prepare the site for real video generation.
- [x] Decide the first real video API provider: Alibaba Cloud Model Studio / Bailian DashScope.
- [x] Configure Render with `DASHSCOPE_API_KEY` and switch `VIDEO_PROVIDER=dashscope`.
- [ ] Decide object storage provider.
- [ ] Create Cloudflare R2 bucket and access keys.
- [ ] Keep Creem in test mode until real generation works.
- [x] Build the first SEO/GEO content layer around the homepage and templates.

## Next: P0

- [x] Add a provider adapter for DashScope.
- [x] Support DashScope job creation and status polling.
- [x] Normalize job states: `queued`, `processing`, `succeeded`, `failed`.
- [x] Default DashScope output to silent video and identity-preserving prompts to reduce cost and distortion.
- [x] Run one real DashScope image-to-video test.
- [x] Revise first-pass credit economics before charging real users.
- [x] Revisit visible Creem package amounts before switching to live mode.
- [ ] Edit Creem product descriptions and Render credit pack variables together before live mode.
- [ ] Tune `ESTIMATED_VIDEO_COST_CNY` after more real DashScope generations.
- [ ] Store uploaded photos outside the browser and local JSON.
- [ ] Store generated videos in object storage.
- [x] Replace `demo-user` with anonymous device IDs.
- [x] Bind credits to each anonymous user ID.
- [x] Add safe credit refund behavior when real generation fails.
- [ ] Switch Creem from test to live only after real generation succeeds.
- [ ] Create a low-price live product for first live payment testing.

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
- [x] Check `/llms.txt` after deploy and keep it aligned with new public pages.
- [x] Prepare copy-and-paste submission fields for AI tool directories and launch communities.
- [ ] Prepare Baidu submission if targeting Chinese search.

## Later: P2

- [ ] Add email login.
- [ ] Add account page.
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
- [ ] Final brand name confirmation if changing away from MotionPic AI.
