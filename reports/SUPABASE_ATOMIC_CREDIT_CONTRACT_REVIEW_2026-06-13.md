# Supabase Atomic Credit Contract Review 2026-06-13

## Scope

Reviewed the staged Supabase paid-credit RPC against the current `server.mjs`
caller, schema, preflight query, and static checks. No SQL was executed, no
Supabase data was read or changed, and no Render or Creem setting was modified.

## Application Contract

The backend and SQL function agree on:

- RPC name: `motionpic_process_payment_credit`.
- Provider, event, payment, user, plan, credit, and source parameter names.
- Return fields: `credited`, `balance`, and `duplicate_reason`.
- Default-off activation through `SUPABASE_ATOMIC_CREDIT_RPC=true`.
- Service-role-only server access through the Supabase REST RPC endpoint.

## Issues Corrected In The Draft

The earlier draft returned an existing ledger row as a duplicate without first
checking that its user, amount, source, external payment id, and plan matched the
new request. The draft now raises a conflict for mismatched ledger data and
requires a matching payment row before returning a duplicate result.

The earlier draft also allowed one existing webhook event id to be paired with a
different payment id. The event row is now locked, and an event already linked
to another payment raises a conflict. This prevents concurrent or malformed
replays from using one event id for multiple credit grants.

After the first production installation attempt returned a syntax error at
`IF NOT FOUND`, the draft was changed to use explicit boolean row-found flags
for event, user, payment, and ledger lookups. This preserves the same behavior
without relying on the PL/pgSQL `FOUND` special variable.

The read-only preflight now reports:

- payments without their expected ledger row;
- payment and ledger field mismatches;
- checkout ledger rows without matching payments;
- event ids linked to more than one payment.

## Verification

`npm test` must pass after these draft-only changes. The SQL checks remain
structural checks and do not prove PostgreSQL compilation or production
behavior.

## Remaining Gate

Keep `SUPABASE_ATOMIC_CREDIT_RPC` disabled. Before any execution, the owner must
review the final SQL, run the read-only preflight, confirm zero rows or reconcile
every result, explicitly approve the SQL execution, and verify the RPC in Creem
test mode before any live payment configuration.
