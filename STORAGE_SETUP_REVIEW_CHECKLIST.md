# FrameVela AI Storage Setup Review Checklist

Last updated: 2026-06-03

This checklist prepares the Cloudflare R2 or compatible object-storage cutover review. It is a planning document only. Do not create buckets, change Render variables, write objects, run real generation jobs, or inspect private storage dashboards without owner confirmation.

## Purpose

FrameVela AI can run real image-to-video jobs, but public paid traffic should not rely only on browser-local data or temporary provider URLs. Storage setup should prove that uploaded photos and generated videos can persist after refreshes, redeploys, and provider URL expiry.

Use this checklist with:

- `R2_SETUP_GUIDE.md`
- `LIVE_PAYMENT_TEST_PROCEDURE.md`
- `GENERATION_TEST_PLAN.md`
- `/admin/ops`, after the owner provides authorized access

## Stop Before These Actions

Ask the owner before:

- Creating or modifying a Cloudflare R2 bucket.
- Creating R2 API tokens.
- Adding or changing Render environment variables.
- Setting `STORAGE_PROVIDER=r2`.
- Running a real generation to test storage writes.
- Opening private R2, Render, Supabase, or admin dashboard data.
- Sharing storage keys, signed URLs, private screenshots, or provider logs.

## Pre-Setup Decisions

| Decision | Recommended first answer | Owner confirmation needed? |
|---|---|---|
| Storage provider | Cloudflare R2 | Yes |
| Bucket name | `motionpic-assets` | Yes |
| Public asset domain | `assets.cozyguidehub.com` or leave unset temporarily | Yes |
| First test mode | One owner-approved small generation | Yes |
| Rollback value | `STORAGE_PROVIDER=none` | Yes |

## Required Render Variables

These values must be prepared before enabling storage:

```text
STORAGE_PROVIDER=r2
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=motionpic-assets
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://assets.cozyguidehub.com
```

Do not write real secrets into this repo.

## Pre-Cutover Checks

- [ ] `/health` returns a healthy response before the change.
- [ ] Render current environment values are backed up outside the repo.
- [ ] The owner confirms the bucket name.
- [ ] The owner confirms token scope is limited to the intended bucket when possible.
- [ ] The owner confirms whether a public asset domain is ready.
- [ ] The owner confirms whether a small real generation may be used for the storage write test.
- [ ] The owner confirms where private screenshots/evidence should be saved outside the repo.

## Cutover Test Steps

Only run these after owner confirmation:

1. Add R2 variables to Render.
2. Set `STORAGE_PROVIDER=r2`.
3. Save and redeploy.
4. Confirm `/health` still returns OK.
5. Open the homepage and upload an owner-approved test image.
6. Run one 4-second 720p generation.
7. Confirm the job succeeds.
8. Confirm the output URL opens.
9. Confirm `/admin/ops` shows the stored output URL.
10. Refresh the page and confirm the output remains accessible.
11. Confirm no secrets or private URLs are written to public docs.

## Acceptance Criteria

Storage setup passes only if:

- [ ] Render deploy succeeds.
- [ ] `/health` still returns OK.
- [ ] Upload still works.
- [ ] Real DashScope generation still works.
- [ ] Generated output opens from the stored URL.
- [ ] The stored URL remains available after refresh.
- [ ] `/admin/ops` shows the expected provider and output reference.
- [ ] No private key, signed URL, customer data, or private source-photo URL is committed.

## Failure Handling

If Render deploy fails:

- Revert `STORAGE_PROVIDER=none`.
- Redeploy.
- Confirm `/health` returns OK.
- Do not run more storage tests until the failing variable or token is identified.

If generation succeeds but storage copy fails:

- Confirm the output provider URL is still available.
- Check bucket name, token scope, account ID, and endpoint configuration.
- Keep public promotion paused until storage behavior is stable.

If output URLs do not open:

- Check whether `CLOUDFLARE_R2_PUBLIC_BASE_URL` is unset, wrong, or not connected to the bucket.
- Do not expose signed private URLs in public launch materials.
- Decide whether to add a public asset domain or require immediate download.

## Evidence To Save Outside The Repo

Save private evidence outside this repository:

- Cloudflare bucket settings screenshot.
- R2 token scope screenshot, with secrets hidden.
- Render environment screenshot, with secrets hidden.
- Ops dashboard job screenshot.
- Generated output sample, if approved for demo use.

Write only public-safe summaries into project docs.

## Public Launch Gate

Before broad public promotion:

- [ ] Storage is enabled and tested, or the site clearly tells users to download outputs immediately.
- [ ] At least one stored generated output remains accessible after refresh.
- [ ] The support team understands what to say if a user loses access to an output.
- [ ] The refund policy and support templates do not promise permanent hosting unless storage is confirmed.
