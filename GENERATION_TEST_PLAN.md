# MotionPic AI Generation Test Plan

Last updated: 2026-06-03

This document prepares the first real DashScope generation checks. It is a planning and recording guide only. Do not run real generations, spend API credits, change Render settings, or use private photos without owner confirmation.

## Goal

Run a small, controlled sample of real image-to-video jobs before broad public promotion or live paid traffic.

Minimum target before public promotion:

- First run only the 4-test smoke set unless the owner approves more provider-spend.
- At least 20 real DashScope generations completed or clearly diagnosed before broad promotion.
- At least 3 acceptable demo outputs saved for launch materials.
- Failed jobs refund credits through the ledger.
- Successful jobs are visible in `video_jobs`.
- Provider cost is recorded and compared with credit pricing.

## Two-Stage Test Policy

Stage 1 is the controlled smoke test. Run tests 1-4 only after owner confirmation. Stop immediately if two jobs fail, credits do not refund, output URLs do not open, or quality is obviously unsuitable for all priority templates.

Stage 2 is the promotion-readiness sample. Run the full 20-test matrix only after Stage 1 is reviewed and the owner confirms the provider-spend budget. Do not run Stage 2 just because the checklist exists.

## Safety Rules

- [ ] Use only photos owned by the operator or explicitly approved for testing.
- [ ] Avoid identifiable strangers.
- [ ] Avoid children, sensitive personal images, medical images, private family photos, and backend screenshots.
- [ ] Keep audio off for the first tests unless there is a specific reason to test audio.
- [ ] Do not publish demo outputs until the source-photo permissions and output quality are reviewed.
- [ ] Do not use real customer images in the first controlled test set.

## Stage 1 Smoke Test Matrix

| # | Image type | Template | Duration | Quality | Aspect ratio | Audio | Purpose |
|---|---|---|---:|---|---|---|---|
| 1 | Portrait/person | Creator / subtle motion | 4s | 720p | 9:16 | Off | Baseline face and identity preservation |
| 2 | Product photo | Product Video Ad | 4s | 720p | 9:16 | Off | Ecommerce demo quality |
| 3 | Pet photo | Pet Animation | 4s | 720p | 9:16 | Off | Pet anatomy and motion quality |
| 4 | Old photo | Old Photo Alive | 4s | 720p | 9:16 | Off | Memory-style demo quality |

## Stage 2 20-Generation Quality Matrix

Use this only after the 4-test smoke set passes review.

| # | Image type | Template | Duration | Quality | Aspect ratio | Purpose |
|---|---|---|---:|---|---|---|
| 1 | Clear portrait | Natural Portrait | 4s | 720p | 9:16 | Baseline identity preservation |
| 2 | Half-body portrait | Natural Portrait | 4s | 720p | 9:16 | Clothing and body stability |
| 3 | Side-angle portrait | Natural Portrait | 4s | 720p | 9:16 | Face-angle risk |
| 4 | Portrait with busy background | Natural Portrait | 4s | 720p | 9:16 | Background drift risk |
| 5 | Single product on clean background | Product Motion | 4s | 720p | 9:16 | Best ecommerce case |
| 6 | Product with logo/text | Product Motion | 4s | 720p | 9:16 | Logo and label stability |
| 7 | Lifestyle product photo | Product Motion | 4s | 720p | 9:16 | Real seller image quality |
| 8 | Product image square crop | Product Motion | 4s | 720p | 1:1 | Non-vertical product layout |
| 9 | Single pet face | Pet Motion | 4s | 720p | 9:16 | Pet face and eye stability |
| 10 | Full-body pet | Pet Motion | 4s | 720p | 9:16 | Pet anatomy stability |
| 11 | Pet with busy background | Pet Motion | 4s | 720p | 9:16 | Fur/background artifact risk |
| 12 | Older black-and-white portrait | Old Photo Alive | 4s | 720p | 9:16 | Memory demo baseline |
| 13 | Old family-style portrait | Old Photo Alive | 4s | 720p | 9:16 | Identity and mood stability |
| 14 | Low-resolution old photo | Old Photo Alive | 4s | 720p | 9:16 | Low-quality input risk |
| 15 | Clear two-person couple photo | Couple Kiss | 4s | 720p | 9:16 | Experimental romantic review |
| 16 | Couple photo with faces close | Couple Kiss | 4s | 720p | 9:16 | Face merge risk |
| 17 | Low-quality portrait | Natural Portrait | 4s | 720p | 9:16 | Unsuitable-photo behavior |
| 18 | Best product input | Product Motion | 4s | 1080p | 9:16 | HD quality/cost comparison |
| 19 | Best portrait input | Natural Portrait | 8s | 720p | 9:16 | Duration risk and cost comparison |
| 20 | Best overall input | Winning template | 4s | Pro | 9:16 | Premium-mode sanity check |

