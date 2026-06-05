# MotionPic AI Email Login Setup Guide

Last updated: 2026-06-05

MotionPic AI now has the code path for real email magic-link login, but it is intentionally disabled until Supabase Auth and Render are configured.

## Current Behavior

- Public visitors can browse, upload, choose templates, and use the small anonymous starter balance.
- Browser-local accounts still work through `motionpic-user-id`.
- `/login` can request a magic link only after Supabase Auth is configured.
- `/auth-callback` exchanges the Supabase Auth access token for a MotionPic HttpOnly session cookie.
- After login, the backend uses the signed cookie instead of trusting the browser-local user id.
- The current browser account is merged into the durable email account so credits, jobs, payments, ledger rows, and analytics move forward together.

## Why This Is Safer

Do not use a fake login button. A real login must prove ownership of an email address and then make the server choose the user account from a verified session cookie.

This implementation does that:

- Supabase sends the magic link.
- MotionPic validates the Supabase access token server-side.
- MotionPic sets an HttpOnly cookie.
- Sensitive generation and checkout endpoints prefer the verified cookie over localStorage.

## Supabase Steps

Do these in Supabase only when you are ready to enable email login.

1. Open the MotionPic Supabase project.
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
5. Confirm it then redirects to `/account`.
6. Confirm `/account` says you are signed in.
7. Confirm your existing browser credits are still present.
8. Generate only if you intentionally want to spend provider credits.

## Acceptance Criteria

- [ ] `/login` sends a magic link after Render variables are configured.
- [ ] `/auth-callback` creates a signed MotionPic session.
- [ ] `/account` shows signed-in email state.
- [ ] Existing browser credits merge into the email account.
- [ ] Checkout and generation use the signed account after login.
- [ ] Logging out clears the signed cookie and returns to a fresh browser-local account.

## Do Not Do

- [ ] Do not expose `SUPABASE_SERVICE_ROLE_KEY` in public HTML or JavaScript.
- [ ] Do not grant direct Supabase table access to `anon` or `authenticated`.
- [ ] Do not add a public homepage login CTA until the magic-link flow is configured and tested.
- [ ] Do not run broad promotion until paid credits and generated jobs survive login.
