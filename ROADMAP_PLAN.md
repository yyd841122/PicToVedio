# MotionPic AI Roadmap Plan

This roadmap turns the current MVP into a real, searchable, payment-ready product.

## Milestone 1: Documentation Archive

Goal: make the project easy to resume and audit.

Deliverables:

- `PROJECT_HISTORY.md`
- `TODO.md`
- `ROADMAP_PLAN.md`
- `SEO_GEO_PROMOTION_PLAN.md`
- `PROMOTION_COPY.md`

Acceptance:

- A future implementer can understand what has been built.
- The remaining work is ordered by business risk.
- Setup, payment, SEO, and launch context are recorded.

## Milestone 2: Real Video Generation

Goal: replace mock output with a real image-to-video provider.

Default provider preference:

- Domestic API that supports easier recharge from China.
- Must support image-to-video, prompt, duration, aspect ratio, status polling, and output URL.

Implementation:

- Add provider configuration to Render.
- Add a provider adapter in the Node backend.
- Create provider jobs from `/api/video/jobs`.
- Poll provider status through `/api/video/jobs/:id`.
- Store provider job ID, status, output URL, and error.
- Refund or compensate credits when provider generation fails.

Acceptance:

- Uploading a real photo creates a real provider job.
- Credits are deducted once.
- A successful job shows a downloadable video URL.
- A failed job records an error and does not silently consume user value.

## Milestone 3: Object Storage

Goal: stop depending on browser data URLs or local files for production media.

Default choice:

- Cloudflare R2.

Alternatives:

- Alibaba Cloud OSS.
- Supabase Storage.

Implementation:

- Save uploaded image files to object storage.
- Pass stable image URLs to the video provider.
- Save generated video URLs and thumbnails.
- Keep signed or public-read URL policy explicit.

Acceptance:

- Uploaded images survive page refresh.
- Generated videos remain downloadable.
- Stored URLs are linked to `video_jobs`.

## Milestone 4: User Identity And Credits

Goal: prevent all visitors from sharing `demo-user`.

Phase 1:

- Create anonymous user ID in the browser.
- Persist it in local storage.
- Send it to account, checkout, and generation APIs.
- Bind Supabase credits to that ID.

Phase 2:

- Add email login.
- Allow users to recover credits across devices.

Acceptance:

- Different browsers have separate credit balances.
- Creem checkout credits return to the correct user ID.
- Refreshing does not lose credits.

## Milestone 5: Real Payments

Goal: earn the first real payment safely.

Keep test mode until:

- Real generation works.
- Credits persist.
- User identity works.
- Legal pages exist.

Live switch steps:

- Create live Creem products.
- Add live Creem API key to Render.
- Add live product IDs to Render.
- Set `CREEM_TEST_MODE=false`.
- Create live webhook.
- Add live webhook signing secret.
- Run one low-price live payment test.

Acceptance:

- Live checkout completes.
- `payments` records the live payment ID.
- `webhook_events` records the live event.
- `credit_ledger` records the credit top-up.
- `/api/account` shows the new balance after refresh.

## Milestone 6: SEO/GEO Growth Foundation

Goal: make search engines and AI search understand the site.

Implementation:

- Maintain unique TDK per page.
- Keep `robots.txt` and `sitemap.xml` updated.
- Add OG and Twitter tags for share previews.
- Add JSON-LD for homepage, FAQ, templates, and future video pages.
- Build template pages for the first four use cases.
- Add FAQ and comparison sections to important pages.

Acceptance:

- Homepage source contains crawlable core content.
- Sitemap returns 200.
- Robots returns 200.
- JSON-LD validates with no blocking errors.
- One template page can be submitted to Google Search Console.

## Milestone 7: Promotion And Feedback Loop

Goal: drive first users and learn which use case converts.

Channels:

- AI directories.
- Product Hunt.
- Indie Hackers.
- Hacker News Show HN.
- Reddit.
- X/Twitter.
- Xiaohongshu.
- TikTok and YouTube Shorts.

Acceptance:

- At least five launch posts or submissions are published.
- Each channel uses a tracking URL.
- Upload, generation, and checkout events are reviewed after each campaign.
- Winning templates are prioritized for SEO pages and ad creatives.
