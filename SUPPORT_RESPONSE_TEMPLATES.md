# MotionPic AI Support Response Templates

Last updated: 2026-06-07

These templates help answer early support messages about failed generations, distorted outputs, credits, duplicate payments, and demo-quality concerns. They are operator drafts only. Do not expose private tokens, provider logs, admin screenshots, Supabase data, or payment-provider dashboards in replies.

Public support email currently shown on the site: `support@cozyguidehub.com`.

The receive path was tested successfully through Cloudflare Email Routing to Gmail on 2026-06-07. The domain was also verified in Resend, an outbound test reached an external mailbox as `MotionPic AI Support <support@cozyguidehub.com>`, and Gmail was configured to reply from the same address that received the message. Public DKIM, SPF, return-path MX, and DMARC records were also verified.

Keep the Resend SMTP/API credential private. It belongs only in the mail-client SMTP configuration or another approved secret store, never in the repository, screenshots, support replies, or chat.

## Response Rules

- Keep the reply factual and calm.
- Ask for the browser account ID only when it is needed to identify credit or job records.
- Ask for an order ID only for payment-related questions.
- Ask whether a generation failed technically or completed with a poor-quality result before discussing credits.
- Do not promise that AI outputs will be distortion-free.
- Do not promise refunds for successful but aesthetically imperfect generations.
- Do not ask users to email private photos unless an owner-approved review requires it.
- Do not share internal provider costs, API keys, webhook payloads, or private dashboard screenshots.
- Escalate anything involving live payments, legal complaints, privacy deletion, or suspected abuse to the owner before acting.

## Failed Generation With Credits Charged

Subject:

```text
MotionPic AI generation issue
```

Reply:

```text
Hi,

Thanks for letting us know. If the AI video request failed technically, MotionPic AI is designed to return the credits for that failed job.

Please send us:
- Your MotionPic account ID from the /account page
- The approximate time of the generation
- The template and settings you used
- Whether the job showed a failed/error state or completed with an output

We will check the job record and credit ledger. If the failed job did not refund credits automatically, we will review it and correct the credit balance where appropriate.

Thanks,
MotionPic AI Support
```

## Distorted But Successful Output

Subject:

```text
MotionPic AI output quality review
```

Reply:

```text
Hi,

Thanks for trying MotionPic AI and sharing the result. AI video outputs can vary, especially with faces, hands, pets, product edges, old photos, or low-resolution images.

If the job completed successfully, credits are not automatically refunded for aesthetic imperfections. Still, your feedback helps us improve templates and photo guidance.

For a cleaner result, please try:
- A sharp, well-lit source image
- One clear subject
- Minimal blur or heavy filters
- A 4-second 720p test before longer or higher-resolution generations
- A subtle-motion template for portraits and old photos

If you believe this was a technical failure rather than an output-quality issue, send your account ID from /account and the approximate generation time so we can review the job record.

Thanks,
MotionPic AI Support
```

## Duplicate Or Accidental Payment

Subject:

```text
MotionPic AI payment review
```

Reply:

```text
Hi,

Thanks for contacting us. We can review duplicate or accidental payments.

Please send:
- The order ID or payment receipt
- The email used for the purchase, if applicable
- Your MotionPic account ID from the /account page
- A short description of what happened

We will compare the payment record with the credit ledger and review the request according to the refund policy shown on the site.

Thanks,
MotionPic AI Support
```

## Login Or Account Access Issue

Subject:

```text
MotionPic AI account access help
```

Reply:

```text
Hi,

Thanks for reaching out. Email login helps keep credits, purchases, and generation history connected to your MotionPic account instead of only one browser.

Please send:
- The email address you used for login
- Your MotionPic account ID from /account, if you can access it
- Whether you changed browser, cleared storage, or used a different device
- A short description of what you expected to see

Please do not send passwords, private photos, payment card details, or screenshots that show private tokens.

Thanks,
MotionPic AI Support
```

## Credits Not Updated After Checkout

Subject:

```text
MotionPic AI credit balance review
```

Reply:

```text
Hi,

Thanks for the report. Credit updates can depend on the checkout return and payment webhook status.

Please send:
- Your order ID or checkout receipt
- Your MotionPic account ID from the /account page
- The approximate purchase time

We will check whether the payment was recorded and whether the credits were added to the correct account. If the payment succeeded and credits were not granted, we will review and correct the balance where appropriate.

Thanks,
MotionPic AI Support
```

## Privacy Or Uploaded Image Concern

Subject:

```text
MotionPic AI privacy request
```

Reply:

```text
Hi,

Thanks for reaching out. Please do not send private images in the support email unless we specifically request them.

To help us review your request, please send:
- Your MotionPic account ID from the /account page
- The approximate generation time
- A short description of the privacy concern

We will review the request according to the Privacy Policy and respond with the next safe step.

Thanks,
MotionPic AI Support
```

## Demo Asset Or Public Use Question

Subject:

```text
MotionPic AI demo output question
```

Reply:

```text
Hi,

Thanks for checking. Before publishing an AI video publicly, please make sure you own or have permission to use the source photo and that the output does not expose private information or identifiable people without consent.

For launch-quality demo assets, we recommend using owned product photos, pet photos with permission, or non-sensitive images. Avoid private family photos, children, medical images, and identifiable strangers unless you have explicit permission.

Thanks,
MotionPic AI Support
```

## Manual Review Checklist

Before replying to a support request, check:

- [ ] Is this about a failed technical job or a successful but imperfect output?
- [ ] Does the user provide a MotionPic account ID from `/account`?
- [ ] Does a payment issue include an order ID or receipt?
- [ ] Does the request involve private photos or personal data?
- [ ] Does the response avoid exposing private dashboards, keys, logs, or provider data?
- [ ] Does the response match the public Refund Policy wording?

## Needs Owner Confirmation

Stop and ask the owner before:

- Issuing a live payment refund.
- Changing credit balances manually.
- Inspecting private Supabase records.
- Sharing any private logs or admin screenshots.
- Responding to legal, abuse, or data-deletion requests.
- Changing the public refund, privacy, or terms wording.
