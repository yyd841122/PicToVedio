# FrameVela AI Baidu Submission Checklist

Last updated: 2026-06-04

Use this checklist only if FrameVela AI starts targeting Chinese-language discovery. This is an operator guide, not an automation script. Do not submit, verify, or configure Baidu accounts without owner confirmation.

## Context

Baidu submission usually happens through Baidu Search Resource Platform:

```text
https://ziyuan.baidu.com/
```

Useful submission area:

```text
https://ziyuan.baidu.com/linksubmit
```

Some accounts may see sitemap submission, manual URL submission, API push, or automatic submission options. Available options can vary by account verification, site status, and Baidu platform rules. If Baidu shows a URL push API token, treat it like a secret and never commit it.

## Before Starting

- [ ] Owner confirms Chinese search is a priority.
- [ ] Owner has or can create a Baidu account.
- [ ] Owner confirms whether a Chinese phone number or real-name verification is available if Baidu requires it.
- [ ] Public site is stable at `https://video.cozyguidehub.com/`.
- [ ] `/robots.txt` opens.
- [ ] `/sitemap.xml` opens.
- [ ] Chinese-facing copy is acceptable for the intended audience.
- [ ] Support email is monitored.

## Site Verification

- [ ] Log in to Baidu Search Resource Platform.
- [ ] Add the site:

```text
https://video.cozyguidehub.com
```

- [ ] Choose a verification method that does not expose secrets.
- [ ] If Baidu requires an HTML verification file, add only the public verification file content to the repo after reviewing it.
- [ ] If Baidu provides a token or API key, do not commit it. Store it only in the relevant private dashboard or password manager.
- [ ] Confirm the verified domain matches the production domain, not a Render preview URL.

## Submission Targets

Submit the sitemap if Baidu makes sitemap submission available:

```text
https://video.cozyguidehub.com/sitemap.xml
```

If sitemap submission is not available, manually submit the highest-priority URLs first:

```text
https://video.cozyguidehub.com/
https://video.cozyguidehub.com/templates/product-video-ad
https://video.cozyguidehub.com/templates/pet-animation
https://video.cozyguidehub.com/templates/old-photo-alive
https://video.cozyguidehub.com/guides
https://video.cozyguidehub.com/guides/best-photos-for-ai-video
https://video.cozyguidehub.com/guides/ecommerce-product-video-ads
https://video.cozyguidehub.com/guides/pet-photo-animation
https://video.cozyguidehub.com/guides/old-photo-animation
```

## Optional API Push

Only use API push after owner approval.

- [ ] Confirm Baidu shows an API push endpoint for the verified site.
- [ ] Copy the endpoint/token only into a private note or environment variable.
- [ ] Do not add the endpoint token to GitHub, public docs, screenshots, or support messages.
- [ ] Submit a very small batch first.
- [ ] Confirm Baidu accepts the URLs before expanding.

## Post-Submission Checks

- [ ] Record submission date.
- [ ] Record whether sitemap, manual URL submission, or API push was used.
- [ ] Check whether Baidu reports crawl/index errors.
- [ ] If pages are not indexed, do not repeatedly resubmit the same URLs aggressively.
- [ ] Prioritize adding Chinese-language content only after the English-first funnel and support process are stable.

## Stop Conditions

Pause Baidu work if:

- Baidu requires owner identity, phone, or real-name verification.
- Baidu provides a token and there is no private place to store it.
- The site needs Chinese-language legal/support coverage that is not ready.
- Public generation quality is not good enough for Chinese social/search discovery.
- The owner decides Chinese search is lower priority than directories, X, Product Hunt, or Xiaohongshu.
