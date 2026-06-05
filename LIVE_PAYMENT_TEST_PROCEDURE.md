# MotionPic AI Live Payment Test Procedure

Last updated: 2026-06-05

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
| Email login | Homepage and `/account` show signed-in state; anonymous checkout redirects to `/login` |
| Test buyer | Owner confirms who will make the small live payment |
| Test amount | Owner confirms the smallest safe live product or test price |

Do not paste API keys, webhook secrets, full receipts, card details, or private customer data into repo files.

## Pricing Decision To Make First

Choose exactly one pricing path before creating live products or changing Render variables.

Recommended controlled-live path:

```text
Creator Pack: $9 for 40 credits
Commerce Pack: $29 for 160 credits
```

This is safer while the actual DashScope bill is still being confirmed. At 2 credits per standard 4-second 720p generation, the $9 pack gives about 20 standard generations.

Current marketing path:

```text
Creator Pack: $9 for 100 credits
Commerce Pack: $29 for 400 credits
```

This is acceptable only if you intentionally want the stronger "100 credits" offer and keep standard 4-second 720p generation at 2 credits or higher. At the current CNY 0.60 estimate, the $9 pack gives about 50 standard generations and leaves less room for payment fees, retries, support, and disliked outputs.

Do not create a Creem product that says one credit amount while Render grants another.

## Creem Live Setup Checklist

Owner steps in Creem:

1. Open the live Creem dashboard, not the test dashboard.
2. Confirm store identity, payout, and tax/business settings are complete enough for live payment.
3. Create or confirm the live `Creator Pack` product.
4. Set its price and description to match the selected pricing path.
5. Create or confirm the live `Commerce Pack` product.
6. Set its price and description to match the selected pricing path.
7. Copy the two live product IDs for Render. Do not paste secrets into the repository.
8. Create a live webhook endpoint with this URL:

```text
https://video.cozyguidehub.com/api/creem/webhook
```

9. Select the successful-checkout/payment event offered by Creem. Use `checkout.completed` if available. If Creem also offers equivalent successful payment events, enable them only if you are intentionally testing those event types.
10. Copy the live webhook signing secret for Render. Do not paste it into chat screenshots or repo files.
11. Copy the live API key for Render. Do not paste it into repo files.

Project compatibility notes:

- The app sends checkout requests to `https://test-api.creem.io` when `CREEM_TEST_MODE=true`.
- The app sends checkout requests to `https://api.creem.io` when `CREEM_TEST_MODE=false`.
- The app sends the Creem API key in the `x-api-key` header.
- The webhook verifier accepts `creem-signature` or `x-creem-signature` and verifies HMAC-SHA256 with `CREEM_WEBHOOK_SECRET`.
- The webhook handler grants credits from Render's `CREATOR_PACK_CREDITS` / `COMMERCE_PACK_CREDITS`, not from client-side browser values.

## Render Live Variable Checklist

Only update these after owner confirmation. Values shown here are placeholders or selected credit amounts, not secrets.

For the recommended controlled-live path:

```env
PAYMENT_PROVIDER=creem
CREEM_TEST_MODE=false
CREEM_API_KEY=live_api_key_from_creem
CREEM_PRODUCT_CREATOR=live_creator_product_id
CREEM_PRODUCT_COMMERCE=live_commerce_product_id
CREEM_WEBHOOK_SECRET=live_webhook_signing_secret
CREATOR_PACK_CREDITS=40
COMMERCE_PACK_CREDITS=160
CREATOR_PACK_PRICE_LABEL=$9
COMMERCE_PACK_PRICE_LABEL=$29
MAX_DAILY_VIDEO_JOBS=10
MAX_DAILY_VIDEO_JOBS_PER_USER=2
STARTER_CREDITS=2
```

For the current marketing path:

```env
PAYMENT_PROVIDER=creem
CREEM_TEST_MODE=false
CREEM_API_KEY=live_api_key_from_creem
CREEM_PRODUCT_CREATOR=live_creator_product_id
CREEM_PRODUCT_COMMERCE=live_commerce_product_id
CREEM_WEBHOOK_SECRET=live_webhook_signing_secret
CREATOR_PACK_CREDITS=100
COMMERCE_PACK_CREDITS=400
CREATOR_PACK_PRICE_LABEL=$9
COMMERCE_PACK_PRICE_LABEL=$29
MAX_DAILY_VIDEO_JOBS=10
MAX_DAILY_VIDEO_JOBS_PER_USER=2
STARTER_CREDITS=2
```

After saving Render variables, click `Save, rebuild, and deploy`, then wait for the deployment to finish before opening checkout.

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

1. In Creem, confirm live Creator and Commerce products match the selected pricing path.
2. In Creem, confirm the live webhook points to `https://video.cozyguidehub.com/api/creem/webhook`.
3. In Render, set live Creem variables and the matching credit-pack variables.
4. Wait for Render deployment to complete.
5. Open `https://video.cozyguidehub.com/health`.
6. Open the homepage in a normal browser.
7. If not signed in, click `Email Login`, complete magic-link login, and confirm the homepage shows the signed-in account state.
8. Record the signed-in account ID from `/account`.
9. Start checkout from the public site.
10. Complete the smallest approved live payment.
11. Return to the site.
12. Refresh `/account` and confirm credits increased.
13. Open `/admin/ops` with the private token.
14. Confirm payment, webhook, and credit ledger entries.
15. Run one approved 4-second 720p generation.
16. Confirm credits decrease by the intended amount.
17. Confirm the generated output opens.
18. Record result quality and provider cost.

## Immediate Rollback Variables

If live checkout has a problem and the owner approves rollback, use the smallest safe rollback:

```env
CREEM_TEST_MODE=true
```

If checkout buttons should stop creating real Creem checkouts while the site stays up, use:

```env
PAYMENT_PROVIDER=mock
```

Redeploy after either change and keep public promotion paused until the payment and credit records are understood.

## Acceptance Criteria

The controlled live payment test passes only if:

- [ ] Payment completes through live Creem checkout.
- [ ] Webhook is received once and deduplicated if retried.
- [ ] Supabase records the payment.
- [ ] Supabase records the webhook event.
- [ ] Credit ledger records the paid credit grant.
- [ ] Buyer credit balance persists after refresh.
- [ ] Buyer was signed in before checkout and the paid credits belong to the signed-in account.
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
