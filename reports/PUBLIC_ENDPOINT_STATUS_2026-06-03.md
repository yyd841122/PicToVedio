# MotionPic AI Public Endpoint Status

Date: 2026-06-03

Scope: read-only public endpoint checks. No private dashboards, search submissions, Render settings, Supabase data, Creem settings, R2 writes, real payments, or real generation jobs were touched.

## Summary

The public discovery and health endpoints are reachable. The health endpoint reports DashScope as the active video provider. The social preview image URL returns a PNG resource; the scraping tool cannot parse binary images, but the content type confirms the endpoint is serving an image rather than an HTML error page.

## Endpoint Results

| URL | Result | Notes |
|---|---|---|
| `https://video.cozyguidehub.com/health` | 200 | Returned `{"ok":true,"provider":"dashscope"}` |
| `https://video.cozyguidehub.com/robots.txt` | 200 | Allows `/` and `/llms.txt`; blocks `/api/`, `/admin/`, `/account`, and `/launch-kit` |
| `https://video.cozyguidehub.com/sitemap.xml` | 200 | Includes homepage, legal pages, template pages, guide pages, and `llms.txt` |
| `https://video.cozyguidehub.com/llms.txt` | 200 | Contains MotionPic AI description and important public URLs |
| `https://video.cozyguidehub.com/indexnow-key.txt` | 200 | Returned `motionpic-ai-indexnow-2026-06-02` |
| `https://video.cozyguidehub.com/photo-to-video-hero.png` | PNG response | Binary image returned; not parsed by the text scraper |

## Risk Notes

- These checks do not prove private admin dashboards are protected; that requires owner-provided access or screenshots.
- These checks do not submit IndexNow, Google Search Console, Bing Webmaster Tools, or directories.
- These checks do not validate real checkout, live webhook behavior, object storage writes, or real generation quality.

## Next Safe Follow-Up

Continue with local-only acceptance documentation and static checks until the owner confirms access for high-risk production operations.
