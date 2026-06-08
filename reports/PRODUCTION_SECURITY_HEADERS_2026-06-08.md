# MotionPic AI Production Security Headers

Date: 2026-06-08

## Scope

This low-risk pass reviewed public response headers without changing Render, Cloudflare, Supabase, Creem, DashScope, storage, payment mode, or production data.

## Finding

The homepage, login, account, policy pages, static images, manifest, and JSON health response did not expose consistent browser security headers.

## Implemented

All server responses now include:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

JSON API responses now also include:

- `Cache-Control: no-store`

## Deliberately Deferred

- A restrictive Content Security Policy is deferred because the current pages contain inline styles and scripts. Adding CSP safely requires nonce or hash work and broader browser regression testing.
- Strict Transport Security is deferred because it creates a longer-lived browser policy and should be coordinated with the owner and Cloudflare configuration.

## Verification

The local smoke suite checks the headers on HTML, static-image, JSON, and 404 responses. It also checks that account JSON cannot be cached.
