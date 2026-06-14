# Supabase Atomic Credit RPC Install Attempt 2026-06-14

## Result

The first owner-approved production SQL execution failed with PostgreSQL error
`42601`, reporting a syntax error at `IF NOT FOUND`.

The script was wrapped in `begin` and `commit`, so the failed statement aborted
the transaction. No function or permission change was installed by this
attempt, and no payment, credit, ledger, or user data was changed.

The Supabase editor screenshot showed `commit` at line 136. The current approved
repository draft placed `commit` substantially later, so the failed execution
used an older saved query rather than the current repository file.

## Follow-Up

PostgreSQL documentation confirms that `IF NOT FOUND THEN` is valid PL/pgSQL.
To remove ambiguity in the Supabase execution path, the draft now uses explicit
boolean row-found flags instead of the `FOUND` special variable.

The revised draft must pass local static tests and then be copied into a new
Supabase query tab and executed as a fresh full query. The old saved query must
not be rerun. The feature flag remains disabled, and Render is unchanged.
