# FrameVela AI Email Login Setup Guide

Last updated: 2026-06-05

FrameVela AI has a real email magic-link login path. It stays disabled automatically until Supabase Auth and the Render Auth variables are configured.

## Current Behavior

- Public visitors can browse, upload, choose templates, and use the small anonymous starter balance.
- Browser-local accounts still work through `motionpic-user-id`.
- `/login` can request a magic link only after Supabase Auth is configured.
- `/auth-callback` exchanges the Supabase Auth access token for a FrameVela HttpOnly session cookie.
- After login, the backend uses the signed cookie instead of trusting the browser-local user id.
- The current browser account is merged into the durable email account so credits, jobs, payments, ledger rows, and analytics move forward together.
- When Auth is available, the homepage shows a real login/account state and checkout requires email login before buying credits.

## Why This Is Safer

Do not use a fake login button. A real login must prove ownership of an email address and then make the server choose the user account from a verified session cookie.

This implementation does that:

- Supabase sends the magic link.
- FrameVela validates the Supabase access token server-side.
- FrameVela sets an HttpOnly cookie.
- Sensitive generation and checkout endpoints prefer the verified cookie over localStorage.

## Supabase Steps

Do these in Supabase only when you are ready to enable email login.

1. Open the FrameVela Supabase project.
2. Go to `Authentication -> URL Configuration`.
3. Set or confirm Site URL:

```text
https://video.cozyguidehub.com
```

4. Add this redirect URL:

```text
https://video.cozyguidehub.com/auth-callback
```

5. Go to `Project Settings -> API`.
6. Copy the public/publishable/anon key for Auth use.
7. Do not use or paste the `SUPABASE_SERVICE_ROLE_KEY` into browser code.

## Render Environment Variables

Add these in Render:

```env
SUPABASE_AUTH_ANON_KEY=your_supabase_public_or_anon_key
AUTH_COOKIE_SECRET=choose_a_long_random_private_string
```

Keep the existing values:

```env
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret
DATA_PROVIDER=supabase
```

Then click:

```text
Save, rebuild, and deploy
```

## First Test

After deploy:

1. Open `https://video.cozyguidehub.com/login`.
2. Enter your email.
3. Open the newest magic link email.
4. Confirm the browser redirects to `/auth-callback`.
5. Confirm it then redirects to the original page if login started from a protected action, or `/account` for direct login.
6. Confirm `/account` says you are signed in.
7. Confirm your existing browser credits are still present.
8. Confirm the homepage shows `Account` instead of `Email Login`.
9. Generate only if you intentionally want to spend provider credits.

## Acceptance Criteria

- [ ] `/login` sends a magic link after Render variables are configured.
- [ ] `/auth-callback` creates a signed FrameVela session.
- [ ] `/account` shows signed-in email state.
- [ ] Homepage shows `Email Login` for anonymous visitors and `Account` for signed-in visitors.
- [ ] Existing browser credits merge into the email account.
- [ ] Anonymous checkout redirects to `/login` before creating a paid checkout.
- [ ] Checkout and generation use the signed account after login.
- [ ] Logging out clears the signed cookie and returns to a fresh browser-local account.

## Do Not Do

- [ ] Do not expose `SUPABASE_SERVICE_ROLE_KEY` in public HTML or JavaScript.
- [ ] Do not grant direct Supabase table access to `anon` or `authenticated`.
- [ ] Do not show a fake login state; the homepage CTA should appear only when Auth is configured.
- [ ] Do not run broad promotion until paid credits and generated jobs survive login.
