# Deploy To Render And Cloudflare

This guide deploys MotionPic AI to:

```text
https://video.cozyguidehub.com
```

## 1. Push To GitHub

Create a new GitHub repository, then run these commands in this folder:

```bash
git init
git add .
git commit -m "Initial MotionPic AI MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Do not commit `.env`. It is ignored by `.gitignore`.

## 2. Create Render Web Service

1. Open Render: https://render.com/
2. Click `New +`
3. Choose `Web Service`
4. Connect your GitHub repo
5. Use:

```text
Name: motionpic-ai
Runtime: Node
Build Command: npm install
Start Command: npm start
Health Check Path: /health
```

Render will provide the `PORT` environment variable automatically.

## 3. Add Render Environment Variables

Add these in Render:

```env
APP_URL=https://video.cozyguidehub.com
VIDEO_PROVIDER=mock
DASHSCOPE_API_KEY=
DASHSCOPE_VIDEO_MODEL=wan2.6-i2v-flash
DASHSCOPE_AUDIO=false
DATA_PROVIDER=supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STORAGE_PROVIDER=none
PAYMENT_PROVIDER=creem
CREEM_TEST_MODE=true
CREEM_API_KEY=your_creem_api_key
CREEM_PRODUCT_CREATOR=prod_6Wza18GtJN57ME1FXSed2I
CREEM_PRODUCT_COMMERCE=prod_6YcTIRCZNVrZzwYXYqyKrH
CREEM_WEBHOOK_SECRET=
```

Leave `CREEM_WEBHOOK_SECRET` blank until you create the webhook in Creem.

Keep `VIDEO_PROVIDER=mock` until checkout and credits are stable. After the Alibaba Cloud Model Studio / Bailian API key is ready, set:

```env
VIDEO_PROVIDER=dashscope
DASHSCOPE_API_KEY=sk-...
DASHSCOPE_VIDEO_MODEL=wan2.6-i2v-flash
DASHSCOPE_AUDIO=false
```

Do not commit the full DashScope key. Add it only in Render Environment Variables or local `.env`.

## 4. Create Supabase Tables

In Supabase:

1. Create an organization and project on the free plan.
2. Open `SQL Editor`.
3. Paste the contents of `supabase.sql`.
4. Click `Run`.

Then open:

```text
Project Settings -> API
```

Copy these values into Render:

```env
SUPABASE_URL=Project URL
SUPABASE_SERVICE_ROLE_KEY=service_role secret
ANALYTICS_ADMIN_TOKEN=choose_a_long_private_password
```

Never paste `SUPABASE_SERVICE_ROLE_KEY` into public code or GitHub.

If your Supabase project was created before analytics tracking was added, run this in Supabase SQL Editor:

```sql
create table if not exists analytics_events (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  session_id text,
  name text not null,
  page text,
  referrer text,
  language text,
  properties jsonb not null default '{}'::jsonb,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_name_created
  on analytics_events(name, created_at desc);

create index if not exists idx_analytics_events_user_created
  on analytics_events(user_id, created_at desc);

alter table analytics_events disable row level security;
```

After deployment, you can check recent events at:

```text
https://video.cozyguidehub.com/api/admin/analytics?token=YOUR_ANALYTICS_ADMIN_TOKEN
```

## 5. Optional: Add Cloudflare R2 Object Storage

Use this before real traffic so uploaded photos and generated videos are stored by MotionPic instead of only relying on temporary provider URLs.

In Cloudflare:

1. Open `R2 Object Storage`.
2. Create a bucket, for example `motionpic-assets`.
3. Open `Manage R2 API Tokens`.
4. Create an API token with object read/write access to this bucket.
5. Copy:
   - Account ID.
   - Access Key ID.
   - Secret Access Key.
   - Bucket name.
6. Optional but recommended: connect a public custom domain to the bucket, for example `assets.cozyguidehub.com`.

In Render, add:

```env
STORAGE_PROVIDER=r2
CLOUDFLARE_R2_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
CLOUDFLARE_R2_BUCKET=motionpic-assets
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://assets.cozyguidehub.com
```

If your Supabase project was created before object storage support was added, run this in Supabase SQL Editor:

```sql
alter table video_jobs
  add column if not exists input_url text;
```

Then click `Save, rebuild, and deploy` in Render.

## 6. Add Custom Domain In Render

In the Render service:

```text
Settings -> Custom Domains -> Add Custom Domain
```

Add:

```text
video.cozyguidehub.com
```

Render will show a CNAME target.

## 7. Add DNS Record In Cloudflare

In Cloudflare:

```text
cozyguidehub.com -> DNS -> Records -> Add record
```

Use:

```text
Type: CNAME
Name: video
Target: the CNAME target from Render
Proxy status: DNS only
TTL: Auto
```

Wait until Render shows the domain as verified, then open:

```text
https://video.cozyguidehub.com
```

## 8. Configure Creem Webhook

After the custom domain works:

1. Open Creem
2. Go to `Developers -> API & Webhooks`
3. Create a webhook
4. URL:

```text
https://video.cozyguidehub.com/api/creem/webhook
```

5. Select payment success events such as:

```text
checkout.completed
order.created
payment.completed
```

6. Copy the webhook secret into Render:

```env
CREEM_WEBHOOK_SECRET=your_webhook_secret
```

Redeploy or restart the Render service.

## 9. Switch From Test Payments To Live Payments

Keep the current test setup until the whole flow is stable. When you are ready to accept real money:

1. Finish Creem identity, payout, and live store checks.
2. Create live products in Creem with the same package names:

```text
Creator Pack: $9 for 100 credits
Commerce Pack: $29 for 400 credits
```

3. Copy the live product ids into Render:

```env
CREEM_PRODUCT_CREATOR=live_creator_product_id
CREEM_PRODUCT_COMMERCE=live_commerce_product_id
```

4. Replace the test API key with the live Creem API key.
5. Set:

```env
CREEM_TEST_MODE=false
```

6. Create a live webhook in Creem:

```text
https://video.cozyguidehub.com/api/creem/webhook
```

7. Copy the live webhook signing secret into Render:

```env
CREEM_WEBHOOK_SECRET=live_webhook_signing_secret
```

8. Click `Save, rebuild, and deploy` in Render.

After deploy, create a low-price live product first if possible, pay once yourself, and confirm:

```text
/api/account credits increase
Supabase credit_ledger has creem-checkout
Supabase payments has the payment id
Supabase webhook_events has checkout.completed
```

## 10. Multilingual Launch URLs

The same app supports eight languages through the `lang` query parameter:

```text
https://video.cozyguidehub.com/?lang=en
https://video.cozyguidehub.com/?lang=zh
https://video.cozyguidehub.com/?lang=de
https://video.cozyguidehub.com/?lang=it
https://video.cozyguidehub.com/?lang=fr
https://video.cozyguidehub.com/?lang=es
https://video.cozyguidehub.com/?lang=ja
https://video.cozyguidehub.com/?lang=ko
```

For SEO, start with one language per traffic channel instead of publishing thin pages everywhere at once. English, Japanese, Korean, Spanish, French, German, Italian, and Chinese are wired into the UI language selector.
