# MotionPic AI Stage 1 Generation Results 2026-06-04

## Summary

Owner started the Stage 1 real-generation smoke test on the production site.

Stage 1 is now complete for the four safer core templates: Product Motion, Pet Motion, Old Photo Alive, and Natural Portrait. All four successful real-generation outputs were reported as Good by the owner.

Important note: the pet test was blocked by the daily real-generation quota. This is not the same as credits being exhausted. The API message said credits were not deducted. This result should be treated as a quota guardrail event, not a failed pet-template quality result.

## Results

| Test | Template | Image type | Generation status | Output opens | Feedback | Credits behavior | Notes |
|---|---|---|---|---|---|---|---|
| Product | Product Motion | Toner / skincare product | Succeeded | Yes | Good | Deducted correctly | Product Motion passed the first owner smoke test. |
| Pet | Pet Motion | Cat | Blocked by daily generation quota | Not generated | Not rated | Credits not deducted according to quota message | Continue after quota reset or after owner explicitly raises Render daily caps. |
| Pet follow-up | Pet Motion | Cat | Succeeded | Yes | Good | Deducted | Owner reported a successful follow-up pet test. Owner also reported that one pre-reset attempt deducted credits, so quota visibility was added to `/account` for diagnosis. |
| Old photo | Old Photo Alive | Old / memory-style photo | Succeeded | Yes | Good | Deducted | Owner reported a successful old-photo test. |
| Portrait | Natural Portrait | Person / portrait photo | Succeeded | Yes | Good | Deducted correctly | Owner reported a successful portrait test. |

## Interpretation

- Product Motion, Pet Motion, Old Photo Alive, and Natural Portrait all have at least one owner-reported Good output.
- The first Pet Motion attempt did not reach the provider because the daily quota guardrail stopped it.
- Pet Motion later passed a follow-up owner test with a good result.
- No evidence from this report suggests that credits were incorrectly deducted for the quota-blocked pet attempt.
- A separate owner observation says one pre-reset attempt deducted credits. Current code checks quota before debit, so the most likely next diagnostic step is comparing `/account` daily quota, recent jobs, and credit ledger timestamps.

## Recommended Next Step

Stage 1 core-template testing is complete. Do not test Couple Kiss yet unless the owner explicitly wants to spend additional provider credits on an experimental romantic template.

Recommended next steps:

1. Save and preserve the four Good outputs as private candidate demo assets.
2. Record actual provider cost if available from Alibaba Cloud billing.
3. Continue to Stage 2 only after confirming the provider-spend budget for the 20-generation matrix.
4. Keep Couple Kiss out of public promotion until it has a separate reviewed test.

## Optional High-Risk Path

If the owner wants to continue larger-scale testing today, they can raise the Render environment variables temporarily:

```env
MAX_DAILY_VIDEO_JOBS=10
MAX_DAILY_VIDEO_JOBS_PER_USER=5
```

This may spend more Alibaba Cloud/DashScope balance. It should only be done with explicit owner confirmation.
