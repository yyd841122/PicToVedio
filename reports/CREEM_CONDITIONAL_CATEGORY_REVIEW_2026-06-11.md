# Creem Conditional Category Review

Date: 2026-06-11

## Status

Creem replied that MotionPic AI should generally be acceptable if it does not save buyer data. Creem also stated that approval cannot be guaranteed because live access remains subject to KYC/KYB verification.

This is useful conditional category guidance. It is not final live-mode activation or a guarantee that KYC/KYB will pass.

## Current Data Boundary

MotionPic AI currently persists these limited payment records:

- Creem payment ID and webhook event ID.
- Internal MotionPic account ID.
- Product plan and granted credit amount.
- Provider and timestamps.
- Credit-ledger entries used for idempotency, refunds, and support.

MotionPic AI does not persist these fields in its payment tables:

- Full card number, security code, or payment credentials.
- Billing or shipping address.
- Buyer name, phone number, or buyer email.
- Full Creem customer, checkout, receipt, or webhook payload.

Supabase Auth separately processes the user's email address for magic-link login. The email is not copied into the MotionPic payment table. Because Creem's phrase "buyers' data" is broad, this account-email boundary and the limited transaction references should be confirmed with Creem before live activation.

## Controls Confirmed In Code

- Creem checkout sends only product ID, an opaque request ID, a same-origin success URL, and MotionPic plan/user metadata.
- The webhook handler extracts only event type, event ID, payment ID, internal user ID, and plan.
- Stored webhook rows contain only event ID, provider, type, and receive time.
- Analytics removes request, checkout, order, and customer identifiers from payment return URLs.
- Public browser roles cannot directly read the product tables.
- Static tests guard the payment schema and write paths against accidental buyer-profile or card fields.

## Remaining Gates

- Await Creem's answer on whether limited payment/event references and Supabase Auth email handling satisfy its condition. The clarification was sent on 2026-06-11.
- Complete Creem KYC/KYB and receive actual live-mode activation.
- Apply and test the reviewed Supabase atomic paid-credit RPC after explicit owner approval.
- Create or confirm live products and webhook only after live access is available.
- Change Render variables and run a real payment only after explicit owner confirmation.

## Clarification Sent

The following clarification was sent to Creem on 2026-06-11:

```text
Hi Nicole,

Thank you. To confirm the data boundary: MotionPic AI does not receive or store card details, security codes, billing addresses, or full Creem customer profiles/webhook payloads.

For fulfillment, duplicate prevention, refunds, and support, we retain only an internal account ID, Creem payment/event IDs, purchased plan, granted credits, and timestamps. Supabase Auth separately handles the user's email address for magic-link login, but the email is not stored in our payment table.

Does this limited setup satisfy the buyer-data condition you mentioned, subject to the normal KYC/KYB review?

Best,
Yingdong
```
