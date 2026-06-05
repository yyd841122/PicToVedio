# MotionPic AI Stage 1 Generation Results 2026-06-04

## Summary

Owner started the Stage 1 real-generation smoke test on the production site.

Important note: the pet test was blocked by the daily real-generation quota. This is not the same as credits being exhausted. The API message said credits were not deducted. This result should be treated as a quota guardrail event, not a failed pet-template quality result.

## Results

| Test | Template | Image type | Generation status | Output opens | Feedback | Credits behavior | Notes |
|---|---|---|---|---|---|---|---|
| Product | Product Motion | Toner / skincare product | Succeeded | Yes | Good | Deducted correctly | Product Motion passed the first owner smoke test. |
| Pet | Pet Motion | Cat | Blocked by daily generation quota | Not generated | Not rated | Credits not deducted according to quota message | Continue after quota reset or after owner explicitly raises Render daily caps. |
| Pet follow-up | Pet Motion | Cat | Succeeded | Yes | Good | Deducted | Owner reported a successful follow-up pet test. Owner also reported that one pre-reset attempt deducted credits, so quota visibility was added to `/account` for diagnosis. |

## Interpretation

- Product Motion is currently the first confirmed good Stage 1 output.
- The first Pet Motion attempt did not reach the provider because the daily quota guardrail stopped it.
- Pet Motion later passed a follow-up owner test with a good result.
- No evidence from this report suggests that credits were incorrectly deducted for the quota-blocked pet attempt.
- A separate owner observation says one pre-reset attempt deducted credits. Current code checks quota before debit, so the most likely next diagnostic step is comparing `/account` daily quota, recent jobs, and credit ledger timestamps.

## Recommended Next Step

Continue Stage 1 after the daily real-generation quota resets. The quota uses the server's UTC-day window, so for China time the reset is expected around 08:00 the next day.

Suggested remaining Stage 1 order:

1. Natural Portrait with the prepared person image.
2. Old Photo Alive with the prepared memory-style image.

Do not test Couple Kiss yet. It is experimental and should wait until the safer templates pass.

## Optional High-Risk Path

If the owner wants to continue testing today, they can raise the Render environment variables temporarily:

```env
MAX_DAILY_VIDEO_JOBS=10
MAX_DAILY_VIDEO_JOBS_PER_USER=5
```

This may spend more Alibaba Cloud/DashScope balance. It should only be done with explicit owner confirmation.
