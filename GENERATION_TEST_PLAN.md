# MotionPic AI Generation Test Plan

Last updated: 2026-06-03

This document prepares the first real DashScope generation checks. It is a planning and recording guide only. Do not run real generations, spend API credits, change Render settings, or use private photos without owner confirmation.

## Goal

Run a small, controlled sample of real image-to-video jobs before broad public promotion or live paid traffic.

Minimum target before public promotion:

- At least 5 real DashScope generations completed or clearly diagnosed.
- At least 3 acceptable demo outputs saved for launch materials.
- Failed jobs refund credits through the ledger.
- Successful jobs are visible in `video_jobs`.
- Provider cost is recorded and compared with credit pricing.

## Safety Rules

- [ ] Use only photos owned by the operator or explicitly approved for testing.
- [ ] Avoid identifiable strangers.
- [ ] Avoid children, sensitive personal images, medical images, private family photos, and backend screenshots.
- [ ] Keep audio off for the first tests unless there is a specific reason to test audio.
- [ ] Do not publish demo outputs until the source-photo permissions and output quality are reviewed.
- [ ] Do not use real customer images in the first controlled test set.

## Recommended Test Matrix

| # | Image type | Template | Duration | Quality | Aspect ratio | Audio | Purpose |
|---|---|---|---:|---|---|---|---|
| 1 | Portrait/person | Creator / subtle motion | 4s | 720p | 9:16 | Off | Baseline face and identity preservation |
| 2 | Product photo | Product Video Ad | 4s | 720p | 9:16 | Off | Ecommerce demo quality |
| 3 | Pet photo | Pet Animation | 4s | 720p | 9:16 | Off | Pet anatomy and motion quality |
| 4 | Old photo | Old Photo Alive | 4s | 720p | 9:16 | Off | Memory-style demo quality |
| 5 | Couple photo | AI Kiss Video | 4s | 720p | 9:16 | Off | Optional romantic template review |
| 6 | Product photo | Product Video Ad | 4s | 720p | 1:1 or 16:9 | Off | Non-vertical layout behavior |
| 7 | Low-quality photo | Any safe template | 4s | 720p | 9:16 | Off | Failure-risk and distortion review |
| 8 | Best prior input | Same winning template | 4s | 1080p | 9:16 | Off | Cost and quality comparison after 720p passes |

Start with tests 1-4. Run tests 5-8 only after the first four results are reviewed.

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

- [ ] At least 5 real generations have been tested.
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

When the owner is ready, collect 4-5 safe test images and confirm that real DashScope generation may be run. After that confirmation, perform only the first 4 tests, record the results, and stop for review before testing optional romantic, low-quality, 1080p, or broader demo cases.
