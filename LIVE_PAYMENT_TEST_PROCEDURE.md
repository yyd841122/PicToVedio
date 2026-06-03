# MotionPic AI Live Payment Test Procedure

Last updated: 2026-06-03

This procedure prepares the first controlled Creem live payment test. It is a documentation-only checklist. Do not configure Creem live mode, change Render variables, run Supabase SQL, perform a real payment, or inspect private payment records without owner confirmation.

## Purpose

The first live payment test should prove that a real payment can create durable credits and that the buyer can spend those credits on a real video generation. The test should be small, controlled, and fully recorded before any public promotion.

## Stop Before These Actions

Ask the owner before:

- Switching `CREEM_TEST_MODE=false`.
- Replacing `CREEM_API_KEY`.
- Replacing live product IDs.
- Replacing `CREEM_WEBHOOK_SECRET`.
- Creating or editing live Creem products.
- Creating or editing a live Creem webhook.
- Changing Render environment variables.
- Running a real payment.
- Inspecting private Supabase rows or admin dashboards.
- Manually changing user credits or payment records.

## Required Pre-Test Evidence

Collect these before the owner approves a live test:

| Item | Required evidence |
|---|---|
| Creem live store | Owner confirms live store and payout setup are ready |
| Live products | Product names, prices, credit grants, and product IDs are known |
| Live webhook | Webhook URL is `https://video.cozyguidehub.com/api/creem/webhook` |
| Render variables | Owner confirms the exact values to set, without exposing secrets in Git |
| Support email | Public support email is final and monitored |
| Refund policy | Public `/refund` page matches operating rules |
| Test buyer | Owner confirms who will make the small live payment |
| Test amount | Owner confirms the smallest safe live product or test price |

Do not paste API keys, webhook secrets, full receipts, card details, or private customer data into repo files.

## Pre-Test Product Checks

Before changing payment mode:

- [ ] `/health` returns `{"ok":true,"provider":"dashscope"}`.
- [ ] At least 5 real generation tests are recorded or the owner explicitly accepts the risk.
- [ ] Failed-generation credit refund behavior has been reviewed.
- [ ] Package credits and visible price labels are aligned with the intended live Creem products.
- [ ] Support email is final.
- [ ] The owner understands that AI outputs can be distorted and successful jobs are not automatically refunded for aesthetic imperfections.

## Controlled Live Payment Steps

Only run these after owner confirmation:

1. In Creem, confirm live Creator and Commerce products.
2. In Creem, confirm live webhook points to `https://video.cozyguidehub.com/api/creem/webhook`.
3. In Render, set live Creem variables and save/redeploy.
4. Wait for Render deployment to complete.
5. Open `https://video.cozyguidehub.com/health`.
6. Open the homepage in a normal browser.
7. Record the browser-local account ID from `/account`.
8. Start checkout from the public site.
9. Complete the smallest approved live payment.
10. Return to the site.
11. Refresh `/account` and confirm credits increased.
12. Open `/admin/ops` with the private token.
13. Confirm payment, webhook, and credit ledger entries.
14. Run one approved 4-second 720p generation.
15. Confirm credits decrease by the intended amount.
16. Confirm the generated output opens.
17. Record result quality and provider cost.

## Acceptance Criteria

The controlled live payment test passes only if:

- [ ] Payment completes through live Creem checkout.
- [ ] Webhook is received once and deduplicated if retried.
- [ ] Supabase records the payment.
- [ ] Supabase records the webhook event.
- [ ] Credit ledger records the paid credit grant.
- [ ] Buyer credit balance persists after refresh.
- [ ] Buyer can spend credits on one real generation.
- [ ] Generation job appears in `/admin/ops`.
- [ ] Output URL opens after completion.
- [ ] Provider cost is recorded in `UNIT_ECONOMICS.md` or the cost sampling worksheet.

## Failure Handling

If checkout succeeds but credits do not update:

- Stop public promotion.
- Do not manually grant credits until the owner confirms the payment record.
- Check whether the webhook secret, live product ID, and Render deployment are aligned.
- Check whether the webhook event was received and deduplicated.

If credits update but generation fails:

- Confirm whether credits were refunded automatically.
- Record the job status and provider error category.
- Do not run repeated paid tests until the failure reason is understood.

If the output is distorted but the job succeeded:

- Treat it as a quality issue, not an automatic refund.
- Record template, source image type, settings, and quality notes.
- Use the support templates if a user-facing reply is needed.

## Post-Test Rollback Options

If the live test exposes a problem, consider one of these owner-approved rollback paths:

- Switch `CREEM_TEST_MODE=true` again.
- Temporarily hide or de-emphasize buy-credit buttons.
- Keep checkout live but pause promotion.
- Reduce package credits or adjust visible copy after aligning Creem and Render.
- Keep generation in DashScope but stop additional paid tests until quality is reviewed.

## Evidence To Save Outside The Repo

Save private evidence outside this repo:

- Creem receipt or order screenshot.
- Render deployment screenshot.
- Supabase payment, webhook, and ledger screenshots.
- Admin ops screenshot.
- Generated video sample, if it is safe and approved for demo use.

Only public-safe summaries should be written into project documents.
