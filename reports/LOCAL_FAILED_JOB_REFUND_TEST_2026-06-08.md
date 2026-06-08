# MotionPic AI Local Failed-Job Refund Test 2026-06-08

## Scope

This is a local automated test using the mock video provider. It does not call DashScope, spend provider balance, modify production data, or prove a production provider failure.

## Assertions

The smoke suite now verifies that:

- A standard 4-second 720p mock job records a 2-credit debit.
- A simulated technical failure changes the job to `failed`.
- The same 2 credits are returned automatically.
- The account balance returns to its original starter balance.
- The ledger contains exactly one `video-debit` and one `video-refund` entry for the job.
- Reading the failed job again does not create a duplicate refund.

## Remaining Production Check

Keep the production failed-job refund checklist item open until an actual DashScope failure is safely observed or deliberately tested with owner approval. That test may spend provider balance and write production records.
