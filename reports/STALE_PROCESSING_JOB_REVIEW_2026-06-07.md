# MotionPic AI Stale Processing Job Review

Date: 2026-06-07

## Scope

Read-only review of the historical DashScope video job that remains in `processing` state in `/admin/ops`. No provider request was made, no database row was changed, and no credits were granted or refunded.

## Evidence

- The job was created on 2026-06-04.
- Provider is DashScope.
- Template is Pet.
- The job has a provider task ID.
- The job still has no succeeded or failed status in MotionPic.
- Later Pet, Old Photo, and Portrait jobs succeeded normally.
- Ops currently reports 11 succeeded jobs, 1 processing job, and 0 failed jobs.

Private job, user, provider-task, and output identifiers are intentionally excluded.

## Root Cause In The Current Architecture

MotionPic does not have a background reconciliation worker. A DashScope job is refreshed only when its owning user calls:

```text
GET /api/video/jobs/:id
```

The browser polls every four seconds for up to 90 attempts, roughly six minutes. If the browser closes, the network is interrupted, the poll reaches its limit, or the provider remains pending longer than the polling window, Supabase keeps the last known `processing` state.

Therefore the stale database state does not prove that DashScope is still processing the task.

## What Cannot Be Concluded

- It cannot be classified as succeeded without checking the provider task result.
- It cannot be classified as failed without checking the provider task result.
- Credits should not be refunded merely because the local row is old.
- The row should not be deleted merely to remove it from Ops.

## Safe Follow-Up

1. Use the private provider task ID to check the task in Alibaba Cloud / DashScope without sharing the ID publicly.
2. If the provider says `SUCCEEDED`, confirm whether a result URL still exists before deciding whether to reconcile the MotionPic row.
3. If the provider says `FAILED`, `CANCELED`, or `UNKNOWN`, compare the credit ledger before approving any refund.
4. If the provider cannot find the task, treat it as unresolved until billing and ledger evidence are compared.

Any reconciliation or refund would modify production data and requires separate owner approval.

## Preventive Improvement

`/admin/ops` now marks queued or processing jobs older than 30 minutes as `Stale processing`, displays their age, and explains that the notice is read-only. It does not call DashScope or alter production records.

Follow-up verification initially showed `1 pending / 0 stale`. The diagnostic now uses the job's `updated_at` timestamp, falling back to `created_at`, and normalizes PostgreSQL/Supabase timestamps with microseconds or a `+00` timezone suffix before calculating age. The production parser is covered by local smoke tests for these timestamp formats.
