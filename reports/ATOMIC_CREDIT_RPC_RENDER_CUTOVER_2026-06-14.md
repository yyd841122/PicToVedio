# Atomic Credit RPC Render Cutover 2026-06-14

## Approved Change

The owner explicitly approved enabling the production Render atomic-credit
feature flag.

The only Blueprint environment change was:

```env
SUPABASE_ATOMIC_CREDIT_RPC=true
```

No Creem live-mode value, product id, webhook secret, provider key, storage
setting, generation cap, or payment price was changed.

## Deployment

Commit `0babcf9` added the flag to `render.yaml` and was pushed to `main`.

The production `/health` endpoint later reported:

```text
ok=true
provider=dashscope
build=0babcf9
```

This confirms that Render deployed the approved Blueprint commit and the
application remained healthy on the existing video provider.

## Remaining Verification

No payment-credit RPC was called during this configuration change. No test or
real payment, credit, ledger, webhook, user, or video row was created or
modified by this verification.

The next transaction-level check is one controlled Creem test-mode payment. It
must confirm exactly one payment row, one matching credit-ledger grant, and one
balance increase, including idempotent handling of webhook retries.

Creem live payments remain disabled. A test-mode transaction writes production
application data and is not included in the approval for the Render environment
change.
