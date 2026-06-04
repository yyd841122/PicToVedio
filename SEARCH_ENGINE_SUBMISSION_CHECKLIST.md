# MotionPic AI Search Engine Submission Checklist

Last updated: 2026-06-03

Use this checklist when you are ready to submit MotionPic AI to search engines. This file is an operator checklist only; it does not replace Google Search Console, Bing Webmaster Tools, or the protected IndexNow admin endpoint.

## Before Submitting

- [x] Public homepage returns 200: `https://video.cozyguidehub.com/`
- [x] Public health check returns DashScope provider: `https://video.cozyguidehub.com/health`
- [x] `robots.txt` returns 200: `https://video.cozyguidehub.com/robots.txt`
- [x] `sitemap.xml` returns 200: `https://video.cozyguidehub.com/sitemap.xml`
- [x] `llms.txt` returns 200: `https://video.cozyguidehub.com/llms.txt`
- [x] `indexnow-key.txt` returns 200: `https://video.cozyguidehub.com/indexnow-key.txt`
- [x] Sitemap includes homepage, policy pages, template pages, guide pages, and `llms.txt`.
- [x] Internal account, admin, API, and launch-kit pages are excluded from the public sitemap.
- [x] Template and guide pages include canonical, H1, JSON-LD, Open Graph, and Twitter Card metadata.
- [x] Local JSON-LD parse check passed for public homepage, legal pages, template pages, and guide pages on 2026-06-04.
- [x] Local sitemap coverage check found 16 expected public URLs and no internal utility URLs on 2026-06-04.

## Google Search Console

Entry:

```text
https://search.google.com/search-console
```

Submit:

```text
https://video.cozyguidehub.com/sitemap.xml
```

Recommended URL inspection order:

```text
https://video.cozyguidehub.com/
https://video.cozyguidehub.com/templates/product-video-ad
https://video.cozyguidehub.com/templates/ai-kiss-video
https://video.cozyguidehub.com/guides/photo-to-video-cost
```

Checklist:

- [ ] Add or open the `https://video.cozyguidehub.com/` property.
- [ ] Confirm ownership is verified.
- [ ] Submit `https://video.cozyguidehub.com/sitemap.xml` under Sitemaps.
- [ ] Use URL Inspection for the homepage.
- [ ] Request indexing for the homepage.
- [ ] Use URL Inspection for the priority template and guide pages.
- [ ] Save the first impression/indexing date in project notes after Google reports data.

## Bing Webmaster Tools

Entry:

```text
https://www.bing.com/webmasters
```

Submit:

```text
https://video.cozyguidehub.com/sitemap.xml
```

Checklist:

- [ ] Add or import the `https://video.cozyguidehub.com/` property.
- [ ] Confirm ownership is verified.
- [ ] Submit `https://video.cozyguidehub.com/sitemap.xml`.
- [ ] Submit the homepage through URL Submission.
- [ ] Submit the priority template and guide pages through URL Submission.
- [ ] Review crawl/index status after Bing processes the sitemap.

## IndexNow

Admin entry:

```text
https://video.cozyguidehub.com/admin/analytics
```

Checklist:

- [ ] Log in with the private analytics token.
- [ ] Click `IndexNow`.
- [ ] Confirm the JSON response shows a successful result or a clear upstream response.
- [ ] If it fails, wait a few minutes and retry once.
- [ ] Do not retry repeatedly if the upstream service returns an error.

## Priority URLs

Priority 1:

```text
https://video.cozyguidehub.com/
https://video.cozyguidehub.com/templates/product-video-ad
https://video.cozyguidehub.com/guides/photo-to-video-cost
```

Priority 2:

```text
https://video.cozyguidehub.com/templates/ai-kiss-video
https://video.cozyguidehub.com/templates/pet-animation
https://video.cozyguidehub.com/templates/old-photo-alive
```

Priority 3:

```text
https://video.cozyguidehub.com/guides/best-photos-for-ai-video
https://video.cozyguidehub.com/guides/reduce-ai-video-distortion
https://video.cozyguidehub.com/guides/ecommerce-product-video-ads
https://video.cozyguidehub.com/guides/pet-photo-animation
https://video.cozyguidehub.com/guides/old-photo-animation
```

## Do Not Submit

Do not submit these as public index URLs:

```text
https://video.cozyguidehub.com/account
https://video.cozyguidehub.com/launch-kit
https://video.cozyguidehub.com/admin/analytics
https://video.cozyguidehub.com/admin/ops
https://video.cozyguidehub.com/api/*
```

## After Submission

- [ ] Check Google Search Console weekly for indexed pages, impressions, and top queries.
- [ ] Check Bing Webmaster Tools weekly for crawl/index status.
- [ ] Watch `/admin/analytics` for channel attribution from search and directory traffic.
- [ ] If a page gets impressions but weak clicks, improve title, meta description, and first paragraph before changing larger page structure.
