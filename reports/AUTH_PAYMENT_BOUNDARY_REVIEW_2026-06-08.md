# MotionPic AI Auth And Payment Boundary Review 2026-06-08

## Completed Low-Risk Fix

Checkout return URLs are now constrained to the configured `APP_URL` origin. Relative and same-origin URLs are preserved; external, protocol-relative, non-HTTP, malformed, or otherwise unsafe values fall back to the MotionPic homepage.

The same canonical-origin rule is used for the Supabase Magic Link callback. This avoids relying on a browser-supplied or proxy-forwarded host when creating authentication redirect URLs.

Local automated coverage verifies the accepted and rejected URL cases. No payment, provider generation, production database write, or external dashboard action was used for this review.

## Follow-Up Architecture Item

Anonymous browser accounts currently use a high-entropy browser ID as their practical ownership credential. Login can merge that anonymous account into an authenticated account. The ID is difficult to guess, but it is visible to the user for support purposes and is not a strong ownership proof.

Before broad paid traffic, consider a separate signed browser-account credential or server-issued device secret. A complete change needs a migration and compatibility plan so existing browser balances are not orphaned or incorrectly merged. Do not make this production-account change without an owner-approved rollout and rollback plan.

## Transactional Credit Follow-Up

Supabase credit changes, ledger writes, payment rows, and job writes currently span multiple REST operations. Idempotency checks reduce duplicate grants, but full atomic behavior would require a database transaction or RPC.

The Creem webhook currently records its event before every downstream credit-grant operation has completed. If a transient failure occurs after that record is saved, a provider retry can be treated as already processed. This is another reason to move event claiming, payment recording, balance updates, and ledger insertion into one reviewed database transaction.

Prepare and review a Supabase RPC migration before broad paid traffic. Running SQL or changing the production credit path requires explicit owner confirmation.
