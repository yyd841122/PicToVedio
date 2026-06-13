# Supabase Advisor Confirmation Guide

Use this after running `SUPABASE_SECURITY_FIX.sql` in the production Supabase SQL Editor.

## Goal

Confirm that Supabase no longer reports these critical warnings:

- `rls_disabled_in_public`
- `sensitive_columns_exposed`

The SQL fix already tightens access by enabling Row Level Security and removing direct public table grants. Supabase may still show the old warning until its advisor check is refreshed or the issue is resolved in the dashboard.

## Steps

1. Open the Supabase project dashboard.
2. Go to the security warning email and click `Resolve issue`, or open the Supabase dashboard section that lists Security Advisor issues.
3. Find the warnings for:
   - Table publicly accessible.
   - Sensitive data publicly accessible.
4. Click `Resolve issue`, `Refresh`, `Run checks`, or the closest available re-check action.
5. Confirm the warning is cleared or no longer marked critical.

## Production Smoke Test After Confirmation

After the advisor warning clears, check the live app still works:

1. Open `https://video.cozyguidehub.com/health`.
2. Confirm it returns:

```json
{"ok":true,"provider":"dashscope"}
```

3. Open `https://video.cozyguidehub.com/account`.
4. Confirm the account page still loads for the current anonymous browser user.
5. Open the private ops dashboard and confirm recent users, jobs, and ledger records still appear.

## Why This Is Safe

FrameVela AI does not use Supabase directly from public browser JavaScript. The public site talks to the Node backend, and the backend uses `SUPABASE_SERVICE_ROLE_KEY`. That means public `anon` and `authenticated` table access is not needed for the current architecture.

## If Something Breaks

Do not re-enable public table access. First check:

- Render has the correct `SUPABASE_URL`.
- Render has the correct `SUPABASE_SERVICE_ROLE_KEY`.
- The service was rebuilt after environment changes.
- Supabase SQL did not remove `service_role` grants.

The expected grants are backend-only `service_role` access to the FrameVela tables.
