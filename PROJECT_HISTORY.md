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
- Serve the site from `https://video.cozyguidehub.com`.
- Present multilingual UI copy.
- Provide a basic SEO/GEO foundation.

The project does not yet:

- Generate real videos from a paid model API.
- Store uploaded files and generated videos in object storage.
- Support real user accounts.
- Accept live Creem payments.
- Provide production legal pages.
- Run analytics or conversion tracking.
- Publish SEO template pages and blog content.
