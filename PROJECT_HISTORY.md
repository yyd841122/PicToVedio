# MotionPic AI Project History

This document records how MotionPic AI was built from idea to the current deployed MVP.

## 2026-05-27: Idea And Market Direction

- Started from the idea of building a tool similar to AI image/video generator sites.
- Chose the product direction: AI Photo to Video Generator.
- Initial demand hypothesis:
  - Creators need fast short-video assets.
  - Ecommerce sellers need product images turned into video ads.
  - Couples, pet owners, and families may pay for emotional and shareable videos.
- Decided the site should validate:
  - Upload intent.
  - Preview generation intent.
  - No-watermark export intent.
  - Credit-pack payment intent.

## 2026-05-27: MVP Page

- Built the first MotionPic AI page with plain HTML, CSS, and JavaScript.
- Added:
  - Photo upload UI.
  - Template choices.
  - Motion prompt.
  - Aspect ratio and quality controls.
  - Credit balance display.
  - Price cards.
  - Mock generation history.
- Added a hero visual asset: `photo-to-video-hero.png`.

## 2026-05-27: Payment Provider Research

- Considered Stripe first, but personal payout access was blocked.
- Tried Lemon Squeezy, but payout setup required PayPal or unsupported bank options.
- Moved to Creem because it allowed an individual store setup and test payments.
- Created two Creem test products:
  - Creator Pack: `$9`, `100 credits`.
  - Commerce Pack: `$29`, `400 credits`.

## 2026-05-27: Creem Integration

- Added Creem checkout creation through `/api/checkout`.
- Added Creem webhook endpoint at `/api/creem/webhook`.
- Added webhook signing-secret verification.
- Added webhook event deduplication.
- Added credit grants for successful checkout events.
- Verified Creem test checkout flow from the deployed website.

## 2026-05-27: Deployment

- Created GitHub repository:
  - `https://github.com/yyd841122/PicToVedio`
- Created Render web service:
  - Service name: `motionpic-ai`
  - Runtime: Node
  - Build command: `npm install`
  - Start command: `npm start`
- Added Cloudflare custom domain:
  - `https://video.cozyguidehub.com`
- Added DNS CNAME:
  - `video -> motionpic-ai.onrender.com`

## 2026-05-27: Supabase Persistence

- Created Supabase project.
- Added schema in `supabase.sql`.
- Created tables:
  - `app_users`
  - `video_jobs`
  - `payments`
  - `webhook_events`
  - `credit_ledger`
- Switched deployed data provider from local file storage to Supabase.
- Verified `/api/account` returns persistent credits.
- Verified a successful Creem test payment increased `demo-user` from `12` to `112 credits`.

## 2026-05-27: Multilingual Launch Support

- Added language selector.
- Added UI copy support for:
  - English
  - Chinese
  - German
  - Italian
  - French
  - Spanish
  - Japanese
  - Korean
- Added `hreflang` links for `?lang=` URLs.
- Kept English as the default international fallback.

## 2026-05-27: User-Facing Copy Cleanup

- Removed internal wording from the public page:
  - Demand check.
  - MVP validation.
  - Paid-strength language.
- Replaced it with user-facing sections:
  - What You Can Create.
  - Popular Templates.
- Updated page copy to explain what the product does, not why the business idea may work.

## 2026-05-28: SEO/GEO Foundation

- Added SEO metadata:
  - Title.
  - Description.
  - Keywords.
  - Robots.
  - Canonical.
  - Hreflang.
  - Open Graph.
  - Twitter Card.
- Added JSON-LD:
  - `Organization`
  - `SoftwareApplication`
  - `FAQPage`
- Added GEO-friendly visible content:
  - Why Choose MotionPic AI.
  - Frequently Asked Questions.
- Added:
  - `robots.txt`
  - `sitemap.xml`
  - `404.html`

## Current State

The project is a deployed, payment-enabled MVP. It can:

