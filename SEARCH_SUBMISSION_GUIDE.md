# FrameVela AI Search Submission Guide

Last updated: 2026-06-02

Use this guide after each important public-page deploy. The goal is to help Google, Bing, and AI discovery systems find FrameVela AI quickly.

## Submission URLs

Primary URLs to submit:

```text
https://video.cozyguidehub.com/
https://video.cozyguidehub.com/sitemap.xml
https://video.cozyguidehub.com/llms.txt
https://video.cozyguidehub.com/templates/ai-kiss-video
https://video.cozyguidehub.com/templates/product-video-ad
https://video.cozyguidehub.com/templates/pet-animation
https://video.cozyguidehub.com/templates/old-photo-alive
https://video.cozyguidehub.com/guides/best-photos-for-ai-video
https://video.cozyguidehub.com/guides/reduce-ai-video-distortion
https://video.cozyguidehub.com/guides/photo-to-video-cost
https://video.cozyguidehub.com/guides/ecommerce-product-video-ads
https://video.cozyguidehub.com/guides/pet-photo-animation
https://video.cozyguidehub.com/guides/old-photo-animation
```

## Google Search Console

Official entry:

```text
https://search.google.com/search-console
```

Steps:

1. Open Google Search Console.
2. Click `Add property`.
3. Choose `URL prefix` for the easiest setup.
4. Enter `https://video.cozyguidehub.com/`.
5. Verify ownership. The easiest path is usually an HTML meta tag or Cloudflare DNS TXT record.
6. After verification, open `Sitemaps`.
7. Submit `https://video.cozyguidehub.com/sitemap.xml`.
8. Use `URL Inspection` for the homepage and the most important template pages.
9. Click `Request indexing` for:

```text
https://video.cozyguidehub.com/
https://video.cozyguidehub.com/templates/product-video-ad
https://video.cozyguidehub.com/templates/ai-kiss-video
```

Notes:

- Google may take days or weeks to index a new site.
- A submitted sitemap does not guarantee ranking.
- Keep page titles, descriptions, and page content stable for the first few weeks unless there is a clear issue.

## Bing Webmaster Tools

Official entry:

```text
https://www.bing.com/webmasters
```

Steps:

1. Open Bing Webmaster Tools.
2. Sign in with Microsoft, Google, or GitHub.
3. Add `https://video.cozyguidehub.com/`.
4. If Google Search Console is already verified, you can import the site from Google.
5. Open `Sitemaps`.
6. Click `Submit sitemap`.
7. Submit `https://video.cozyguidehub.com/sitemap.xml`.
8. Open `URL Submission`.
9. Submit the homepage, template pages, and guide pages.

Notes:

- FrameVela now includes a protected IndexNow helper. After a public-page deploy, open `/admin/analytics`, log in, and click `IndexNow`. The JSON result should show `ok: true` or an upstream status/error to review.
- The public verification key is available at `https://video.cozyguidehub.com/indexnow-key.txt`.
- Bing can be useful because it also feeds parts of the Microsoft search ecosystem.

## IndexNow Quick Submit

Use this after adding or changing public pages:

```text
https://video.cozyguidehub.com/admin/analytics
```

Steps:

1. Open the analytics dashboard.
2. Log in with the private analytics token if needed.
3. Click `IndexNow`.
4. Confirm the JSON response includes the number of submitted URLs.
5. If the response is not successful, wait a few minutes and retry once from the same button.

What it submits:

- The endpoint reads `sitemap.xml`.
- It submits public URLs for `video.cozyguidehub.com`.
- It uses `indexnow-key.txt` as the public verification file.

This does not replace Google Search Console or Bing Webmaster Tools. It is an extra discovery signal for engines that support IndexNow.

## AI Search / GEO Checks

Check these URLs manually after every deploy:

```text
https://video.cozyguidehub.com/robots.txt
https://video.cozyguidehub.com/sitemap.xml
https://video.cozyguidehub.com/llms.txt
```

Expected:

- `robots.txt` allows normal public pages and references the sitemap.
- `sitemap.xml` includes homepage, templates, guides, policy pages, and `llms.txt`.
- `llms.txt` explains what FrameVela AI does, best use cases, important pages, and editorial notes for AI answers.

## What To Watch

Weekly checks:

- Google Search Console impressions.
- Indexed pages count.
- Search queries that mention photo to video, image to video, product video, pet animation, old photo animation, or AI kiss video.
- Bing Webmaster Tools crawl/index status.
- FrameVela `/admin/analytics` upload and checkout conversion.

If a page gets impressions but low clicks:

1. Improve the title.
2. Improve the meta description.
3. Add a clearer first paragraph.
4. Add examples and FAQ answers.
5. Wait before changing again.

## First Pages To Prioritize

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
