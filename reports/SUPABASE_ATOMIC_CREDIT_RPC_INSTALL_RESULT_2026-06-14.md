# Supabase Atomic Credit RPC Install Result 2026-06-14

## Installation

The owner ran the complete current
`SUPABASE_ATOMIC_CREDIT_RPC_DRAFT.sql` in a new production Supabase SQL Editor
query with no selected fragment.

Supabase returned:

```text
Success. No rows returned
```

The transaction committed the
`public.motionpic_process_payment_credit(text,text,text,text,text,text,integer,text)`
function and its reviewed permissions.

## Read-Only Verification

The owner then ran
`SUPABASE_ATOMIC_CREDIT_RPC_VERIFY_READONLY.sql`. The query returned one row
with:

- `function_exists = true`;
- `security_definer = true`;
- `empty_search_path = true`;
- `service_role_execute = true`;
- `public_execute_revoked = true`;
- `anon_execute_revoked = true`;
- `authenticated_execute_revoked = true`;
- `only_service_role_execute = true`;
- `unexpected_execute_grantees = null`.

This confirms the exact function signature exists, uses `SECURITY DEFINER` with
an empty `search_path`, and grants non-owner execution only to `service_role`.

## Safety Boundary

The post-install verification was read-only and did not call the payment RPC or
change payment, credit, ledger, webhook, or user rows.

`SUPABASE_ATOMIC_CREDIT_RPC` remains unset or `false`, so the deployed
application still uses the existing payment-credit path. Enabling the RPC path
is a separate production Render configuration change and requires explicit
owner approval. Creem remains out of live mode, and no real payment was made.
