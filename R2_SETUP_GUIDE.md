# Cloudflare R2 Setup Guide For FrameVela AI

This guide explains how to connect FrameVela AI to Cloudflare R2 so uploaded photos and generated videos are stored outside the browser and outside Render.

## Why This Matters

Right now the product can generate real videos, but production media storage is still optional. Before real traffic, uploaded images and generated videos should be stored in an object storage service.

R2 is Cloudflare's S3-compatible object storage. It is useful here because:

- Uploaded photos can survive page refreshes and redeploys.
- Generated video files can stay downloadable after the provider URL expires.
- Render does not need to store large user media.
- The app already has an optional R2 adapter.

## When To Do This

Do this before switching to real public paid traffic.

You can postpone it while:

- Testing the generator with your own photos.
- Testing Creem test payments.
- Improving SEO pages and analytics.

You should enable it before:

- Creem live payment.
- Public launch.
- Directory submissions that may bring real users.

## Step 1: Create The R2 Bucket

1. Open Cloudflare dashboard.
2. Choose your account.
3. Open `R2 Object Storage`.
4. Click `Create bucket`.
5. Use a simple bucket name, for example:

```text
motionpic-assets
```

6. Keep the bucket private at first if Cloudflare asks.
7. Create the bucket.

## Step 2: Create R2 API Tokens

1. In Cloudflare, open `R2 Object Storage`.
2. Find `Manage R2 API tokens`.
3. Click `Create API token`.
4. Use a name like:

```text
motionpic-render-r2
```

5. Select permissions that allow object writes and reads for the bucket.
6. Scope it to the `motionpic-assets` bucket if Cloudflare provides bucket-level scope.
7. Copy these values immediately:

```text
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
```

Do not commit these values to GitHub.

## Step 3: Find The Cloudflare Account ID

1. In Cloudflare dashboard, open the account home or Workers/R2 area.
2. Find `Account ID`.
3. Copy it for Render:

```text
CLOUDFLARE_R2_ACCOUNT_ID
```

## Step 4: Optional Public URL

The app can store files even without a public R2 URL, but public download links are easier if you set one.

Recommended later:

1. Add a custom domain for R2, for example:

```text
assets.cozyguidehub.com
```

2. Point it to the R2 bucket in Cloudflare.
3. Use this value in Render:

```text
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://assets.cozyguidehub.com
```

If you do not set a public base URL, generated records may use internal `r2://...` references and will not be ideal for user downloads.

## Step 5: Add Render Environment Variables

Open Render:

```text
motionpic-ai -> Environment
```

Add or update:

```text
STORAGE_PROVIDER=r2
CLOUDFLARE_R2_ACCOUNT_ID=your Cloudflare account id
CLOUDFLARE_R2_ACCESS_KEY_ID=your R2 access key id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your R2 secret access key
CLOUDFLARE_R2_BUCKET=motionpic-assets
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://assets.cozyguidehub.com
```

Then click:

```text
Save, rebuild, and deploy
```

## Step 6: Test After Deploy

After Render is live:

1. Open `https://video.cozyguidehub.com/health`.
2. Confirm it still returns a healthy provider response.
3. Open the homepage.
4. Upload a photo.
5. Generate a 4-second video.
6. Open the private ops dashboard:

```text
https://video.cozyguidehub.com/admin/ops
```

7. Check the latest video job:

- Status should become `succeeded`.
- Output link should open.
- Provider should still show DashScope.
- If `CLOUDFLARE_R2_PUBLIC_BASE_URL` is set, output URLs should use your asset domain.

## Current Project Variables

The app already reads these variables:

```text
STORAGE_PROVIDER
CLOUDFLARE_R2_ACCOUNT_ID
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
CLOUDFLARE_R2_BUCKET
CLOUDFLARE_R2_PUBLIC_BASE_URL
```

The app saves:

- Uploaded image data when R2 is enabled.
- Generated provider video output after the job succeeds.

## Safety Notes

- Never paste R2 secret keys into chat screenshots or GitHub files.
- Keep `STORAGE_PROVIDER=none` until the R2 bucket and token are ready.
- If a deploy fails after enabling R2, set `STORAGE_PROVIDER=none` and redeploy to restore generation without storage.
- Use one small test generation after enabling R2 before sending real users.

## Acceptance Checklist

- [ ] R2 bucket created.
- [ ] R2 access key created.
- [ ] Render variables added.
- [ ] Render redeployed successfully.
- [ ] Upload still works.
- [ ] Real DashScope generation still works.
- [ ] Generated output opens from the stored URL.
- [ ] Ops dashboard shows the stored output URL.