Stage 2 should still stop early if provider cost, refunds, or quality are worse than expected.

## Result Log Fields

Record each generation in a table or spreadsheet with these fields:

| Field | Notes |
|---|---|
| Date | Local test date |
| Source image type | Portrait, product, pet, old photo, etc. |
| Template | UI template selected |
| Aspect ratio | `9:16`, `1:1`, or `16:9` |
| Duration | 4s first |
| Quality | 720p first |
| Audio | Off first |
| Credits charged | Confirm server-calculated charge |
| Job status | queued, processing, succeeded, failed |
| Output URL present | Yes/no |
| Provider cost CNY | Actual or estimated DashScope cost |
| Identity score | 1-5 |
| Motion score | 1-5 |
| Artifact score | 1-5, lower is cleaner |
| Demo usability | Yes/no/maybe |
| Notes | Distortion, timing, refund behavior, or prompt issue |

## Quality Rubric

Use a 1-5 score where 5 is launch-ready and 1 is unusable.

- Identity preservation: the main subject still looks like the source photo.
- Motion naturalness: movement feels intentional rather than jittery.
- Artifact control: hands, faces, pets, product edges, and backgrounds stay coherent.
- Product shape: ecommerce objects are not warped beyond acceptable demo quality.
- Pet anatomy: face, legs, ears, and body proportions stay believable.
- Old-photo mood: the clip feels respectful and does not over-animate memories.
- Demo usability: the output is good enough for directories, social posts, or launch pages.

## Pass Criteria

Before public paid traffic, confirm:

- [ ] The 4-test smoke set has been tested and reviewed.
- [ ] At least 20 real generations have been tested or clearly diagnosed before broad promotion.
- [ ] At least 3 outputs are acceptable enough for demo use.
- [ ] Failed jobs refund credits.
- [ ] Successful jobs are saved in `video_jobs`.
- [ ] Output URLs remain accessible after refresh.
- [ ] Average provider cost is added to `UNIT_ECONOMICS.md`.
- [ ] `ESTIMATED_VIDEO_COST_CNY` is updated only if the observed cost differs materially.
- [ ] No priority demo asset has severe face, pet, product, or old-photo distortion.

## Do Not Do Without Confirmation

- [ ] Run actual DashScope generations.
- [ ] Spend API credits or make provider-cost-consuming tests.
- [ ] Use private, personal, family, or customer photos.
- [ ] Change Render environment variables.
- [ ] Run Supabase SQL or inspect private Supabase data.
- [ ] Configure Creem live mode or perform real payments.
- [ ] Write uploaded photos or generated videos to Cloudflare R2 or OSS.
- [ ] Publish demo outputs or submit them to directories/social platforms.

## Next Operator Action

When the owner is ready, collect 4-5 safe test images and confirm that real DashScope generation may be run. After that confirmation, perform only the Stage 1 smoke tests, record the results, and stop for review before running the 20-generation promotion-readiness matrix.
