# MotionPic AI Owner UAT Checklist

Last updated: 2026-06-03

This checklist is for owner acceptance testing before MotionPic AI moves from a controlled MVP to real paid traffic. It separates low-risk public checks from tests that require private access, real generation cost, live payment, storage writes, or backend evidence.

## Purpose

Use this checklist to decide whether the product is ready for:

- controlled real generation testing,
- first live payment testing,
- object-storage cutover,
- public directory submissions,
- first promotion wave.

Do not paste API keys, live product IDs, webhook secrets, full receipts, private user data, provider logs, or dashboard screenshots into this repository.

## Low-Risk Public UAT

These checks can be done in a normal browser without private tokens:

- [ ] Homepage opens at `https://video.cozyguidehub.com/`.
- [ ] Homepage explains upload, templates, credits, and generation clearly.
- [ ] Template selection is understandable.
- [ ] Upload guidance is visible before selecting a file.
- [ ] Credit estimate changes with duration, quality, and high-risk templates.
- [ ] `/guides` opens and links to all guide pages.
- [ ] Template pages open and their CTAs return to the generator.
- [ ] Privacy, Terms, and Refund pages are visible from the footer.
- [ ] `/robots.txt` opens.
- [ ] `/sitemap.xml` opens.
- [ ] `/llms.txt` opens.
- [ ] `/indexnow-key.txt` opens.
- [ ] `/health` returns `{"ok":true,"provider":"dashscope"}`.

## Private Dashboard UAT

Requires owner token or logged-in private session:

- [ ] `/admin/analytics` requires the private analytics token in production.
- [ ] `/admin/ops` requires the private analytics token/session in production.
- [ ] Token is not left visible in screenshots or browser address bars after login.
- [ ] Analytics dashboard shows page views.
- [ ] Analytics dashboard shows upload events.
- [ ] Analytics dashboard shows generation events.
- [ ] Analytics dashboard shows checkout events.
- [ ] Ops dashboard shows recent users.
- [ ] Ops dashboard shows video jobs.
- [ ] Ops dashboard shows payments and webhook events.
- [ ] Ops dashboard shows credit ledger movements.
- [ ] Ops dashboard shows estimated provider cost and refund signals.

## Real Generation UAT

Requires explicit owner approval because it may spend provider credits:

- [ ] Owner provides or approves 4-5 safe test images.
- [ ] Test images are owned, licensed, or approved.
- [ ] No children, private family photos, medical images, or identifiable strangers are used without explicit consent.
- [ ] First test uses 4s / 720p / audio off.
- [ ] Product template succeeds or failure is recorded.
- [ ] Pet template succeeds or failure is recorded.
- [ ] Old Photo template succeeds or failure is recorded.
- [ ] Portrait / natural motion template succeeds or failure is recorded.
- [ ] Failed jobs refund credits.
- [ ] Successful jobs appear in `video_jobs`.
- [ ] Output URL opens after completion.
- [ ] At least 3 outputs are good enough for demo use before public promotion.
- [ ] Provider cost is recorded in `PROVIDER_COST_SAMPLING_WORKSHEET.md` or `UNIT_ECONOMICS.md`.

## Payment UAT

Requires owner confirmation and real payment readiness:

- [ ] Creem live store is verified.
- [ ] Live products match visible site package names.
- [ ] Live product prices match site copy.
- [ ] Live product credit grants match Render variables.
- [ ] Live webhook points to `https://video.cozyguidehub.com/api/creem/webhook`.
- [ ] Render live Creem variables are set by the owner or authorized operator.
- [ ] `CREEM_TEST_MODE=false` only after final confirmation.
- [ ] One small live payment succeeds.
- [ ] Buyer credits increase after checkout.
- [ ] Credits persist after refresh.
- [ ] Supabase records the payment.
- [ ] Supabase records the webhook event.
- [ ] Credit ledger records the paid grant.
- [ ] Buyer can spend credits on one approved generation.

## Storage UAT

Requires owner confirmation because it writes to object storage:

- [ ] Storage provider is selected.
- [ ] R2 or selected bucket is created.
- [ ] Token scope is limited to the intended bucket when possible.
- [ ] Render storage variables are set.
- [ ] `STORAGE_PROVIDER=r2` or selected provider is set only after confirmation.
- [ ] Upload still works after deploy.
- [ ] One approved test generation succeeds after storage is enabled.
- [ ] Generated output opens from stored URL.
- [ ] Output remains accessible after refresh.
- [ ] No private signed URL, key, or customer image URL is committed.

## Support And Policy UAT

- [ ] Public support email is final.
- [ ] Support inbox is monitored.
- [ ] Refund policy matches real operating behavior.
- [ ] Support templates are acceptable for failed generations.
- [ ] Support templates are acceptable for distorted but successful outputs.
- [ ] Privacy wording is acceptable for uploaded photos and generated videos.
- [ ] Terms wording is acceptable for acceptable use and AI output variation.

## Promotion UAT

Do not start broad promotion until:

- [ ] At least one live payment test passes, or owner explicitly chooses a free/test-only launch.
- [ ] At least 3 demo outputs or screenshots are ready.
- [ ] Demo assets do not expose private photos, private dashboards, or credentials.
- [ ] Directory submission copy is reviewed.
- [ ] Product Hunt or community posts are reviewed.
- [ ] UTM links are ready.
- [ ] Analytics is confirmed to capture launch traffic.

## Owner Acceptance Sign-Off

Use this section as a manual record. Do not include private IDs or secrets.

| Area | Status | Owner note |
|---|---|---|
| Public site | Pending | |
| Private dashboards | Pending | |
| Real generation | Pending | |
| Payment | Pending | |
| Storage | Pending | |
| Support and policy | Pending | |
| Promotion | Pending | |

## Stop Conditions

Pause launch work if any of these happen:

- Live checkout succeeds but credits do not update.
- Credits update but webhook or ledger records are missing.
- Real generation repeatedly fails or does not refund failed jobs.
- Output quality is too distorted for the priority templates.
- Storage deploy breaks upload or output links.
- Support email is not monitored.
- Any secret appears in a public file, screenshot, or repository.
