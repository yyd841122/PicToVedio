# MotionPic AI Unit Economics

Last updated: 2026-05-28

## Current Measured Cost

The first real DashScope image-to-video tests show that cost is the main risk before switching to live payments.

| Setting | Provider Cost | Notes |
| --- | ---: | --- |
| 4s / 720p / audio on | about CN¥1.20 per generation | Too expensive for the current $9 / 100 credits package. |
| 4s / 720p / audio off | about CN¥0.60 per generation | Better, but still needs careful credit pricing. |

The current site package display is still:

| Package | Price | Shown Credits |
| --- | ---: | ---: |
| Creator Pack | US$9 | 100 credits |
| Commerce Pack | US$29 | 400 credits |

At an estimated FX rate of roughly CN¥7.2 per US$1, Creator Pack revenue is about CN¥64.8 before Creem/payment fees. If one real generation costs 1 credit and each generation costs CN¥0.60, then 100 generations cost about CN¥60 before failed generations, retries, payment fees, server costs, and support. That margin is too thin for live launch.

## Margin Target

Target gross margin before fixed costs: 60% or more.

Assumptions for planning:

- Provider cost: CN¥0.60 per 4-second 720p generation.
- Payment/platform fees: keep a buffer of 8-15%.
- User retry or disliked-result rate: assume 20%.
- Failed provider jobs should refund credits.
- User-disliked but technically successful jobs should not automatically refund credits.

## Ops Dashboard Tracking

The private `/admin/ops` dashboard now shows internal cost and refund signals:

- Estimated provider cost for succeeded DashScope jobs.
- Credits spent on video generation jobs.
- Refunded credits from `video-refund` ledger entries.
- Estimated cost per succeeded job.

The estimate defaults to `ESTIMATED_VIDEO_COST_CNY=0.6` for one 4-second 720p silent DashScope job. Update this Render environment variable if the real Alibaba Cloud bill shows a different average. This number is only for planning and does not affect provider billing or user credits.

## Recommended Credit Rules

Do not price one real generation as one paid credit in live mode.

Implemented first version:

| Action | Suggested Credits | Reason |
| --- | ---: | --- |
| 4s / 720p preview | 2 credits | Keeps $9 pack from being loss-making. |
| 4s / 1080p export | 4 credits | Higher quality should be premium. |
| 4s / Pro export | 6 credits | Pro mode needs more margin for retries and quality checks. |
| 8s generation | 2x base cost | Longer duration costs more and may fail more often. |
| 12s generation | 3x base cost | Longer duration should stay premium. |
| High-risk creative templates, like kiss videos | +1 credit | Distortion and retry risk is higher. |

The backend recalculates this cost for every generation request. The browser can display the estimate, but the server does not trust a client-supplied `credits` value.

## Recommended Live Packages

Safer packages before live launch:

| Package | Price | Credits | Approx 4s Preview Count at 2 Credits |
| --- | ---: | ---: | ---: |
| Starter | US$9 | 40 credits | 20 generations |
| Creator | US$19 | 120 credits | 60 generations |
| Commerce | US$49 | 400 credits | 200 generations |

Alternative if the visible "100 credits" offer is kept:

- Keep Creator Pack at 100 credits.
- Charge 2 credits for a normal 4-second 720p generation.
- Charge 4+ credits for HD/no-watermark outputs.
- Add 1 credit for high-risk creative templates such as kiss videos.

This preserves the marketing appeal of "100 credits" while avoiding a near-zero margin.

## Quality And Cost Optimization

Current quality issue: portrait and face outputs can still distort, especially with stronger motion or intimate interaction prompts.

Immediate mitigations:

- Default to low-motion portrait templates.
- Avoid kiss/intimate templates as the default path.
- Keep `DASHSCOPE_AUDIO=false` unless audio becomes a paid feature.
- Use prompts that say: preserve exact face identity, stable facial features, natural blinking only, very subtle movement.
- Add negative prompts for distorted face, warped eyes, asymmetrical face, face morphing, blurry face, artifacts, exaggerated motion.
- Make 4s / 720p the default preview.

Future provider testing:

- Test Wan2.1/Wan2.2/Wan2.6 variants if available and compare cost/quality.
- Test Kling, MiniMax/Hailuo, Volcano/ByteDance, and Replicate-style providers if payment/recharge is easier.
- Keep a provider abstraction so MotionPic can route jobs by price, quality, and region.

## Before Live Payment

Do these before switching Creem to live mode:

- Update visible package copy and backend credit costs together.
- Add object storage for uploaded images and generated videos.
- Replace `demo-user` with anonymous device IDs or login.
- Decide refund policy for failed and disliked outputs.
- Run at least 20 real test generations across portrait, product, pet, and old photo templates.
- Record average cost, success rate, and user-acceptable quality rate.
