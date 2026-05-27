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
DATA_PROVIDER=supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PAYMENT_PROVIDER=creem
CREEM_TEST_MODE=true
CREEM_API_KEY=your_creem_api_key
CREEM_PRODUCT_CREATOR=prod_6Wza18GtJN57ME1FXSed2I
CREEM_PRODUCT_COMMERCE=prod_6YcTIRCZNVrZzwYXYqyKrH
CREEM_WEBHOOK_SECRET=
```

Leave `CREEM_WEBHOOK_SECRET` blank until you create the webhook in Creem.

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
```

Never paste `SUPABASE_SERVICE_ROLE_KEY` into public code or GitHub.

## 5. Add Custom Domain In Render

In the Render service:

```text
Settings -> Custom Domains -> Add Custom Domain
```

Add:

```text
video.cozyguidehub.com
```

Render will show a CNAME target.

## 6. Add DNS Record In Cloudflare

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

## 7. Configure Creem Webhook

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
