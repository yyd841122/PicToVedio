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
- KYC/KYB: pending.
- Creem live-mode activation: pending.
- Render live payment variables: unchanged.
- Real payment: not authorized or performed.

Continue using Creem test mode until KYC/KYB passes, Creem enables live mode, and the owner explicitly approves the live switch.
