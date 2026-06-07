# MotionPic AI Email Operations Check

Date: 2026-06-07

## Scope

This report records the owner-confirmed support email setup and public DNS verification. No SMTP password, API key, private mailbox content, or DNS write credential is stored here.

## Confirmed

- `support@cozyguidehub.com` receives messages through Cloudflare Email Routing into the monitored Gmail inbox.
- Gmail can send as `MotionPic AI Support <support@cozyguidehub.com>` through Resend SMTP.
- An outbound test reached an external QQ mailbox with the expected sender identity.
- Gmail is configured to reply from the same address that received the message.
- The root domain keeps Cloudflare Email Routing MX records for inbound support mail.
- Resend DKIM is publicly resolvable at `resend._domainkey.cozyguidehub.com`.
- The Resend return-path MX and SPF records are publicly resolvable at `send.cozyguidehub.com`.
- DMARC is publicly resolvable at `_dmarc.cozyguidehub.com` with the monitoring policy `p=none`.

## Repeatable Check

Run:

```bash
npm run email:dns
```

The command reads only public DNS. It reports whether each required record is present without printing the DKIM public-key value or any private credential.

## Operating Notes

- Keep Resend and Gmail SMTP credentials out of the repository, screenshots, support replies, and chat.
- Review the monitored Gmail inbox regularly while the product is public.
- Keep DMARC at `p=none` during early monitoring. A stricter policy is a later owner-approved DNS change after legitimate senders are confirmed.
- Do not remove the root Cloudflare MX records when editing the separate `send` subdomain records.
