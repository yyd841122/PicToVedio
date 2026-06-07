# MotionPic AI Controlled Live Status

Date: 2026-06-07

## Current Position

MotionPic AI is ready to remain online as a controlled test-mode MVP. It is not yet approved for broad paid promotion or Creem live mode.

No live payment, provider-spend test, object-storage write, search submission, or public launch post was performed during this status pass.

## Confirmed

- Production uses DashScope and the public health endpoint reports the deployed build safely.
- The selected pricing path is `$9 / 40 credits` and `$29 / 160 credits`.
- A standard 4-second 720p generation costs 2 credits.
- Current planning provider cost is CNY 0.60 per standard generation.
- Render uses daily generation caps of 10 sitewide and 2 per user.
- Four core templates have owner-reported Good outputs: Product Motion, Pet Motion, Old Photo Alive, and Natural Portrait.
- Successful jobs are visible in `/admin/ops`.
- Creem test checkout granted exactly 40 credits to the signed-in test account.
- Matching test payment, webhook, and credit-ledger evidence appeared in `/admin/ops`.
- Supabase Security Advisor shows 0 errors; server-only RLS-without-policy info items are intentional.
- Email login is active and anonymous paid checkout is gated.
- Public refund/support wording distinguishes technical failures from successful but aesthetically imperfect AI outputs.
- A test message to `support@cozyguidehub.com` reached the monitored Gmail destination through Cloudflare Email Routing.
- Resend verified `cozyguidehub.com`, and an outbound test reached an external mailbox as `MotionPic AI Support <support@cozyguidehub.com>`.
- Gmail is configured to reply from the same address that received the message.
- The historical processing job received a read-only review and stale diagnostics without provider calls or database changes.

## Pending External Decision

- Written Creem confirmation that MotionPic AI is eligible for live mode.

Do not create or configure live Creem products, live webhooks, live keys, or a real payment until this confirmation arrives and the owner explicitly approves the switch.

## Pending Owner Confirmation

- Confirm the final brand remains MotionPic AI.
- Confirm whether and when object storage should move from deferred to Cloudflare R2 or Alibaba Cloud OSS.
- Confirm a budget before the 20-generation quality matrix or any additional real DashScope tests.
- Confirm any provider reconciliation or database action for the historical stale processing job.
- Review and approve demo assets before they are made public.

## Acceptance Gaps

- No observed production provider failure has yet proven the automatic refund path end to end.
- The 20-generation quality matrix is incomplete.
- At least three safe demo files still need to be preserved outside expiring provider URLs and approved for public use.
- Actual net payment margin cannot be finalized until Creem live eligibility and fee details are known.
- Object storage is deferred, so users must download generated outputs promptly.
- Homepage browser-console UAT remains manual because the current browser automation policy blocked access to the production domain.

## Frozen High-Risk Actions

- Keep `CREEM_TEST_MODE=true`.
- Do not replace Render with live Creem credentials or product IDs.
- Do not perform a real payment.
- Do not run additional real DashScope generations without budget approval.
- Do not enable R2 or OSS.
- Do not submit IndexNow, Google, Bing, Baidu, directories, Product Hunt, Reddit, X, or Xiaohongshu.

## Next Trigger

The next commercial step begins when Creem replies in writing. At that point:

1. Review the exact approval and any restrictions.
2. Review live product names, prices, descriptions, and credit grants.
3. Create the live webhook and Render variable plan without exposing secrets.
4. Ask for explicit owner approval immediately before the live cutover and real payment.
