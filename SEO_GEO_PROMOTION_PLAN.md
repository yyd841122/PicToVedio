# MotionPic AI SEO, GEO, And Promotion Plan

This plan adapts the SEO workflow from `鱼厂 SEO 优化工作流.md` to MotionPic AI.

## 1. Default Homepage TDK

### Title

Template:

```text
AI Photo to Video Generator - MotionPic AI | Turn Photos into Viral Short Videos
```

Rules:

- Use `-` between page keyword and brand.
- Use `|` before the core value proposition.
- Keep the main keyword at the front.
- Keep each page title unique.

### Description

Current target:

```text
Create AI photo-to-video clips for TikTok, Reels, product pages, pets, couples, and memories. Upload one photo, choose a template, and export HD videos.
```

Rules:

- Put the core value in the first 150-160 English characters.
- Mention target channels and use cases.
- Include an action-oriented phrase.
- Do not repeat the same description across pages.

### Keywords

Homepage keywords:

```text
AI photo to video, photo to video generator, image to video AI, AI video generator, product video maker, pet animation, old photo animation, AI kiss video, MotionPic AI
```

Rules:

- Keep the list under 10 items.
- Put core keywords first.
- Include brand name once.
- Use page-specific keywords for template pages.

## 2. Required SEO Meta Tags

Every important public page should include:

- Unique `<title>`.
- Unique `meta name="description"`.
- `meta name="keywords"` for Baidu and other engines that still reference it.
- `meta name="robots" content="index, follow"`.
- UTF-8 charset.
- Viewport.
- Canonical URL.
- Hreflang links for language variants.
- Open Graph tags:
  - `og:title`
  - `og:description`
  - `og:image`
  - `og:type`
  - `og:url`
  - `og:locale`
  - `og:site_name`
- Twitter Card tags:
  - `twitter:card`
  - `twitter:title`
  - `twitter:description`
  - `twitter:image`

## 3. Structured Data

Homepage JSON-LD:

- `Organization`
- `SoftwareApplication`
- `FAQPage`

Future template page JSON-LD:

- `BreadcrumbList`
- `SoftwareApplication`
- `FAQPage`
- `VideoObject` when real demo video URLs exist.

Future article page JSON-LD:

- `Article`
- `BreadcrumbList`

## 4. Page Structure Rules

Homepage:

- One H1 only.
- H1 should describe the product and contain the main idea.
- H2 sections:
  - Generator.
  - Use cases.
  - Popular templates.
  - Why choose MotionPic AI.
  - FAQ.
- H3 should be used inside cards and FAQ items.
- No internal wording such as demand validation, MVP metrics, or paid willingness.

Images:

- Every image needs a unique alt attribute.
- File names should be descriptive and use English hyphenated names.
- Share image should use an absolute URL.

Links:

- Internal links should use descriptive anchor text.
- External links should use `target="_blank"` and `rel="noopener noreferrer nofollow"` unless there is a strong reason to pass authority.

## 5. Technical SEO

Implemented:

- `robots.txt`
- `sitemap.xml`
- `llms.txt`
- `404.html`
- Canonical URL.
- Hreflang links.
- Crawlable homepage HTML content.

Next:

- Submit sitemap to Google Search Console.
- Submit sitemap to Bing Webmaster Tools.
- Verify `/llms.txt` after each major public-page update.
- Add Baidu Search Resource Platform if targeting Chinese search.
- Add route-based language URLs later:
  - `/en/`
  - `/zh/`
  - `/ja/`
  - `/ko/`
  - `/de/`
  - `/fr/`
  - `/es/`
  - `/it/`

## 6. GEO Content Strategy

Goal: help AI search engines understand and cite MotionPic AI.

Core entity statement:

```text
MotionPic AI is a web-based AI photo-to-video generator that turns one uploaded photo into a short video for social posts, product pages, pet animations, couple videos, and old photo memories.
```

Homepage should answer:

- What is MotionPic AI?
- What is an AI photo-to-video generator?
- Which photos work best?
- How do credits work?
- Does it support no-watermark export?
- Can videos be used commercially?
- How is it different from general AI video tools?

Future GEO pages:

- MotionPic AI vs general AI video generator.
- Best AI photo to video generator for ecommerce.
- How to turn pet photos into short AI videos.
- How to animate old photos with AI.
- AI kiss video generator use cases.

## 7. First SEO Landing Pages

Build these first:

1. `/templates/ai-kiss-video`
   - Keyword: `AI kiss video generator`
   - Audience: couples, anniversary posts, social users.

2. `/templates/product-video-ad`
   - Keyword: `product video maker`
   - Audience: Shopify, Amazon, independent sellers.

3. `/templates/pet-animation`
   - Keyword: `AI pet animation`
   - Audience: pet owners and pet shops.

4. `/templates/old-photo-alive`
   - Keyword: `old photo animation AI`
   - Audience: family memories, old photo restoration users.

Each page should include:

- Unique TDK.
- One H1.
- Use case explanation.
- How it works.
- FAQ.
- CTA to the generator.
- JSON-LD.

## 8. Promotion Channels

AI tool directories:

- Toolify
- Futurepedia
- There's An AI For That
- AI Top Tools
- SaaSHub

Launch communities:

- Product Hunt
- Indie Hackers
- Hacker News Show HN
- Reddit

Social channels:

- X/Twitter
- TikTok
- YouTube Shorts
- Xiaohongshu

Content channels:

- Blog posts on the MotionPic AI site.
- Medium or dev/build-in-public posts.
- Guest posts or listicle submissions if available.

## 9. Promotion Tracking

Use URL parameters:

```text
?utm_source=producthunt&utm_medium=launch&utm_campaign=motionpic-ai
?utm_source=toolify&utm_medium=directory&utm_campaign=motionpic-ai
?utm_source=reddit&utm_medium=community&utm_campaign=motionpic-ai
?utm_source=x&utm_medium=social&utm_campaign=motionpic-ai
?utm_source=xiaohongshu&utm_medium=social&utm_campaign=motionpic-ai
```

Track:

- Visits.
- Uploads.
- Preview generation.
- Checkout clicks.
- Checkout success.
- Paid credits.

## 10. Monthly SEO Audit Checklist

- Check duplicate titles and descriptions.
- Check broken links.
- Check sitemap freshness.
- Check robots.txt.
- Check H1 count per page.
- Check image alt attributes.
- Check Google Search Console indexing.
- Check top queries and impressions.
- Update pages with low CTR.
- Create new content from search terms that already get impressions.
