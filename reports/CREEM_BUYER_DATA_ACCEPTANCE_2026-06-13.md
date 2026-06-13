# Creem Buyer-Data Acceptance

Date: 2026-06-13

## Decision

Creem confirmed that MotionPic AI's current buyer-data boundary is acceptable.

Accepted scope:

- Internal account ID.
- Creem payment and event identifiers.
- Purchased plan, granted credits, and timestamps.
- Supabase Auth email handling kept separate from payment records.

MotionPic does not store full card data, security codes, billing addresses, sensitive payment information, or complete Creem customer/webhook objects.

## Remaining Status

- Buyer-data review: passed.
- Product-category guidance: acceptable subject to normal review.
- Individual identity verification: approved.
- China CNY Alipay payout verification: approved and linked to the store.
- Store verification center: ready for payments.
- Creem live-mode activation: pending.
- Render live payment variables: unchanged.
- Real payment: not authorized or performed.

Continue using Creem test mode until Creem enables live payments, the atomic paid-credit RPC is verified in test mode, and the owner explicitly approves the live switch.
