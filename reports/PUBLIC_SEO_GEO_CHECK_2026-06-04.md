# Public SEO And GEO Check 2026-06-04

## Scope

Local file audit for MotionPic AI public discovery surfaces.

## Sitemap Coverage

The sitemap includes:

- Homepage: `/`
- Legal pages: `/privacy`, `/terms`, `/refund`
- Template pages: `/templates/ai-kiss-video`, `/templates/product-video-ad`, `/templates/pet-animation`, `/templates/old-photo-alive`
- Guide hub and guide pages: `/guides`, `/guides/best-photos-for-ai-video`, `/guides/reduce-ai-video-distortion`, `/guides/photo-to-video-cost`, `/guides/ecommerce-product-video-ads`, `/guides/pet-photo-animation`, `/guides/old-photo-animation`
- AI discovery file: `/llms.txt`

The sitemap intentionally excludes internal or utility pages:

- `/account`
- `/launch-kit`
- `/admin/analytics`
- `/admin/ops`
- `/api/*`
- `/404.html`

## Metadata Check

Public homepage, template pages, guide pages, and legal pages have:

- `<title>`
- Meta description
- Canonical URL
- Open Graph title/description/image
- Twitter Card metadata

## Structured Data Check

Homepage has Organization, SoftwareApplication, and FAQPage JSON-LD.

Template pages have WebPage, BreadcrumbList, and FAQPage JSON-LD.

Guide pages now use consistent guide schema patterns:

- `/guides`: ItemList guide hub JSON-LD
- `/guides/best-photos-for-ai-video`: BreadcrumbList, Article, FAQPage
- `/guides/reduce-ai-video-distortion`: BreadcrumbList, Article, FAQPage
- `/guides/photo-to-video-cost`: BreadcrumbList, Article, FAQPage
- `/guides/ecommerce-product-video-ads`: BreadcrumbList, Article, FAQPage
- `/guides/pet-photo-animation`: BreadcrumbList, Article, FAQPage
- `/guides/old-photo-animation`: BreadcrumbList, Article, FAQPage

## Change Made

The first three guide pages previously only had FAQPage schema. They now match the later guide pages with BreadcrumbList and Article schema, plus keyword metadata. Their sitemap `lastmod` values were updated to `2026-06-04`.

The homepage FAQ was extended with download-soon guidance while object storage is deferred, and the homepage sitemap `lastmod` value was updated to `2026-06-04`.

## High-Risk Follow-Up Requiring Owner Confirmation

- Submit or resubmit sitemap in Google Search Console.
- Submit or resubmit sitemap in Bing Webmaster Tools.
- Trigger protected IndexNow submission from the admin dashboard.
- Publish directory or social submissions using the launch kit.
