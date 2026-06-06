# MotionPic AI Provider Cost Sampling Worksheet

Last updated: 2026-06-06

This worksheet defines how to record DashScope generation cost samples after the owner confirms real provider testing. It is a planning document only. Do not run real generations, spend API credits, inspect private provider bills, or change Render settings without confirmation.

## Purpose

MotionPic AI needs a small but consistent cost sample before live payments. The goal is to compare real provider cost, credits charged, output quality, and refund behavior for the first priority templates.

Current confirmed baseline: owner confirmed Alibaba Cloud / DashScope charges CNY 0.60 per 4-second 720p audio-off use. Continue sampling because higher quality, longer duration, audio-on jobs, retries, or provider changes may have different costs.

Use this worksheet together with:

- `GENERATION_TEST_PLAN.md`
- `UNIT_ECONOMICS.md`
- `/admin/ops` cost and refund signals, when the owner provides authorized access

## Sampling Rules

- [ ] Start with 4-second 720p jobs.
- [ ] Keep `DASHSCOPE_AUDIO=false` for first samples.
- [ ] Test one variable at a time: template, aspect ratio, quality, duration, or audio.
- [ ] Record failed jobs separately from successful jobs.
- [ ] Do not average failed-job provider charges into successful-output cost unless the provider actually bills them.
- [ ] Do not update live pricing from one isolated generation.
- [ ] Use at least 5 controlled samples before changing `ESTIMATED_VIDEO_COST_CNY`.
- [ ] Use at least 20 controlled samples before making live-payment pricing decisions.

## Minimum Sample Set

| Sample | Template | Duration | Quality | Aspect ratio | Audio | Required before pricing? |
|---|---|---:|---|---|---|---|
| 1 | Creator / subtle motion | 4s | 720p | 9:16 | Off | Yes |
| 2 | Product Video Ad | 4s | 720p | 9:16 | Off | Yes |
| 3 | Pet Animation | 4s | 720p | 9:16 | Off | Yes |
| 4 | Old Photo Alive | 4s | 720p | 9:16 | Off | Yes |
| 5 | Best-performing prior template | 4s | 720p | 1:1 or 16:9 | Off | Yes |
| 6 | Best-performing prior template | 4s | 1080p | 9:16 | Off | Optional |
| 7 | Best-performing prior template | 8s | 720p | 9:16 | Off | Optional |
| 8 | Best-performing prior template | 4s | 720p | 9:16 | On | Optional, only if audio is being considered |

## Cost Log Template

Copy this table into a spreadsheet or append rows below after owner-approved tests.

| Date | Job ID | Template | Duration | Quality | Aspect | Audio | Status | Credits charged | Credits refunded | Provider cost CNY | Output usable? | Notes |
|---|---|---|---:|---|---|---|---|---:|---:|---:|---|---|
| 2026-06-03 | example-only | Product Video Ad | 4s | 720p | 9:16 | Off | succeeded | 2 | 0 | 0.60 | yes | Example row only; replace after confirmed tests |
| 2026-06-05 | owner-confirmed-baseline | Stage 1 core templates | 4s | 720p | 9:16 | Off | succeeded | 2 | 0 | 0.60 | yes | Owner confirmed billed unit cost is CNY 0.60 per use for the completed Stage 1 baseline. |

Do not keep private source-photo URLs, signed output URLs, API request IDs, customer emails, or provider dashboard screenshots in this repo.

## Metrics To Calculate

After the first confirmed sample set, calculate:

- Average provider cost per succeeded job.
- Average provider cost per usable output.
- Provider failure rate.
- Credit refund rate.
- Usable-output rate.
- Average credits charged per succeeded job.
- Estimated CNY cost per paid credit.
- Estimated gross margin for each credit pack.

## Pricing Review Formula

Use this rough planning formula before live payments:

```text
Paid pack revenue CNY
- payment/platform fee buffer
- average provider cost per usable output
- expected retry and failed-job buffer
- support and infrastructure buffer
= operating margin
```

Do not treat this as accounting. It is a launch-readiness estimate for pricing and risk control.

## Suggested Decision Gates

Keep current public payment mode blocked until:

- [ ] At least 5 controlled DashScope samples are recorded.
- [ ] At least 3 outputs are usable for demo or launch proof.
- [ ] Failed-job credit refunds are confirmed.
- [ ] `UNIT_ECONOMICS.md` reflects the observed cost range.
- [ ] `ESTIMATED_VIDEO_COST_CNY` is reviewed against observed cost.
- [ ] Credit pack values and Creem product descriptions are aligned before live mode.

## Do Not Do Without Confirmation

- [ ] Run DashScope jobs or other provider-cost-consuming tests.
- [ ] Open or export private provider billing screens.
- [ ] Change Render environment variables.
- [ ] Change Creem products or live payment settings.
- [ ] Manually edit user credits or payment records.
- [ ] Store private job, customer, or payment identifiers in this repo.
