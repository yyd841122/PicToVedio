# MotionPic AI TODO

Last updated: 2026-05-28

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

## In Progress

- [ ] Prepare the site for real video generation.
- [x] Decide the first real video API provider: Alibaba Cloud Model Studio / Bailian DashScope.
- [x] Configure Render with `DASHSCOPE_API_KEY` and switch `VIDEO_PROVIDER=dashscope`.
- [ ] Decide object storage provider.
- [ ] Create Cloudflare R2 bucket and access keys.
- [ ] Keep Creem in test mode until real generation works.
- [ ] Build the first SEO/GEO content layer around the homepage and templates.

## Next: P0

- [x] Add a provider adapter for DashScope.
- [x] Support DashScope job creation and status polling.
- [x] Normalize job states: `queued`, `processing`, `succeeded`, `failed`.
- [x] Default DashScope output to silent video and identity-preserving prompts to reduce cost and distortion.
- [x] Run one real DashScope image-to-video test.
- [x] Revise first-pass credit economics before charging real users.
- [ ] Revisit visible Creem package amounts before switching to live mode.
- [ ] Store uploaded photos outside the browser and local JSON.
- [ ] Store generated videos in object storage.
- [ ] Replace `demo-user` with anonymous device IDs.
- [ ] Bind credits to each anonymous user ID.
- [x] Add safe credit refund behavior when real generation fails.
- [ ] Switch Creem from test to live only after real generation succeeds.
- [ ] Create a low-price live product for first live payment testing.

## Next: P1

- [ ] Add Privacy Policy.
- [ ] Add Terms of Service.
- [ ] Add Refund Policy.
- [ ] Add contact email in footer.
- [ ] Add analytics events:
  - Page view.
  - Upload.
  - Generate click.
  - Job success.
  - Job failure.
  - Checkout click.
  - Checkout success.
- [ ] Add SEO landing pages for:
  - AI Kiss Video.
  - Product Video Ad.
  - Pet Animation.
  - Old Photo Alive.
- [ ] Add FAQ and comparison copy to each template page.
- [ ] Submit sitemap to Google Search Console and Bing Webmaster Tools.
- [ ] Prepare Baidu submission if targeting Chinese search.

## Later: P2

- [ ] Add email login.
- [ ] Add account page.
- [ ] Add admin view for payments and generation jobs.
- [ ] Add A/B tests for hero copy and pricing.
- [ ] Add referral or watermark-sharing growth loop.
- [ ] Publish blog posts around photo-to-video use cases.
- [ ] Submit to AI tool directories.
- [ ] Launch on Product Hunt.
- [ ] Post build-in-public updates on Indie Hackers and X.
- [ ] Create short demo videos for TikTok, YouTube Shorts, and Xiaohongshu.

## Blocked By User Input

- [x] Real video API key.
- [ ] Object storage account and access keys.
- [ ] Creem live API key, live product IDs, and live webhook signing secret.
- [ ] Public contact email.
- [ ] Final brand name confirmation if changing away from MotionPic AI.