- Show a usable AI photo-to-video generator interface.
- Accept Creem test checkout payments.
- Receive Creem webhook events.
- Persist credit changes in Supabase.
- Run real DashScope image-to-video jobs and refund credits on technical failure.
- Track page views, uploads, generation clicks, generation outcomes, checkout clicks, checkout returns, and paid credit grants.
- Show private analytics and operations dashboards for funnel, users, jobs, payments, webhooks, credit ledger, refunds, and estimated provider cost.
- Let an anonymous browser user view their own `/account` balance, recent credit activity, and recent video jobs.
- Serve the site from `https://video.cozyguidehub.com`.
- Provide an English-first SEO/GEO foundation with legal pages, template pages, guide pages, a guide hub, and `llms.txt`.

The project does not yet:

- Store uploaded files and generated videos in object storage.
- Support full email accounts.
- Accept live Creem payments.
- Publish directory submissions and the first public launch posts.

## 2026-06-02: User Account Utility

- Added `/account` for the current anonymous browser user.
- Extended `/api/account` to return recent video jobs alongside credits and credit ledger entries.
- Added a homepage credit-panel link to the account page.
- Marked the account page as `noindex` and blocked `/account` in `robots.txt` because it is not an SEO page.

## 2026-06-02: Internal Launch Kit

- Added `/launch-kit` as an internal copy-and-paste helper for directory submissions, Product Hunt, Indie Hackers, Reddit, X, and Xiaohongshu.
- Included official submission links, UTM tracking URLs, reusable English descriptions, and Chinese social copy.
- Linked the launch kit from the protected Ops dashboard so promotion work is easier to run after deployment.
- Marked the launch kit as `noindex` and blocked `/launch-kit` in `robots.txt`.

## 2026-06-02: Result Quality Feedback

- Added lightweight feedback buttons to completed generation records.
- Users can mark a result as `Good` or `Distorted`.
- The feedback is tracked as `result_feedback` in analytics so future template and model decisions can use quality signals, not just job success.
- Extended the private analytics dashboard with feedback totals, usable-output rate, good/distorted counts, and template-level feedback rows.

## 2026-06-02: Launch Channel Attribution

- Added UTM capture for launch links such as `utm_source`, `utm_medium`, and `utm_campaign`.
- Saved first-touch attribution in the browser so upload, generation, checkout, and payment events can stay connected to the original promotion channel.
- Added Channel Attribution to the private analytics dashboard for page views, upload success, generation success, checkout redirects, and paid credits.

## 2026-06-03: Supabase Security Hardening

- Reviewed a Supabase critical warning about public table access and sensitive columns.
- Identified that earlier MVP testing SQL had disabled Row Level Security and granted direct table access to public API roles.
- Updated `supabase.sql` so future database setup enables RLS, revokes `anon` / `authenticated` access, and keeps backend-only `service_role` access.
- Added `SUPABASE_SECURITY_FIX.sql` as a one-time live database repair script for clearing Supabase advisor warnings.
- Ran the live security fix SQL successfully in Supabase SQL Editor.
- Left one owner confirmation item open: re-run Supabase Advisor or click Resolve Issue to confirm the warning has disappeared.

## 2026-06-03: Real Generation Quality Guardrails

- Confirmed the DashScope real generation flow works end to end, with silent 4-second 720p jobs costing about CNY 0.60 in the latest test.
- Kept the default generation cost at 2 credits so the current Creator Pack margin is safer than one-credit generation.
- Disabled DashScope prompt expansion by default with `DASHSCOPE_PROMPT_EXTEND=false` to reduce identity drift and scene invention.
- Added stronger backend negative prompts for identity change, merged faces, mouth distortion, object/logo/text distortion, and scene changes.
- Added template-specific guardrails for portraits, products, old photos, pets, and romantic/couple clips.
- Updated the visible template prompts so users start with subtle motion and understand that Couple Kiss is experimental.

## 2026-06-04: Second-Pass Prompt Tightening

- Tightened the default Natural Portrait prompt around locked first-frame identity, closed-mouth micro expression, and no face reshaping.
- Tightened Product Motion to preserve logos, labels, packaging proportions, and readable text while using camera motion instead of object deformation.
- Tightened Old Photo, Pet Motion, and Couple Kiss prompts to avoid identity changes, anatomy changes, background changes, forced mouth movement, and invented contact.
- Expanded the DashScope negative prompt with lip sync, talking mouth, product deformation, unreadable text, camera shake, and background-change blockers.
