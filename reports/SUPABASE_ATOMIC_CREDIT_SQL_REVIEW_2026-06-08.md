# Supabase Atomic Credit SQL Review 2026-06-08

## Scope

Reviewed and drafted `SUPABASE_ATOMIC_CREDIT_RPC_DRAFT.sql` plus the read-only preflight file `SUPABASE_ATOMIC_CREDIT_PREFLIGHT_READONLY.sql`. No SQL was executed, no Supabase rows were read or changed, and no Render or Creem setting was modified.

`npm run sql:check` passes. This is a structural security check, not a PostgreSQL compilation test. No local PostgreSQL engine was available, so the function must still be reviewed by Supabase SQL Editor before owner-approved execution.

## Security Review

- The function uses `security definer` with an empty `search_path`.
- Every application table is schema-qualified with `public`.
- Execute permission is revoked from `public`, `anon`, and `authenticated`.
- Execute permission is granted only to `service_role`.
- The Render backend remains the only intended caller through Supabase REST RPC.

This follows Supabase's documented guidance to set an explicit empty `search_path` for security-definer functions and to revoke function execution from browser-facing roles.

## Transaction And Idempotency Review

- Webhook event, payment row, balance update, and ledger insert occur inside one function call and one database transaction.
- The user row is locked with `for update` before calculating the new balance.
- `source:payment_id` remains the canonical ledger idempotency key.
- A repeated webhook returns the stored ledger balance without granting credits again.
- A reused event or payment identifier with conflicting provider, user, plan, event type, or credit data raises an error.

## Legacy Partial-State Decision

The current production code writes payment, balance, and ledger in separate REST calls. If an old request failed after updating the balance but before inserting the ledger, a payment row could exist without a ledger row.

The RPC does not automatically repair that case because it cannot prove whether the balance was already increased. It raises a reconciliation error instead. Before applying the function, the owner must run `SUPABASE_ATOMIC_CREDIT_PREFLIGHT_READONLY.sql` and confirm it returns zero rows, or manually investigate each result.

## Remaining Before Execution

- Review the SQL in Supabase SQL Editor without running it.
- Run `SUPABASE_ATOMIC_CREDIT_PREFLIGHT_READONLY.sql`.
- Obtain explicit owner approval to execute the function creation and grants.
- After execution, enable `SUPABASE_ATOMIC_CREDIT_RPC=true` and verify it while Creem remains in test mode.

## Backend Integration Status

The backend integration is staged behind `SUPABASE_ATOMIC_CREDIT_RPC`, which defaults to `false`. When disabled, the existing payment path remains active. When enabled with Supabase as the active data provider, Creem and Stripe paid-credit grants call `rpc/motionpic_process_payment_credit`.

Ops and the local readiness report display whether the RPC path is active. The local smoke suite also verifies the legacy Creem webhook path grants a 40-credit Creator Pack exactly once when the same signed event is delivered twice.

No production environment variable was added or changed during this work.

Reference:

- Supabase database functions: https://supabase.com/docs/guides/database/functions
- Supabase API security: https://supabase.com/docs/guides/api/securing-your-api
