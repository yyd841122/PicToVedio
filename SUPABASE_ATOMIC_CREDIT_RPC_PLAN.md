# FrameVela AI Supabase Atomic Credit RPC Plan

Last updated: 2026-06-08

Status: planning only. Do not run SQL, change Render variables, or switch production code to these RPCs until the owner approves the exact rollout.

SQL draft file: `SUPABASE_ATOMIC_CREDIT_RPC_DRAFT.sql`.

Read-only preflight file: `SUPABASE_ATOMIC_CREDIT_PREFLIGHT_READONLY.sql`.

Local static review command:

```bash
npm run sql:check
```

## Why This Exists

The current Supabase path uses several REST calls for operations that should behave as one database transaction:

- paid credit grant: webhook event, payment row, user balance, and credit ledger;
- video debit: job row, user balance, and debit ledger;
- login merge: browser account balance and related rows moved into the email account.

The existing idempotency checks reduce duplicate grants, but they do not make the full operation atomic. A transient failure between REST calls can leave partial state that needs manual review.

## Highest Priority Fix

Move paid credit grants into one `security definer` Postgres RPC. The backend should call this from the Creem webhook handler instead of separately writing `webhook_events`, `payments`, `app_users`, and `credit_ledger`.

Proposed RPC name:

```text
public.motionpic_process_payment_credit
```

Proposed inputs:

```text
p_provider text
p_event_id text
p_event_type text
p_payment_id text
p_user_id text
p_plan text
p_credits integer
p_source text default 'creem-checkout'
```

Proposed return:

```text
credited boolean
balance integer
duplicate_reason text
```

Required behavior:

- Reject blank `payment_id`, blank `user_id`, unsupported provider, unsupported plan, or non-positive credits.
- Insert or keep the webhook event id without treating that alone as a completed credit grant.
- Create the user row with 0 credits if needed, then lock that row with `for update`.
- Use `credit_ledger.id = source || ':' || payment_id` as the canonical credit idempotency key.
- If the ledger row already exists, return `credited=false` and the stored `balance_after`.
- If the payment row exists but the ledger row does not, stop with a reconciliation error. The legacy multi-call path may already have changed the balance before failing, so automatically adding credits again could double-credit the account.
- If the payment row exists for a different user, plan, provider, or credit amount, raise an exception and do not change the balance.
- Insert the payment row when missing.
- Update `app_users.credits` and insert the ledger row in the same transaction.

## Secondary RPCs

After the payment RPC is proven, add transaction wrappers for generation and account migration.

Proposed generation debit RPC:

```text
public.motionpic_create_video_job_and_debit
```

It should lock `app_users`, reject insufficient credits before inserting a job, insert `video_jobs`, update credits, and insert `credit_ledger` in one transaction. It should return the remaining balance.

Proposed account merge RPC:

```text
public.motionpic_merge_browser_account
```

It should move the browser account balance and related rows to the authenticated `auth_...` account inside one transaction. A stronger browser-account ownership proof should be designed before broad paid traffic.

## Rollout Order

1. Owner confirms this migration can be prepared for the production Supabase project.
2. Draft SQL is reviewed locally with `npm run sql:check` and kept out of chat screenshots that contain secrets.
3. Owner runs `SUPABASE_ATOMIC_CREDIT_PREFLIGHT_READONLY.sql` and confirms it returns zero payment rows without matching ledger entries.
4. Owner opens Supabase SQL Editor and runs only the approved SQL.
5. Verify that the function exists and only `service_role` can execute it.
6. Confirm the deployed backend includes the default-off `SUPABASE_ATOMIC_CREDIT_RPC` integration.
7. Run local mock tests.
8. Keep Creem test mode enabled.
9. Set `SUPABASE_ATOMIC_CREDIT_RPC=true` in Render and deploy only after owner approval.
10. Run a Creem test checkout and confirm exactly one payment row, one ledger grant, and one balance increase.
11. Only after Creem category approval, owner may approve live-mode configuration.

## Rollback

If the RPC rollout fails before live payment:

1. Keep `CREEM_TEST_MODE=true`.
2. Revert the backend commit that calls the RPC.
3. Deploy the previous known-good build.
4. Leave the SQL function in place if it is unused, or drop it only after confirming no backend version calls it.

If the RPC rollout fails during a controlled live payment:

1. Stop live checkout by setting `CREEM_TEST_MODE=true` or `PAYMENT_PROVIDER=mock` after owner confirmation.
2. Do not manually add credits until the payment, webhook, and ledger state are inspected.
3. Use `/admin/ops` and Supabase read-only checks to identify whether payment, ledger, and balance agree.

## Owner Approval Required

This plan changes the production credit path and requires database SQL. It must not be executed without explicit owner confirmation.
