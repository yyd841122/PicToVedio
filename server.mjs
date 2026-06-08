import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formatJobAge, isStalePendingJob } from "./lib/job-status.mjs";
import { parseTimestampMs } from "./lib/timestamps.mjs";
import { safeSameOriginUrl } from "./lib/urls.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const dataDir = join(root, "data");
const dbPath = join(dataDir, "db.json");
const analyticsCookieName = "motionpic_analytics_admin";
const authCookieName = "motionpic_auth_session";

loadDotEnv();

const config = {
  port: Number(process.env.PORT || 8787),
  appUrl: process.env.APP_URL || "http://localhost:8787",
  videoProvider: process.env.VIDEO_PROVIDER || "mock",
  mockVideoFailure: process.env.MOCK_VIDEO_FAILURE === "true",
  dataProvider: process.env.DATA_PROVIDER || "file",
  supabaseUrl: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseAuthAnonKey: process.env.SUPABASE_AUTH_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "",
  authCookieSecret: process.env.AUTH_COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ANALYTICS_ADMIN_TOKEN || "motionpic-local-auth-cookie",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiVideoModel: process.env.OPENAI_VIDEO_MODEL || "sora-2",
  dashscopeApiKey: process.env.DASHSCOPE_API_KEY || "",
  dashscopeVideoModel: process.env.DASHSCOPE_VIDEO_MODEL || "wan2.6-i2v-flash",
  dashscopeAudio: process.env.DASHSCOPE_AUDIO === "true",
  dashscopePromptExtend: process.env.DASHSCOPE_PROMPT_EXTEND === "true",
  estimatedVideoCostCny: Number(process.env.ESTIMATED_VIDEO_COST_CNY || process.env.DASHSCOPE_ESTIMATED_COST_CNY || 0.6),
  maxDailyVideoJobs: readNonNegativeIntEnv(["MAX_DAILY_VIDEO_JOBS"], 10),
  maxDailyVideoJobsPerUser: readNonNegativeIntEnv(["MAX_DAILY_VIDEO_JOBS_PER_USER"], 2),
  maxUploadImageMb: readPositiveNumberEnv(["MAX_UPLOAD_IMAGE_MB"], 8),
  starterCredits: readNonNegativeIntEnv(["STARTER_CREDITS"], 2),
  paymentProvider: process.env.PAYMENT_PROVIDER || "mock",
  creemTestMode: process.env.CREEM_TEST_MODE !== "false",
  creemApiKey: process.env.CREEM_API_KEY || "",
  creemWebhookSecret: process.env.CREEM_WEBHOOK_SECRET || "",
  creemCreatorProduct: process.env.CREEM_PRODUCT_CREATOR || "",
  creemCommerceProduct: process.env.CREEM_PRODUCT_COMMERCE || "",
  creatorPackCredits: readPositiveIntEnv(["CREATOR_PACK_CREDITS", "CREEM_CREATOR_CREDITS"], 40),
  commercePackCredits: readPositiveIntEnv(["COMMERCE_PACK_CREDITS", "CREEM_COMMERCE_CREDITS"], 160),
  creatorPackPriceLabel: process.env.CREATOR_PACK_PRICE_LABEL || "$9",
  commercePackPriceLabel: process.env.COMMERCE_PACK_PRICE_LABEL || "$29",
  storageProvider: process.env.STORAGE_PROVIDER || "none",
  r2AccountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID || "",
  r2AccessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
  r2SecretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  r2Bucket: process.env.CLOUDFLARE_R2_BUCKET || "",
  r2PublicBaseUrl: (process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL || "").replace(/\/$/, ""),
  analyticsAdminToken: process.env.ANALYTICS_ADMIN_TOKEN || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripeCreatorPrice: process.env.STRIPE_PRICE_CREATOR || "",
  stripeCommercePrice: process.env.STRIPE_PRICE_COMMERCE || "",
  buildCommit: String(process.env.RENDER_GIT_COMMIT || "local").slice(0, 7),
};

ensureDb();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const server = createServer(async (req, res) => {
  applyBaseSecurityHeaders(res);

  try {
    const url = new URL(req.url || "/", config.appUrl);

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, {
        ok: true,
        provider: config.videoProvider,
        build: config.buildCommit,
        serverTime: new Date().toISOString(),
      });
    }

    if (req.method === "GET" && url.pathname === "/api/account") {
      return await handleGetAccount(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/video/jobs") {
      return await handleCreateVideoJob(req, res);
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/video/jobs/")) {
      return await handleGetVideoJob(req, res, url.pathname.split("/").pop());
    }

    if (req.method === "POST" && url.pathname === "/api/checkout") {
      return await handleCheckout(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/auth/magic-link") {
      return await handleAuthMagicLink(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/auth/session") {
      return await handleAuthSession(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      return handleAuthLogout(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/analytics/events") {
      return await handleRecordAnalyticsEvent(req, res);
    }

    if (req.method === "GET" && url.pathname === "/api/admin/analytics") {
      return await handleGetAnalyticsSummary(req, res, url);
    }

    if (req.method === "GET" && url.pathname === "/admin/analytics") {
      return await handleGetAnalyticsDashboard(req, res, url);
    }

    if (req.method === "GET" && url.pathname === "/api/admin/ops") {
      return await handleGetOpsSummary(req, res, url);
    }

    if (req.method === "GET" && url.pathname === "/api/admin/db-check") {
      return await handleGetDbCheck(req, res, url);
    }

    if (req.method === "GET" && url.pathname === "/api/admin/indexnow") {
      return await handleSubmitIndexNow(req, res, url);
    }

    if (req.method === "GET" && url.pathname === "/admin/ops") {
      return await handleGetOpsDashboard(req, res, url);
    }

    if (req.method === "POST" && url.pathname === "/admin/analytics/login") {
      return await handleAnalyticsAdminLogin(req, res);
    }

    if (req.method === "GET" && url.pathname === "/admin/analytics/logout") {
      return handleAnalyticsAdminLogout(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/checkout/mock-confirm") {
      return await handleMockConfirmPayment(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/creem/webhook") {
      return await handleCreemWebhook(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/stripe/webhook") {
      return await handleStripeWebhook(req, res);
    }

    if (req.method !== "GET") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} failed`, error);
    const publicError = publicErrorFromException(error);
    return sendApiError(res, publicError.status, publicError.code, publicError.message);
  }
});

server.listen(config.port, () => {
  console.log(`MotionPic AI listening on ${config.appUrl}`);
  console.log(`Video provider: ${config.videoProvider}`);
});

async function handleCreateVideoJob(req, res) {
  let body;
  try {
    body = await readJson(req);
  } catch (error) {
    const publicError = publicErrorFromException(error);
    return sendApiError(res, publicError.status, publicError.code, publicError.message);
  }
  const required = ["imageData", "prompt", "template", "ratio", "resolution", "seconds"];
  const missing = required.filter((key) => body[key] === undefined || body[key] === "");

  if (missing.length) {
    return sendApiError(res, 400, "MISSING_FIELDS", `Missing fields: ${missing.join(", ")}`);
  }

  const imageValidation = validateUploadImageDataUrl(body.imageData);
  if (!imageValidation.ok) {
    return sendApiError(res, imageValidation.status, imageValidation.code, imageValidation.message, {
      maxUploadImageMb: config.maxUploadImageMb,
    });
  }

  if (!["mock", "openai", "dashscope"].includes(config.videoProvider)) {
    return sendApiError(res, 503, "VIDEO_PROVIDER_UNAVAILABLE", "Video generation is temporarily unavailable.");
  }

  const cost = calculateCreditCost(body);
  const userId = getRequestUserId(req, body);
  const account = await getAccount(userId);

  if (account.credits < cost) {
    return sendApiError(res, 402, "INSUFFICIENT_CREDITS", "Not enough credits for this generation.", {
      remainingCredits: account.credits,
      requiredCredits: cost,
    });
  }

  const quota = await getVideoGenerationQuota(userId);
  if (quota.global.exceeded) {
    return sendApiError(
      res,
      429,
      "DAILY_VIDEO_JOB_LIMIT_REACHED",
      "Today's sitewide video generation limit has been used up. Please try again tomorrow.",
      quotaResponseFields(quota)
    );
  }

  if (quota.user.exceeded) {
    return sendApiError(
      res,
      429,
      "DAILY_USER_VIDEO_JOB_LIMIT_REACHED",
      "You've used today's video generation limit for this account. Please try again tomorrow.",
      quotaResponseFields(quota)
    );
  }

  const job = {
    id: randomUUID(),
    userId,
    provider: config.videoProvider,
    status: "queued",
    template: body.template,
    ratio: body.ratio,
    resolution: body.resolution,
    seconds: Number(body.seconds),
    credits: cost,
    prompt: body.prompt,
    createdAt: new Date().toISOString(),
    providerJobId: "",
    outputUrl: "",
    inputUrl: "",
    error: "",
  };

  const providerBody = { ...body };
  const storedInput = await maybeStoreUploadedImage(job, body.imageData);
  if (storedInput?.url) {
    job.inputUrl = storedInput.url;
    providerBody.imageData = storedInput.providerUrl || body.imageData;
  }

  let remainingCredits = await createJobAndDebit(job, cost);

  if (config.videoProvider === "openai") {
    try {
      const providerJob = await createOpenAiVideoJob(providerBody);
      job.status = providerJob.status || "queued";
      job.providerJobId = providerJob.id || "";
      job.outputUrl = providerJob.output_url || "";
      await maybeStoreGeneratedVideo(job);
    } catch (error) {
      job.status = "failed";
      job.error = providerFailureRecord(error);
      remainingCredits = await refundCreditsForFailedJob(job);
    }

    await saveJob(job);
  }

  if (config.videoProvider === "dashscope") {
    try {
      const providerJob = await createDashScopeVideoJob(providerBody);
      job.status = providerJob.status || "processing";
      job.providerJobId = providerJob.id || "";
      job.outputUrl = providerJob.outputUrl || "";
      await maybeStoreGeneratedVideo(job);
    } catch (error) {
      job.status = "failed";
      job.error = providerFailureRecord(error);
      remainingCredits = await refundCreditsForFailedJob(job);
    }

    await saveJob(job);
  }

  if (config.videoProvider === "mock") {
    if (config.mockVideoFailure) {
      job.status = "failed";
      job.error = "Video generation failed. Credits were refunded automatically. Mock failure used for local testing.";
      remainingCredits = await refundCreditsForFailedJob(job);
    } else {
      job.status = "succeeded";
      job.outputUrl = `${config.appUrl}/mock-output.mp4`;
    }
    await saveJob(job);
  }

  return sendJson(res, 200, { ...job, remainingCredits });
}

async function handleGetAccount(req, res) {
  const userId = getRequestUserId(req);
  const account = await getAccount(userId);
  const authSession = getAuthSession(req);
  return sendJson(res, 200, {
    userId,
    authenticated: Boolean(authSession),
    authAvailable: canUseSupabaseAuth(),
    email: authSession?.email || "",
    credits: account.credits,
    recentCredits: account.recentCredits,
    recentJobs: account.recentJobs,
    videoQuota: account.videoQuota,
    starterCredits: config.starterCredits,
    plans: packPlans(),
  });
}

async function handleRecordAnalyticsEvent(req, res) {
  const body = await readJson(req);
  const name = sanitizeText(body.name, 80);
  if (!/^[a-z][a-z0-9_.:-]{1,79}$/i.test(name)) {
    return sendJson(res, 400, { error: "Invalid event name" });
  }

  const userId = getRequestUserId(req, body);
  const event = {
    id: randomUUID(),
    userId,
    sessionId: sanitizeText(body.sessionId, 120),
    name,
    page: sanitizeAnalyticsLocation(body.page),
    referrer: sanitizeAnalyticsLocation(body.referrer, true),
    language: sanitizeText(body.language, 12),
    properties: sanitizeAnalyticsProperties(body.properties),
    userAgent: sanitizeText(req.headers["user-agent"], 500),
    ipHash: hashClientIp(req),
    createdAt: new Date().toISOString(),
  };

  try {
    await recordAnalyticsEvent(event);
    return sendJson(res, 200, { ok: true, recorded: true });
  } catch (error) {
    console.warn("Analytics event failed", error.message);
    return sendJson(res, 200, { ok: true, recorded: false });
  }
}

async function handleGetAnalyticsSummary(req, res, url) {
  if (!canReadAdminAnalytics(req, url)) {
    return sendJson(res, 403, { error: "Analytics admin access denied" });
  }

  const limit = Math.min(500, Math.max(10, Number(url.searchParams.get("limit") || 200)));
  const events = await getRecentAnalyticsEvents(limit);
  const summary = summarizeAnalyticsEvents(events);

  return sendJson(res, 200, {
    total: summary.total,
    byName: summary.byName,
    byPage: summary.byPage,
    recent: events.slice(0, 50),
  });
}

async function handleGetAnalyticsDashboard(req, res, url) {
  const queryToken = url.searchParams.get("token") || "";
  if (config.analyticsAdminToken && queryToken && queryToken === config.analyticsAdminToken) {
    setAnalyticsAdminCookie(req, res);
    return redirect(res, "/admin/analytics");
  }

  if (!canReadAdminAnalytics(req, url)) {
    return sendHtml(res, 403, renderAnalyticsLoginPage(Boolean(queryToken)));
  }

  const limit = Math.min(1000, Math.max(50, Number(url.searchParams.get("limit") || 500)));
  const events = await getRecentAnalyticsEvents(limit);
  const summary = summarizeAnalyticsEvents(events);
  return sendHtml(res, 200, renderAnalyticsDashboard(summary, url));
}

async function handleGetOpsSummary(req, res, url) {
  if (!canReadAdminAnalytics(req, url)) {
    return sendJson(res, 403, { error: "Admin access denied" });
  }

  const limit = Math.min(200, Math.max(10, Number(url.searchParams.get("limit") || 50)));
  return sendJson(res, 200, await getAdminOpsData(limit));
}

async function handleGetDbCheck(req, res, url) {
  if (!canReadAdminAnalytics(req, url)) {
    return sendJson(res, 403, { error: "Admin access denied" });
  }

  const base = {
    dataProvider: config.dataProvider,
    supabaseConfigured: Boolean(config.supabaseUrl && config.supabaseServiceRoleKey),
    supabaseKeyType: supabaseKeyType(config.supabaseServiceRoleKey),
    usesBearerAuthorization: Boolean(requiresSupabaseBearerToken(config.supabaseServiceRoleKey)),
  };

  if (!useSupabase()) {
    return sendJson(res, 200, { ok: false, ...base, error: "Supabase is not configured as DATA_PROVIDER." });
  }

  const startedAt = Date.now();
  try {
    const account = await getAccount("demo-user");
    return sendJson(res, 200, {
      ok: true,
      ...base,
      ms: Date.now() - startedAt,
      demoUserCredits: account.credits,
      recentCredits: account.recentCredits.length,
      recentJobs: account.recentJobs.length,
    });
  } catch (error) {
    console.error("Supabase db-check failed", error);
    return sendJson(res, 500, {
      ok: false,
      ...base,
      ms: Date.now() - startedAt,
      error: String(error.message || error).slice(0, 500),
    });
  }
}

async function handleGetOpsDashboard(req, res, url) {
  const queryToken = url.searchParams.get("token") || "";
  if (config.analyticsAdminToken && queryToken && queryToken === config.analyticsAdminToken) {
    setAnalyticsAdminCookie(req, res);
    return redirect(res, "/admin/ops");
  }

  if (!canReadAdminAnalytics(req, url)) {
    return sendHtml(res, 403, renderAnalyticsLoginPage(Boolean(queryToken)));
  }

  const limit = Math.min(200, Math.max(10, Number(url.searchParams.get("limit") || 50)));
  const data = await getAdminOpsData(limit);
  return sendHtml(res, 200, renderOpsDashboard(data));
}

async function handleSubmitIndexNow(req, res, url) {
  if (!canReadAdminAnalytics(req, url)) {
    return sendJson(res, 403, { error: "Admin access denied" });
  }

  const origin = getPublicOrigin(req);
  const key = getIndexNowKey();
  const urls = getSitemapUrls()
    .filter((entry) => entry.startsWith(origin))
    .slice(0, 10000);

  if (!urls.length) {
    return sendJson(res, 400, {
      ok: false,
      error: "No public URLs found in sitemap.xml for this origin",
      origin,
    });
  }

  const payload = {
    host: new URL(origin).host,
    key,
    keyLocation: `${origin}/indexnow-key.txt`,
    urlList: urls,
  };

  try {
    const response = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.text();
    return sendJson(res, response.ok ? 200 : 502, {
      ok: response.ok,
      status: response.status,
      submitted: urls.length,
      keyLocation: payload.keyLocation,
      body: body.slice(0, 1000),
      urls,
    });
  } catch (error) {
    return sendJson(res, 502, {
      ok: false,
      error: error.message,
      submitted: urls.length,
      keyLocation: payload.keyLocation,
      urls,
    });
  }
}

async function handleAnalyticsAdminLogin(req, res) {
  const raw = await readRaw(req);
  const form = new URLSearchParams(raw);
  const token = String(form.get("token") || "");
  if (config.analyticsAdminToken && token === config.analyticsAdminToken) {
    setAnalyticsAdminCookie(req, res);
    return redirect(res, "/admin/analytics");
  }

  return sendHtml(res, 403, renderAnalyticsLoginPage(true));
}

function handleAnalyticsAdminLogout(req, res) {
  clearAnalyticsAdminCookie(req, res);
  return redirect(res, "/admin/analytics");
}

async function handleGetVideoJob(req, res, id) {
  const job = await getJob(id);
  let remainingCredits;

  if (!job) {
    return sendJson(res, 404, { error: "Job not found" });
  }

  const userId = getRequestUserId(req);
  if (job.userId !== userId) {
    return sendJson(res, 403, { error: "Job does not belong to this user" });
  }

  if (job.provider === "openai" && job.providerJobId && ["queued", "in_progress"].includes(job.status)) {
    try {
      const providerJob = await getOpenAiVideoJob(job.providerJobId);
      job.status = providerJob.status || job.status;
      job.outputUrl = providerJob.output_url || job.outputUrl;
      job.error = providerJob.error?.message || providerJob.error || job.error;
      if (job.status === "failed") {
        remainingCredits = await refundCreditsForFailedJob(job);
        job.error ||= "Video generation failed. Credits were refunded.";
      }
    } catch (error) {
      const publicError = publicVideoProviderError(error);
      return sendApiError(res, publicError.status, publicError.code, publicError.message);
    }
    await maybeStoreGeneratedVideo(job);
    await saveJob(job);
  }

  if (job.provider === "dashscope" && job.providerJobId && ["queued", "processing"].includes(job.status)) {
    try {
      const providerJob = await getDashScopeVideoJob(job.providerJobId);
      job.status = providerJob.status || job.status;
      job.outputUrl = providerJob.outputUrl || job.outputUrl;
      job.error = providerJob.error || job.error;
      if (job.status === "failed") {
        remainingCredits = await refundCreditsForFailedJob(job);
        job.error ||= "Video generation failed. Credits were refunded.";
      }
    } catch (error) {
      const publicError = publicVideoProviderError(error);
      return sendApiError(res, publicError.status, publicError.code, publicError.message);
    }
    await maybeStoreGeneratedVideo(job);
    await saveJob(job);
  }

  return sendJson(res, 200, remainingCredits === undefined ? job : { ...job, remainingCredits });
}

async function handleCheckout(req, res) {
  const body = await readJson(req);
  const plan = body.plan === "commerce" ? "commerce" : "creator";
  const authSession = getAuthSession(req);
  if (canUseSupabaseAuth() && !authSession) {
    return sendApiError(
      res,
      401,
      "LOGIN_REQUIRED",
      "Please log in with email before buying credits so your purchase is saved to your account."
    );
  }
  const userId = getRequestUserId(req, body);
  const returnUrl = safeSameOriginUrl(body.returnUrl, config.appUrl);
  const checkoutBody = { ...body, returnUrl };

  if (config.paymentProvider === "creem") {
    return await handleCreemCheckout(res, checkoutBody, plan, userId);
  }

  if (config.paymentProvider === "mock") {
    return sendJson(res, 200, {
      mock: true,
      error: "Payment provider is mock. Set PAYMENT_PROVIDER=creem after adding Creem keys.",
    });
  }

  const price = plan === "commerce" ? config.stripeCommercePrice : config.stripeCreatorPrice;

  if (!config.stripeSecretKey || !price) {
    return sendJson(res, 200, {
      mock: true,
      error: "Stripe is not configured. Set STRIPE_SECRET_KEY and price ids to enable real checkout.",
    });
  }

  const params = new URLSearchParams({
    mode: "payment",
    success_url: appendQuery(returnUrl, { checkout: "success" }),
    cancel_url: appendQuery(returnUrl, { checkout: "cancelled" }),
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    "metadata[plan]": plan,
    "metadata[userId]": userId,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const checkout = await response.json();
  if (!response.ok) {
    return sendJson(res, response.status, { error: checkout.error?.message || "Stripe checkout failed" });
  }

  await recordAnalyticsEventSafe({
    userId,
    name: "checkout_created",
    page: sanitizeAnalyticsLocation(returnUrl),
    properties: { provider: "stripe", plan },
  });

  return sendJson(res, 200, { url: checkout.url });
}

async function handleAuthMagicLink(req, res) {
  if (!canUseSupabaseAuth()) {
    return sendJson(res, 501, {
      ok: false,
      error: "Email login is not configured yet. Add SUPABASE_AUTH_ANON_KEY or SUPABASE_PUBLISHABLE_KEY in Render first.",
    });
  }

  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  if (!email) {
    return sendJson(res, 400, { ok: false, error: "Enter a valid email address." });
  }

  const redirectTo = safeSameOriginUrl("/auth-callback", config.appUrl);
  try {
    await supabaseAuthRequest(`otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: "POST",
      body: {
        email,
        create_user: true,
      },
    });
    return sendJson(res, 200, { ok: true, message: "Magic link sent. Check your email to continue." });
  } catch (error) {
    console.error("Supabase magic link request failed", error);
    return sendJson(res, 502, { ok: false, error: "Could not send the login email right now." });
  }
}

async function handleAuthSession(req, res) {
  if (!canUseSupabaseAuth()) {
    return sendJson(res, 501, { ok: false, error: "Email login is not configured yet." });
  }

  const body = await readJson(req);
  const accessToken = sanitizeText(body.accessToken, 4096);
  const browserUserId = sanitizeText(body.browserUserId, 120);
  if (!accessToken) {
    return sendJson(res, 400, { ok: false, error: "Missing login token." });
  }

  try {
    const authUser = await getSupabaseAuthUser(accessToken);
    const authUserId = authAppUserId(authUser.id);
    await mergeBrowserAccountIntoAuthAccount(browserUserId, authUserId);
    setAuthCookie(req, res, {
      userId: authUserId,
      email: normalizeEmail(authUser.email),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    });

    const account = await getAccount(authUserId);
    return sendJson(res, 200, {
      ok: true,
      userId: authUserId,
      email: normalizeEmail(authUser.email),
      credits: account.credits,
    });
  } catch (error) {
    console.error("Auth session creation failed", error);
    return sendJson(res, 401, { ok: false, error: "Login link is invalid or expired." });
  }
}

function handleAuthLogout(req, res) {
  clearAuthCookie(req, res);
  return sendJson(res, 200, { ok: true });
}

async function handleMockConfirmPayment(req, res) {
  if (!config.creemTestMode) {
    return sendJson(res, 403, { error: "Mock payment confirmation is only available in test mode" });
  }
  if (!isLocalRequest(req)) {
    return sendJson(res, 403, { error: "Mock payment confirmation is only available on localhost" });
  }

  const body = await readJson(req);
  const plan = body.plan === "commerce" ? "commerce" : "creator";
  const userId = getRequestUserId(req, body);
  const payment = creditAmountForPlan(plan);
  const result = await grantCredits({
    userId,
    amount: payment.credits,
    source: "mock-confirm",
    externalId: `mock_${randomUUID()}`,
    plan,
  });
  return sendJson(res, 200, {
    ok: true,
    plan,
    creditsAdded: payment.credits,
    balance: result.balance,
  });
}

async function handleCreemCheckout(res, body, plan, userId) {
  const productId = plan === "commerce" ? config.creemCommerceProduct : config.creemCreatorProduct;
  const returnUrl = safeSameOriginUrl(body.returnUrl, config.appUrl);

  if (!config.creemApiKey || !productId) {
    return sendJson(res, 200, {
      mock: true,
      error: "Creem is not configured. Set CREEM_API_KEY and product ids to enable real checkout.",
    });
  }
  if (!isHttpHeaderValue(config.creemApiKey)) {
    return sendJson(res, 500, {
      error: "CREEM_API_KEY contains invalid characters. Paste the real Creem API key in Render Environment.",
    });
  }

  const baseUrl = config.creemTestMode ? "https://test-api.creem.io" : "https://api.creem.io";
  let response;
  try {
    response = await fetch(`${baseUrl}/v1/checkouts`, {
      method: "POST",
      headers: {
        "x-api-key": config.creemApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        request_id: randomUUID(),
        success_url: appendQuery(returnUrl, { checkout: "success", plan }),
        metadata: {
          plan,
          userId,
        },
      }),
    });
  } catch (error) {
    console.error("Creem checkout request failed", error);
    return sendJson(res, 502, { error: `Creem checkout request failed: ${error.message}` });
  }

  const checkout = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Creem checkout failed", response.status, checkout);
    return sendJson(res, response.status, { error: checkout.error || checkout.message || "Creem checkout failed" });
  }

  await recordAnalyticsEventSafe({
    userId,
    name: "checkout_created",
    page: sanitizeAnalyticsLocation(returnUrl),
    properties: { provider: "creem", plan, testMode: config.creemTestMode },
  });

  return sendJson(res, 200, { url: checkout.checkout_url || checkout.url });
}

async function handleCreemWebhook(req, res) {
  const rawBody = await readRaw(req);
  const signature = req.headers["creem-signature"] || req.headers["x-creem-signature"];

  if (!verifyHmacSignature(rawBody, signature, config.creemWebhookSecret)) {
    return sendJson(res, 400, { error: "Invalid Creem signature" });
  }

  const event = JSON.parse(rawBody);
  const type = event.eventType || event.type;
  const eventId = getEventId(event);
  const eventRecorded = await recordWebhookEvent({ id: eventId, provider: "creem", type });
  if (!eventRecorded) return sendJson(res, 200, { received: true, duplicate: true });

  if (["checkout.completed", "order.created", "payment.completed"].includes(type)) {
    const metadata = event.object?.metadata || event.data?.metadata || {};
    const userId = metadata.userId;
    const plan = metadata.plan;
    const paymentId = getPaymentId(event);

    if (userId && ["creator", "commerce"].includes(plan)) {
      const payment = creditAmountForPlan(plan);
      await grantCredits({
        userId,
        amount: payment.credits,
        source: "creem-checkout",
        externalId: paymentId,
        plan,
        provider: "creem",
        eventId,
      });
      await recordAnalyticsEventSafe({
        userId,
        name: "payment_credit_granted",
        properties: { provider: "creem", plan, credits: payment.credits, eventId },
      });
    }
  }

  return sendJson(res, 200, { received: true });
}

async function handleStripeWebhook(req, res) {
  const rawBody = await readRaw(req);
  const signature = req.headers["stripe-signature"];

  if (!verifyStripeSignature(rawBody, signature, config.stripeWebhookSecret)) {
    return sendJson(res, 400, { error: "Invalid Stripe signature" });
  }

  const event = JSON.parse(rawBody);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId || "demo-user";
    const plan = session.metadata?.plan || "creator";
    const payment = creditAmountForPlan(plan);
    await grantCredits({
      userId,
      amount: payment.credits,
      source: "stripe-checkout",
      externalId: session.id || getEventId(event),
      plan,
      provider: "stripe",
      eventId: getEventId(event),
    });
    await recordAnalyticsEventSafe({
      userId,
      name: "payment_credit_granted",
      properties: { provider: "stripe", plan, credits: payment.credits, eventId: getEventId(event) },
    });
  }

  return sendJson(res, 200, { received: true });
}

async function getAccount(userId) {
  if (useSupabase()) {
    await ensureSupabaseUser(userId);
    const users = await supabaseRequest(`app_users?id=eq.${filterValue(userId)}&select=id,credits&limit=1`);
    const ledger = await supabaseRequest(
      `credit_ledger?user_id=eq.${filterValue(userId)}&select=id,user_id,amount,source,external_id,plan,created_at,balance_after&order=created_at.desc&limit=5`
    );
    return {
      credits: Number(users[0]?.credits || 0),
      recentCredits: ledger.map(ledgerRowToEntry),
      recentJobs: await getRecentUserJobs(userId, 5),
      videoQuota: await getVideoGenerationQuota(userId),
    };
  }

  const db = readDb();
  normalizeDb(db);
  db.users[userId] ||= { credits: config.starterCredits };
  writeDb(db);
  const user = db.users[userId];
  return {
    credits: user.credits,
    recentCredits: db.creditLedger.filter((entry) => entry.userId === userId).slice(-5).reverse(),
    recentJobs: Object.values(db.jobs)
      .filter((job) => job.userId === userId)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 5),
    videoQuota: await getVideoGenerationQuota(userId),
  };
}

async function getRecentUserJobs(userId, limit = 5) {
  if (useSupabase()) {
    const rows = await supabaseRequest(
      `video_jobs?user_id=eq.${filterValue(userId)}&select=*&order=created_at.desc&limit=${limit}`
    );
    return rows.map(rowToJob);
  }

  const db = readDb();
  normalizeDb(db);
  return Object.values(db.jobs)
    .filter((job) => job.userId === userId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, limit);
}

async function getVideoGenerationQuota(userId) {
  const { start, end } = utcDayRange();
  if (config.videoProvider === "mock") {
    return {
      startAt: start,
      resetAt: end,
      global: { count: 0, limit: 0, remaining: 0, exceeded: false },
      user: { count: 0, limit: 0, remaining: 0, exceeded: false },
    };
  }

  const [globalCount, userCount] = await Promise.all([
    countRealVideoJobsToday(),
    countRealVideoJobsToday(userId),
  ]);

  return {
    startAt: start,
    resetAt: end,
    global: quotaBucket(globalCount, config.maxDailyVideoJobs),
    user: quotaBucket(userCount, config.maxDailyVideoJobsPerUser),
  };
}

function quotaBucket(count, limit) {
  const normalizedLimit = Math.max(0, Number(limit || 0));
  return {
    count,
    limit: normalizedLimit,
    remaining: Math.max(0, normalizedLimit - count),
    exceeded: count >= normalizedLimit,
  };
}

function quotaResponseFields(quota) {
  return {
    startAt: quota.startAt,
    resetAt: quota.resetAt,
    globalLimit: quota.global.limit,
    globalRemaining: quota.global.remaining,
    userLimit: quota.user.limit,
    userRemaining: quota.user.remaining,
  };
}

async function countRealVideoJobsToday(userId = "") {
  const { start, end } = utcDayRange();

  if (useSupabase()) {
    const limit = Math.max(1, Math.max(config.maxDailyVideoJobs, config.maxDailyVideoJobsPerUser) + 1);
    const userFilter = userId ? `&user_id=eq.${filterValue(userId)}` : "";
    const rows = await supabaseRequest(
      `video_jobs?provider=neq.mock${userFilter}&created_at=gte.${filterValue(start)}&created_at=lt.${filterValue(end)}&select=id&limit=${limit}`
    );
    return rows.length;
  }

  const db = readDb();
  normalizeDb(db);
  return Object.values(db.jobs).filter((job) => {
    if (job.provider === "mock") return false;
    if (userId && job.userId !== userId) return false;
    const createdAt = Date.parse(job.createdAt || "");
    return Number.isFinite(createdAt) && createdAt >= Date.parse(start) && createdAt < Date.parse(end);
  }).length;
}

function utcDayRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function nextUtcMidnightIso() {
  return utcDayRange().end;
}

async function createJobAndDebit(job, cost) {
  if (useSupabase()) {
    await ensureSupabaseUser(job.userId);
    const account = await getAccount(job.userId);
    if (account.credits < cost) {
      throw new Error("Not enough credits");
    }

    const remainingCredits = account.credits - cost;
    await supabaseRequest("video_jobs", {
      method: "POST",
      body: jobToRow(job),
      prefer: "return=minimal",
    });
    await supabaseRequest(`app_users?id=eq.${filterValue(job.userId)}`, {
      method: "PATCH",
      body: { credits: remainingCredits, updated_at: new Date().toISOString() },
      prefer: "return=minimal",
    });
    await supabaseRequest("credit_ledger", {
      method: "POST",
      body: {
        id: `video-debit:${job.id}`,
        user_id: job.userId,
        amount: -cost,
        source: "video-debit",
        external_id: job.id,
        plan: job.template,
        balance_after: remainingCredits,
      },
      prefer: "return=minimal",
    });
    return remainingCredits;
  }

  const db = readDb();
  normalizeDb(db);
  db.users[job.userId] ||= { credits: config.starterCredits };
  db.users[job.userId].credits -= cost;
  db.jobs[job.id] = job;
  db.creditLedger.push({
    id: `video-debit:${job.id}`,
    userId: job.userId,
    amount: -cost,
    source: "video-debit",
    externalId: job.id,
    plan: job.template,
    createdAt: new Date().toISOString(),
    balanceAfter: db.users[job.userId].credits,
  });
  writeDb(db);
  return db.users[job.userId].credits;
}

async function refundCreditsForFailedJob(job) {
  const result = await grantCredits({
    userId: job.userId,
    amount: Number(job.credits || 0),
    source: "video-refund",
    externalId: job.id,
    plan: "failed-video-job",
  });
  return result.balance;
}

async function getJob(id) {
  if (useSupabase()) {
    const jobs = await supabaseRequest(`video_jobs?id=eq.${filterValue(id)}&select=*&limit=1`);
    return jobs[0] ? rowToJob(jobs[0]) : null;
  }

  const db = readDb();
  return db.jobs[id] || null;
}

async function saveJob(job) {
  if (useSupabase()) {
    await supabaseRequest("video_jobs?on_conflict=id", {
      method: "POST",
      body: jobToRow(job),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
    return;
  }

  const db = readDb();
  normalizeDb(db);
  db.jobs[job.id] = job;
  writeDb(db);
}

async function recordWebhookEvent({ id, provider, type }) {
  if (useSupabase()) {
    const existing = await supabaseRequest(`webhook_events?id=eq.${filterValue(id)}&select=id&limit=1`);
    if (existing.length) return false;
    await supabaseRequest("webhook_events", {
      method: "POST",
      body: { id, provider, type },
      prefer: "return=minimal",
    });
    return true;
  }

  const db = readDb();
  normalizeDb(db);
  if (db.webhookEvents[id]) return false;
  db.webhookEvents[id] = {
    id,
    provider,
    type,
    receivedAt: new Date().toISOString(),
  };
  writeDb(db);
  return true;
}

async function recordAnalyticsEvent(event) {
  if (useSupabase()) {
    await ensureSupabaseUser(event.userId);
    await supabaseRequest("analytics_events", {
      method: "POST",
      body: analyticsEventToRow(event),
      prefer: "return=minimal",
    });
    return;
  }

  const db = readDb();
  normalizeDb(db);
  db.analyticsEvents.push(event);
  db.analyticsEvents = db.analyticsEvents.slice(-5000);
  writeDb(db);
}

async function recordAnalyticsEventSafe(event) {
  try {
    await recordAnalyticsEvent({
      id: event.id || randomUUID(),
      userId: event.userId || "demo-user",
      sessionId: event.sessionId || "",
      name: event.name,
      page: sanitizeAnalyticsLocation(event.page),
      referrer: sanitizeAnalyticsLocation(event.referrer, true),
      language: event.language || "",
      properties: sanitizeAnalyticsProperties(event.properties || {}),
      userAgent: event.userAgent || "",
      ipHash: event.ipHash || "",
      createdAt: event.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Analytics event failed", error.message);
  }
}

async function getRecentAnalyticsEvents(limit) {
  if (useSupabase()) {
    const rows = await supabaseRequest(
      `analytics_events?select=id,user_id,session_id,name,page,referrer,language,properties,created_at&order=created_at.desc&limit=${limit}`
    );
    return rows.map(rowToAnalyticsEvent);
  }

  const db = readDb();
  normalizeDb(db);
  return db.analyticsEvents.slice(-limit).reverse().map(sanitizeAnalyticsEventForRead);
}

async function getAdminOpsData(limit) {
  if (useSupabase()) {
    const [users, jobs, payments, ledger, webhooks] = await Promise.all([
      supabaseRequest(`app_users?select=id,credits,created_at,updated_at&order=updated_at.desc&limit=${limit}`),
      supabaseRequest(`video_jobs?select=*&order=created_at.desc&limit=${limit}`),
      supabaseRequest(`payments?select=id,provider,event_id,user_id,plan,credits,created_at&order=created_at.desc&limit=${limit}`),
      supabaseRequest(`credit_ledger?select=id,user_id,amount,source,external_id,plan,balance_after,created_at&order=created_at.desc&limit=${limit}`),
      supabaseRequest(`webhook_events?select=id,provider,type,received_at&order=received_at.desc&limit=${limit}`),
    ]);
    return await addOpsRuntimeConfig(summarizeOpsData({
      users: users.map(rowToAdminUser),
      jobs: jobs.map(rowToJob),
      payments: payments.map(rowToPayment),
      ledger: ledger.map(ledgerRowToEntry),
      webhooks: webhooks.map(rowToWebhookEvent),
    }));
  }

  const db = readDb();
  normalizeDb(db);
  return await addOpsRuntimeConfig(summarizeOpsData({
    users: Object.entries(db.users)
      .map(([id, user]) => ({
        id,
        credits: Number(user.credits || 0),
        createdAt: user.createdAt || "",
        updatedAt: user.updatedAt || "",
      }))
      .sort((a, b) => Number(b.credits || 0) - Number(a.credits || 0))
      .slice(0, limit),
    jobs: Object.values(db.jobs)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, limit),
    payments: Object.values(db.payments)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, limit),
    ledger: db.creditLedger
      .slice()
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, limit),
    webhooks: Object.values(db.webhookEvents)
      .sort((a, b) => String(b.receivedAt || "").localeCompare(String(a.receivedAt || "")))
      .slice(0, limit),
  }));
}

async function addOpsRuntimeConfig(data) {
  data.runtime = {
    videoProvider: config.videoProvider,
    dataProvider: useSupabase() ? "supabase" : config.dataProvider,
    paymentProvider: config.paymentProvider,
    storageProvider: config.storageProvider,
    authAvailable: canUseSupabaseAuth(),
    checkoutRequiresLogin: canUseSupabaseAuth(),
    creemTestMode: config.creemTestMode,
    creemApiKeyConfigured: Boolean(config.creemApiKey),
    creemCreatorProductConfigured: Boolean(config.creemCreatorProduct),
    creemCommerceProductConfigured: Boolean(config.creemCommerceProduct),
    creemWebhookConfigured: Boolean(config.creemWebhookSecret),
    creatorPackCredits: config.creatorPackCredits,
    commercePackCredits: config.commercePackCredits,
    creatorPackPriceLabel: config.creatorPackPriceLabel,
    commercePackPriceLabel: config.commercePackPriceLabel,
    maxDailyVideoJobs: config.maxDailyVideoJobs,
    maxDailyVideoJobsPerUser: config.maxDailyVideoJobsPerUser,
    maxUploadImageMb: config.maxUploadImageMb,
    todayRealVideoJobs: await countRealVideoJobsToday(),
    resetAt: nextUtcMidnightIso(),
    estimatedVideoCostCny: config.estimatedVideoCostCny,
  };
  data.livePaymentPreflight = buildLivePaymentPreflight(data.runtime);
  data.ownerActionChecklist = buildOwnerActionChecklist(data.runtime);
  return data;
}

function buildLivePaymentPreflight(runtime) {
  const creemProductsConfigured = runtime.creemCreatorProductConfigured && runtime.creemCommerceProductConfigured;
  const controlledCredits = runtime.creatorPackCredits === 40 && runtime.commercePackCredits === 160;
  const marketingCredits = runtime.creatorPackCredits === 100 && runtime.commercePackCredits === 400;
  const tightCaps = runtime.maxDailyVideoJobs <= 10 && runtime.maxDailyVideoJobsPerUser <= 2;

  return [
    {
      label: "Email Login",
      status: runtime.authAvailable ? "Ready" : "Missing",
      tone: runtime.authAvailable ? "tone-success" : "tone-danger",
      note: runtime.authAvailable ? "Magic-link login is configured." : "Add Supabase Auth public key before paid checkout.",
    },
    {
      label: "Checkout Login Gate",
      status: runtime.checkoutRequiresLogin ? "Active" : "Inactive",
      tone: runtime.checkoutRequiresLogin ? "tone-success" : "tone-warning",
      note: runtime.checkoutRequiresLogin ? "Anonymous checkout is blocked before paid sessions are created." : "Paid checkout can bind to browser-local accounts.",
    },
    {
      label: "Payment Provider",
      status: runtime.paymentProvider,
      tone: runtime.paymentProvider === "creem" ? "tone-success" : "tone-warning",
      note: runtime.paymentProvider === "creem" ? "Creem checkout path is selected." : "Set PAYMENT_PROVIDER=creem before a live payment test.",
    },
    {
      label: "Creem Mode",
      status: runtime.creemTestMode ? "Test mode" : "Live mode",
      tone: runtime.creemTestMode ? "tone-info" : "tone-warning",
      note: runtime.creemTestMode ? "Safe before owner approval; no live charges." : "Live charges are possible. Monitor payments and webhooks.",
    },
    {
      label: "Creem Secrets And Products",
      status: runtime.creemApiKeyConfigured && creemProductsConfigured && runtime.creemWebhookConfigured ? "Configured" : "Incomplete",
      tone: runtime.creemApiKeyConfigured && creemProductsConfigured && runtime.creemWebhookConfigured ? "tone-success" : "tone-warning",
      note: "Shows presence only; secret values are never displayed.",
    },
    {
      label: "Credit Packs",
      status: `${runtime.creatorPackPriceLabel}/${runtime.creatorPackCredits} + ${runtime.commercePackPriceLabel}/${runtime.commercePackCredits}`,
      tone: controlledCredits ? "tone-success" : marketingCredits ? "tone-info" : "tone-warning",
      note: controlledCredits
        ? "Matches the recommended controlled-live path."
        : marketingCredits
          ? "Marketing path; align Creem descriptions before live mode."
          : "Custom pack values; confirm site, Render, Creem, and webhook grants match.",
    },
    {
      label: "Daily Spend Caps",
      status: `${runtime.maxDailyVideoJobs} site / ${runtime.maxDailyVideoJobsPerUser} user`,
      tone: tightCaps ? "tone-success" : "tone-warning",
      note: tightCaps ? "Tight enough for the first live-payment test." : "Consider lowering caps before broader promotion.",
    },
    {
      label: "Storage",
      status: runtime.storageProvider,
      tone: runtime.storageProvider === "r2" ? "tone-success" : "tone-info",
      note: runtime.storageProvider === "r2" ? "Generated links can be made durable." : "Provider output links may expire; users should save outputs soon.",
    },
  ];
}

function buildOwnerActionChecklist(runtime) {
  return [
    {
      area: "Supabase",
      action: "Security Advisor was confirmed at 0 errors on 2026-06-07. Re-check after future schema or permission changes.",
      risk: "Keep core tables server-only; do not add public policies merely to remove informational notices.",
      status: "Passed",
      tone: "tone-success",
    },
    {
      area: "Creem",
      action: runtime.creemTestMode
        ? "Keep test mode until live products, webhook, pricing, and rollback are reviewed."
        : "Live mode appears selected. Watch payments, webhooks, and credit ledger immediately.",
      risk: "Can affect real checkout and customer credits.",
      status: runtime.creemTestMode ? "Waiting" : "Live risk",
      tone: runtime.creemTestMode ? "tone-warning" : "tone-danger",
    },
    {
      area: "Render",
      action: "Change live payment, storage, or generation-cap environment variables only after confirmation.",
      risk: "Can deploy new public behavior or change spending limits.",
      status: "Owner approval",
      tone: "tone-warning",
    },
    {
      area: "DashScope",
      action: "Run more real generation tests only when provider spend and test images are approved.",
      risk: "Each real run spends provider balance and may use private media.",
      status: "Owner approval",
      tone: "tone-warning",
    },
    {
      area: "Storage",
      action: "Enable R2/OSS only after bucket, keys, public URL, and output-link test plan are reviewed.",
      risk: "Can expose or break media delivery if configured incorrectly.",
      status: runtime.storageProvider === "r2" ? "Review active" : "Deferred",
      tone: runtime.storageProvider === "r2" ? "tone-warning" : "tone-info",
    },
    {
      area: "Promotion",
      action: "Submit search engines, directories, Product Hunt, Reddit, X, or Xiaohongshu only after launch gates pass.",
      risk: "Creates public traffic, user expectations, or paid listing cost.",
      status: "Do not publish",
      tone: "tone-warning",
    },
  ];
}

function summarizeOpsData(data) {
  const jobStatus = {};
  for (const job of data.jobs) {
    jobStatus[job.status || "unknown"] = (jobStatus[job.status || "unknown"] || 0) + 1;
  }

  const paymentCredits = data.payments.reduce((total, payment) => total + Number(payment.credits || 0), 0);
  const ledgerCredits = data.ledger.reduce((total, entry) => total + Number(entry.amount || 0), 0);
  const totalBalances = data.users.reduce((total, user) => total + Number(user.credits || 0), 0);
  const failedJobs = data.jobs.filter((job) => job.status === "failed");
  const pendingJobs = data.jobs.filter((job) => ["queued", "processing", "in_progress"].includes(job.status));
  const stalePendingJobs = pendingJobs.filter(isStalePendingJob);
  const succeededJobs = data.jobs.filter((job) => job.status === "succeeded");
  const estimatedProviderCostCny = roundMoney(
    succeededJobs.reduce((total, job) => total + estimateJobProviderCostCny(job), 0)
  );
  const jobCreditsSpent = data.ledger
    .filter((entry) => entry.source === "video-debit")
    .reduce((total, entry) => total + Math.abs(Number(entry.amount || 0)), 0);
  const refundEntries = data.ledger.filter((entry) => entry.source === "video-refund");
  const refundedCredits = refundEntries.reduce((total, entry) => total + Math.max(0, Number(entry.amount || 0)), 0);
  const averageCreditsPerSucceededJob = succeededJobs.length ? jobCreditsSpent / succeededJobs.length : 0;

  return {
    ...data,
    totals: {
      users: data.users.length,
      jobs: data.jobs.length,
      succeededJobs: succeededJobs.length,
      payments: data.payments.length,
      webhooks: data.webhooks.length,
      paymentCredits,
      ledgerCredits,
      totalBalances,
      failedJobs: failedJobs.length,
      pendingJobs: pendingJobs.length,
      stalePendingJobs: stalePendingJobs.length,
      refundEntries: refundEntries.length,
      refundedCredits,
      jobCreditsSpent,
      averageCreditsPerSucceededJob,
      estimatedProviderCostCny,
      estimatedCostPerSucceededJobCny: succeededJobs.length ? roundMoney(estimatedProviderCostCny / succeededJobs.length) : 0,
      jobStatus,
    },
  };
}

function buildUserAttribution(events) {
  const attribution = {};

  for (const event of [...events].reverse()) {
    if (!event.userId || attribution[event.userId]) continue;
    const channel = analyticsEventChannel(event, {});
    if (channel && channel !== "direct") attribution[event.userId] = channel;
  }

  return attribution;
}

function analyticsEventChannel(event, attributionByUser = {}) {
  const props = event.properties || {};
  const source = readEventProperty(props, ["utmSource", "utm_source"]);
  const medium = readEventProperty(props, ["utmMedium", "utm_medium"]) || "";
  const campaign = readEventProperty(props, ["utmCampaign", "utm_campaign"]) || "";

  if (source) {
    const parts = [source, medium, campaign].filter(Boolean).map((part) => normalizeChannelPart(part));
    return parts.join(" / ");
  }

  if (event.userId && attributionByUser[event.userId]) return attributionByUser[event.userId];

  const referrerHost = referrerHostname(event.referrer);
  if (referrerHost) return referrerHost;

  return "direct";
}

function readEventProperty(props, keys) {
  for (const key of keys) {
    if (props[key] === undefined || props[key] === null || props[key] === "") continue;
    return String(props[key]);
  }
  return "";
}

function normalizeChannelPart(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function referrerHostname(referrer) {
  if (!referrer) return "";
  try {
    const url = new URL(referrer);
    if (!url.hostname || url.hostname === SITE_URL.hostname) return "";
    return normalizeChannelPart(url.hostname);
  } catch {
    return "";
  }
}

function summarizeAnalyticsEvents(events) {
  const byName = {};
  const byPage = {};
  const users = new Set();
  const sessions = new Set();
  const attributionByUser = buildUserAttribution(events);
  const channelsByName = {};

  for (const event of events) {
    byName[event.name] = (byName[event.name] || 0) + 1;
    const page = event.page || "/";
    byPage[page] = (byPage[page] || 0) + 1;
    if (event.userId) users.add(event.userId);
    if (event.sessionId) sessions.add(event.sessionId);

    const channel = analyticsEventChannel(event, attributionByUser);
    channelsByName[channel] ||= {
      channel,
      events: 0,
      pageViews: 0,
      uploadClicks: 0,
      uploadSuccess: 0,
      generateClicks: 0,
      generateSuccess: 0,
      checkoutClicks: 0,
      checkoutRedirects: 0,
      paidCredits: 0,
    };

    const bucket = channelsByName[channel];
    bucket.events += 1;
    if (event.name === "page_view") bucket.pageViews += 1;
    if (event.name === "upload_click") bucket.uploadClicks += 1;
    if (event.name === "upload_success") bucket.uploadSuccess += 1;
    if (event.name === "generate_click") bucket.generateClicks += 1;
    if (event.name === "generate_success") bucket.generateSuccess += 1;
    if (event.name === "checkout_click") bucket.checkoutClicks += 1;
    if (event.name === "checkout_redirect" || event.name === "checkout_created") bucket.checkoutRedirects += 1;
    if (event.name === "payment_credit_granted") bucket.paidCredits += Number(event.properties?.credits || 0);
  }

  const funnel = [
    "page_view",
    "upload_click",
    "upload_success",
    "generate_click",
    "generate_job_created",
    "generate_success",
    "checkout_click",
    "checkout_redirect",
    "checkout_return_success",
    "payment_credit_granted",
  ].map((name, index, names) => {
    const count = byName[name] || 0;
    const previous = index ? byName[names[index - 1]] || 0 : count;
    return {
      name,
      label: analyticsEventLabel(name),
      count,
      previousRate: previous ? count / previous : 0,
      totalRate: events.length ? count / events.length : 0,
    };
  });

  const topEvents = Object.entries(byName)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  const topPages = Object.entries(byPage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  const channels = Object.values(channelsByName)
    .sort(
      (a, b) =>
        b.checkoutRedirects - a.checkoutRedirects ||
        b.generateSuccess - a.generateSuccess ||
        b.uploadSuccess - a.uploadSuccess ||
        b.pageViews - a.pageViews ||
        b.events - a.events
    )
    .slice(0, 12);
  const riskSignals = [
    "generate_failed",
    "checkout_error",
    "generate_blocked_low_credits",
    "upload_invalid_file",
  ].map((name) => ({
    name,
    label: analyticsEventLabel(name),
    count: byName[name] || 0,
    tone: eventTone(name),
  }));
  const feedbackEvents = events.filter((event) => event.name === "result_feedback");
  const feedbackByRating = { good: 0, distorted: 0, other: 0 };
  const feedbackByTemplate = {};

  for (const event of feedbackEvents) {
    const props = event.properties || {};
    const rating = props.rating === "good" || props.rating === "distorted" ? props.rating : "other";
    const template = props.template || "Unknown";

    feedbackByRating[rating] += 1;
    feedbackByTemplate[template] ||= { template, total: 0, good: 0, distorted: 0, other: 0 };
    feedbackByTemplate[template].total += 1;
    feedbackByTemplate[template][rating] += 1;
  }

  const feedbackTemplates = Object.values(feedbackByTemplate)
    .map((item) => ({
      ...item,
      usableRate: item.total ? item.good / item.total : 0,
    }))
    .sort((a, b) => b.total - a.total || b.good - a.good)
    .slice(0, 12);

  return {
    total: events.length,
    byName,
    byPage,
    uniqueUsers: users.size,
    uniqueSessions: sessions.size,
    funnel,
    topEvents,
    topPages,
    channels,
    riskSignals,
    feedback: {
      total: feedbackEvents.length,
      good: feedbackByRating.good,
      distorted: feedbackByRating.distorted,
      other: feedbackByRating.other,
      usableRate: feedbackEvents.length ? feedbackByRating.good / feedbackEvents.length : 0,
      templates: feedbackTemplates,
    },
    recent: events.slice(0, 50),
  };
}

function renderAnalyticsDashboard(summary, url) {
  const apiUrl = "/api/admin/analytics";
  const refreshUrl = "/admin/analytics";
  const generatedAt = new Date().toLocaleString("en-US", { hour12: false });
  const uploadSuccessRate = ratio(summary.byName.upload_success, summary.byName.upload_click);
  const generationSuccessRate = ratio(summary.byName.generate_success, summary.byName.generate_click);
  const checkoutRate = ratio(summary.byName.checkout_click, summary.byName.page_view);
  const paidCreditRate = ratio(summary.byName.payment_credit_granted, summary.byName.checkout_click);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>MotionPic Analytics Dashboard</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #16231d;
      --muted: #66756f;
      --line: #ded8ce;
      --paper: #faf8f3;
      --card: #ffffff;
      --accent: #0f9a8a;
      --accent-soft: #dff7f1;
      --danger: #ef6f5b;
      --danger-soft: #fff0eb;
      --warning: #8a5d00;
      --warning-soft: #fff6dc;
      --info: #334a9f;
      --info-soft: #ecf1ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 26px 36px;
      border-bottom: 1px solid var(--line);
      background: rgba(250, 248, 243, 0.92);
      position: sticky;
      top: 0;
      z-index: 2;
      backdrop-filter: blur(14px);
    }
    main { max-width: 1180px; margin: 0 auto; padding: 34px 24px 56px; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 44px); letter-spacing: 0; }
    h2 { margin: 0 0 16px; font-size: 22px; }
    p { color: var(--muted); margin: 6px 0 0; }
    a { color: var(--accent); font-weight: 700; text-decoration: none; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 0 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--card);
      color: var(--ink);
      font-weight: 800;
    }
    .button.primary { background: var(--accent); border-color: var(--accent); color: white; }
    .grid { display: grid; gap: 16px; }
    .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 24px; }
    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 14px 35px rgba(22, 35, 29, 0.06);
    }
    .metric-label { color: var(--muted); font-size: 13px; font-weight: 800; text-transform: uppercase; }
    .metric-value { font-size: 34px; font-weight: 900; margin-top: 8px; letter-spacing: 0; }
    .metric-note { color: var(--muted); font-size: 13px; margin-top: 4px; }
    .section { margin-top: 24px; }
    .funnel { gap: 10px; }
    .funnel-row {
      display: grid;
      grid-template-columns: minmax(160px, 220px) 80px 1fr 90px;
      gap: 14px;
      align-items: center;
      padding: 12px 0;
      border-top: 1px solid #eee8de;
    }
    .funnel-row:first-child { border-top: 0; }
    .bar {
      height: 12px;
      overflow: hidden;
      border-radius: 999px;
      background: #eee9df;
    }
    .bar span { display: block; height: 100%; background: var(--accent); border-radius: inherit; }
    .label { font-weight: 850; }
    .count { font-weight: 900; font-size: 20px; }
    .rate { color: var(--muted); font-size: 13px; text-align: right; }
    .columns { grid-template-columns: 1fr 1fr; }
    .signal-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .signal {
      background: #fbfaf7;
      border: 1px solid #eee8de;
      border-radius: 8px;
      padding: 16px;
    }
    .signal strong {
      display: block;
      margin-top: 8px;
      font-size: 30px;
      line-height: 1;
      letter-spacing: 0;
    }
    .signal p { margin-top: 8px; font-size: 13px; }
    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      max-width: 100%;
      min-height: 24px;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 900;
      line-height: 1.2;
    }
    .tone-success { background: var(--accent-soft); color: #0c6f64; }
    .tone-danger { background: var(--danger-soft); color: #9f321f; }
    .tone-warning { background: var(--warning-soft); color: var(--warning); }
    .tone-info { background: var(--info-soft); color: var(--info); }
    .tone-neutral { background: #f3efe7; color: #48564f; }
    .event-name {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      min-width: 140px;
    }
    .muted { color: var(--muted); }
    .small { font-size: 12px; }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      word-break: break-all;
    }
    .details-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-width: 520px;
    }
    .chip {
      display: inline-flex;
      max-width: 100%;
      padding: 3px 7px;
      border-radius: 6px;
      background: #f3efe7;
      color: #32423b;
      font-size: 12px;
      font-weight: 750;
      overflow-wrap: anywhere;
    }
    details { margin-top: 8px; }
    summary {
      color: var(--accent);
      cursor: pointer;
      font-size: 12px;
      font-weight: 900;
    }
    details code {
      display: block;
      max-width: 520px;
      margin-top: 6px;
      padding: 8px;
    }
    .events-table td:first-child { min-width: 130px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #eee8de; text-align: left; vertical-align: top; }
    th { color: var(--muted); font-size: 12px; text-transform: uppercase; }
    td { font-size: 14px; }
    code {
      white-space: pre-wrap;
      word-break: break-word;
      color: #32423b;
      background: #f3efe7;
      border-radius: 6px;
      padding: 2px 5px;
    }
    .empty { color: var(--muted); padding: 22px 0; }
    .footer-note { color: var(--muted); font-size: 13px; margin-top: 18px; }
    @media (max-width: 900px) {
      header { align-items: flex-start; flex-direction: column; padding: 22px; }
      .actions { justify-content: flex-start; }
      .metrics, .columns, .signal-grid { grid-template-columns: 1fr; }
      .funnel-row { grid-template-columns: 1fr; gap: 6px; }
      .rate { text-align: left; }
      table { display: block; overflow-x: auto; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>MotionPic Analytics</h1>
      <p>Private product analytics for upload, generation, and checkout behavior.</p>
    </div>
    <div class="actions">
      <a class="button" href="${escapeHtml(apiUrl)}">JSON API</a>
      <a class="button" href="/admin/ops">Ops Dashboard</a>
      <a class="button" href="/api/admin/indexnow">IndexNow</a>
      <a class="button primary" href="${escapeHtml(refreshUrl)}">Refresh</a>
      <a class="button" href="/admin/analytics/logout">Logout</a>
    </div>
  </header>
  <main>
    <section class="grid metrics">
      ${renderMetricCard("Total Events", summary.total, `${summary.uniqueUsers} users / ${summary.uniqueSessions} sessions`)}
      ${renderMetricCard("Upload Success", formatPercent(uploadSuccessRate), `${summary.byName.upload_success || 0} success / ${summary.byName.upload_click || 0} clicks`)}
      ${renderMetricCard("Generation Success", formatPercent(generationSuccessRate), `${summary.byName.generate_success || 0} success / ${summary.byName.generate_click || 0} clicks`)}
      ${renderMetricCard("Checkout Click Rate", formatPercent(checkoutRate), `${summary.byName.checkout_click || 0} checkout clicks / ${summary.byName.page_view || 0} page views`)}
    </section>

    <section class="grid metrics">
      ${renderMetricCard("Feedback Events", summary.feedback.total, "Completed outputs with user feedback")}
      ${renderMetricCard("Usable Output Rate", formatPercent(summary.feedback.usableRate), `${summary.feedback.good} good / ${summary.feedback.distorted} distorted`)}
      ${renderMetricCard("Good Outputs", summary.feedback.good, "User marked the result usable")}
      ${renderMetricCard("Distorted Outputs", summary.feedback.distorted, "Needs prompt, photo, or template review")}
    </section>

    <section class="section card">
      <h2>Conversion Funnel</h2>
      <div class="funnel">
        ${summary.funnel.map(renderFunnelRow).join("")}
      </div>
      <p class="footer-note">Payment-credit rate: ${formatPercent(paidCreditRate)} from checkout clicks to credited payments.</p>
    </section>

    <section class="section card">
      <h2>Risk Signals</h2>
      <div class="grid signal-grid">
        ${summary.riskSignals.map(renderRiskSignal).join("")}
      </div>
      <p class="footer-note">These are the first places to check when users get stuck before payment or video generation.</p>
    </section>

    <section class="section card">
      <h2>Result Feedback By Template</h2>
      ${renderFeedbackTemplateTable(summary.feedback.templates)}
      <p class="footer-note">Use this table to decide which templates deserve promotion and which prompts need quality tuning.</p>
    </section>

    <section class="section card">
      <h2>Channel Attribution</h2>
      ${renderChannelTable(summary.channels)}
      <p class="footer-note">Use UTM links from the Launch Kit to compare which directories, communities, and social platforms create real product actions.</p>
    </section>

    <section class="section grid columns">
      <div class="card">
        <h2>Top Events</h2>
        ${renderPairTable(summary.topEvents, "Event", analyticsEventLabel)}
      </div>
      <div class="card">
        <h2>Top Pages</h2>
        ${renderPairTable(summary.topPages, "Page")}
      </div>
    </section>

    <section class="section card">
      <h2>Recent Events</h2>
      ${renderRecentEventsTable(summary.recent)}
      <p class="footer-note">Generated at ${escapeHtml(generatedAt)}. This page is noindex and protected by your analytics token.</p>
    </section>
  </main>
</body>
</html>`;
}

function renderOpsDashboard(data) {
  const generatedAt = new Date().toLocaleString("en-US", { hour12: false });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>MotionPic Ops Dashboard</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #16231d;
      --muted: #66756f;
      --line: #ded8ce;
      --paper: #faf8f3;
      --card: #ffffff;
      --accent: #0f9a8a;
      --accent-soft: #dff7f1;
      --danger-soft: #fff0eb;
      --warning-soft: #fff6dc;
      --info-soft: #ecf1ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 26px 36px;
      border-bottom: 1px solid var(--line);
      background: rgba(250, 248, 243, 0.92);
      position: sticky;
      top: 0;
      z-index: 2;
      backdrop-filter: blur(14px);
    }
    main { max-width: 1180px; margin: 0 auto; padding: 34px 24px 56px; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 44px); letter-spacing: 0; }
    h2 { margin: 0 0 16px; font-size: 22px; }
    p { color: var(--muted); margin: 6px 0 0; }
    a { color: var(--accent); font-weight: 800; text-decoration: none; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 0 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--card);
      color: var(--ink);
      font-weight: 850;
    }
    .button.primary { background: var(--accent); border-color: var(--accent); color: white; }
    .grid { display: grid; gap: 16px; }
    .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 24px; }
    .columns { grid-template-columns: 1fr 1fr; }
    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 14px 35px rgba(22, 35, 29, 0.06);
    }
    .section { margin-top: 24px; }
    .metric-label { color: var(--muted); font-size: 13px; font-weight: 850; text-transform: uppercase; }
    .metric-value { font-size: 34px; font-weight: 900; margin-top: 8px; letter-spacing: 0; }
    .metric-note { color: var(--muted); font-size: 13px; margin-top: 4px; }
    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      min-height: 24px;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 900;
      line-height: 1.2;
    }
    .tone-success { background: var(--accent-soft); color: #0c6f64; }
    .tone-danger { background: var(--danger-soft); color: #9f321f; }
    .tone-warning { background: var(--warning-soft); color: #8a5d00; }
    .tone-info { background: var(--info-soft); color: #334a9f; }
    .tone-neutral { background: #f3efe7; color: #48564f; }
    .muted { color: var(--muted); }
    .small { font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #eee8de; text-align: left; vertical-align: top; }
    th { color: var(--muted); font-size: 12px; text-transform: uppercase; }
    td { font-size: 14px; }
    code {
      white-space: pre-wrap;
      word-break: break-word;
      color: #32423b;
      background: #f3efe7;
      border-radius: 6px;
      padding: 2px 5px;
    }
    .empty { color: var(--muted); padding: 22px 0; }
    .footer-note { color: var(--muted); font-size: 13px; margin-top: 18px; }
    @media (max-width: 900px) {
      header { align-items: flex-start; flex-direction: column; padding: 22px; }
      .actions { justify-content: flex-start; }
      .metrics, .columns { grid-template-columns: 1fr; }
      table { display: block; overflow-x: auto; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>MotionPic Ops</h1>
      <p>Private operations view for credits, payments, video jobs, and webhooks.</p>
    </div>
    <div class="actions">
      <a class="button" href="/api/admin/ops">JSON API</a>
      <a class="button" href="/admin/analytics">Analytics</a>
      <a class="button" href="/api/admin/indexnow">IndexNow</a>
      <a class="button" href="/launch-kit">Launch Kit</a>
      <a class="button primary" href="/admin/ops">Refresh</a>
      <a class="button" href="/admin/analytics/logout">Logout</a>
    </div>
  </header>
  <main>
    <section class="grid metrics">
      ${renderMetricCard("Users", data.totals.users, `${data.totals.totalBalances} credits in visible balances`)}
      ${renderMetricCard("Video Jobs", data.totals.jobs, `${data.totals.pendingJobs} pending / ${data.totals.stalePendingJobs} stale / ${data.totals.failedJobs} failed`)}
      ${renderMetricCard("Payments", data.totals.payments, `${data.totals.paymentCredits} paid credits in recent records`)}
      ${renderMetricCard("Ledger Net", data.totals.ledgerCredits, "Recent credit ledger net amount")}
    </section>

    <section class="grid metrics">
      ${renderMetricCard("Succeeded Jobs", data.totals.succeededJobs, `${formatCny(data.totals.estimatedCostPerSucceededJobCny)} est. per succeeded job`)}
      ${renderMetricCard("Est. Provider Cost", formatCny(data.totals.estimatedProviderCostCny), "Succeeded DashScope jobs only")}
      ${renderMetricCard("Credits Spent", data.totals.jobCreditsSpent, `${formatNumber(data.totals.averageCreditsPerSucceededJob)} credits per succeeded job`)}
      ${renderMetricCard("Refunded Credits", data.totals.refundedCredits, `${data.totals.refundEntries} refund ledger entries`)}
    </section>

    <section class="grid metrics">
      ${renderMetricCard("Video Provider", data.runtime.videoProvider, `${data.runtime.dataProvider} data / ${data.runtime.paymentProvider} payments`)}
      ${renderMetricCard("Real Jobs Today", data.runtime.todayRealVideoJobs, `Resets ${formatDateTime(data.runtime.resetAt)}`)}
      ${renderMetricCard("Daily Site Cap", data.runtime.maxDailyVideoJobs, "MAX_DAILY_VIDEO_JOBS")}
      ${renderMetricCard("Daily User Cap", data.runtime.maxDailyVideoJobsPerUser, "MAX_DAILY_VIDEO_JOBS_PER_USER")}
    </section>

    <section class="grid metrics">
      ${renderMetricCard("Storage Provider", data.runtime.storageProvider, data.runtime.storageProvider === "r2" ? "R2 storage active" : "Provider output links may expire")}
      ${renderMetricCard("Upload Limit", `${data.runtime.maxUploadImageMb} MB`, "JPG / PNG / WebP")}
      ${renderMetricCard("Unit Cost Est.", formatCny(data.runtime.estimatedVideoCostCny), "ESTIMATED_VIDEO_COST_CNY")}
      ${renderMetricCard("Download Note", data.runtime.storageProvider === "r2" ? "Long-term links" : "Save outputs soon", "Shown on the public generator")}
    </section>

    <section class="section card">
      <h2>Live Payment Preflight</h2>
      <p>Configuration status for the first controlled live-payment test. Secret values are never shown.</p>
      ${renderPreflightTable(data.livePaymentPreflight)}
    </section>

    <section class="section card">
      <h2>Owner Action Queue</h2>
      <p>High-risk work that should stay manual until the owner confirms the exact step.</p>
      ${renderOwnerActionTable(data.ownerActionChecklist)}
    </section>

    ${renderStalePendingNotice(data.totals.stalePendingJobs)}

    <section class="section grid columns">
      <div class="card">
        <h2>Job Status</h2>
        ${renderPairTable(Object.entries(data.totals.jobStatus), "Status", statusLabel)}
      </div>
      <div class="card">
        <h2>Recent Webhooks</h2>
        ${renderWebhookTable(data.webhooks)}
      </div>
    </section>

    <section class="section card">
      <h2>Recent Video Jobs</h2>
      ${renderJobsTable(data.jobs)}
    </section>

    <section class="section grid columns">
      <div class="card">
        <h2>Recent Payments</h2>
        ${renderPaymentsTable(data.payments)}
      </div>
      <div class="card">
        <h2>Credit Ledger</h2>
        ${renderLedgerTable(data.ledger)}
      </div>
    </section>

    <section class="section card">
      <h2>User Balances</h2>
      ${renderUsersTable(data.users)}
      <p class="footer-note">Generated at ${escapeHtml(generatedAt)}. This page is noindex and protected by your analytics token.</p>
    </section>
  </main>
</body>
</html>`;
}

function renderAnalyticsLoginPage(hasError = false) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Analytics Login - MotionPic AI</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #faf8f3;
      color: #16231d;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(460px, calc(100vw - 32px));
      padding: 28px;
      background: white;
      border: 1px solid #ded8ce;
      border-radius: 8px;
      box-shadow: 0 18px 45px rgba(22, 35, 29, 0.08);
    }
    h1 { margin: 0 0 8px; font-size: 32px; letter-spacing: 0; }
    p { margin: 0 0 22px; color: #66756f; line-height: 1.5; }
    label { display: block; margin-bottom: 8px; font-weight: 800; }
    input {
      width: 100%;
      min-height: 46px;
      padding: 0 12px;
      border: 1px solid #ded8ce;
      border-radius: 8px;
      font: inherit;
    }
    button {
      width: 100%;
      min-height: 46px;
      margin-top: 14px;
      border: 0;
      border-radius: 8px;
      background: #0f9a8a;
      color: white;
      font: inherit;
      font-weight: 900;
      cursor: pointer;
    }
    .error {
      margin: 0 0 16px;
      padding: 10px 12px;
      border-radius: 8px;
      background: #fff0eb;
      color: #9f321f;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <main>
    <h1>Analytics Login</h1>
    <p>Enter your private analytics token. After login, the dashboard URL will not expose the token.</p>
    ${hasError ? `<div class="error">Invalid or missing analytics token.</div>` : ""}
    <form method="post" action="/admin/analytics/login">
      <label for="token">Analytics token</label>
      <input id="token" name="token" type="password" autocomplete="current-password" required autofocus>
      <button type="submit">Open Dashboard</button>
    </form>
  </main>
</body>
</html>`;
}

function renderAdminMessage(title, message) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${escapeHtml(title)} - MotionPic AI</title>
  <style>
    body { margin: 0; background: #faf8f3; color: #16231d; font-family: system-ui, sans-serif; }
    main { max-width: 680px; margin: 14vh auto; padding: 28px; background: white; border: 1px solid #ded8ce; border-radius: 8px; }
    h1 { margin: 0 0 10px; font-size: 34px; }
    p { color: #66756f; font-size: 18px; }
  </style>
</head>
<body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></main></body>
</html>`;
}

function renderMetricCard(label, value, note) {
  return `<div class="card">
    <div class="metric-label">${escapeHtml(label)}</div>
    <div class="metric-value">${escapeHtml(value)}</div>
    <div class="metric-note">${escapeHtml(note)}</div>
  </div>`;
}

function renderFunnelRow(item) {
  const width = Math.max(2, Math.round(item.previousRate * 100));
  return `<div class="funnel-row">
    <div class="label">${escapeHtml(item.label)}</div>
    <div class="count">${item.count}</div>
    <div class="bar"><span style="width: ${width}%"></span></div>
    <div class="rate">${formatPercent(item.previousRate)} from previous</div>
  </div>`;
}

function renderPairTable(pairs, label, labelFormatter = (value) => value) {
  if (!pairs.length) return `<div class="empty">No data yet.</div>`;
  return `<table><thead><tr><th>${escapeHtml(label)}</th><th>Count</th></tr></thead><tbody>
    ${pairs
      .map(([key, count]) => `<tr><td>${escapeHtml(labelFormatter(key))}<br><code>${escapeHtml(key)}</code></td><td>${count}</td></tr>`)
      .join("")}
  </tbody></table>`;
}

function renderJobsTable(jobs) {
  if (!jobs.length) return `<div class="empty">No video jobs yet.</div>`;
  return `<table><thead><tr><th>Time</th><th>Status</th><th>User</th><th>Template</th><th>Credits</th><th>Est. Cost</th><th>Provider</th><th>Output</th><th>Error</th></tr></thead><tbody>
    ${jobs
      .map(
        (job) => `<tr>
          <td>${escapeHtml(formatDateTime(job.createdAt))}</td>
          <td><span class="badge ${escapeHtml(isStalePendingJob(job) ? "tone-warning" : statusTone(job.status))}">${escapeHtml(isStalePendingJob(job) ? "Stale processing" : statusLabel(job.status))}</span><br><code>${escapeHtml(shortId(job.id || ""))}</code>${isStalePendingJob(job) ? `<br><span class="muted small">${escapeHtml(formatJobAge(job))} old</span>` : ""}</td>
          <td><code title="${escapeHtml(job.userId || "")}">${escapeHtml(shortId(job.userId || ""))}</code></td>
          <td>${escapeHtml(job.template || "")}<br><span class="muted small">${escapeHtml([job.ratio, job.resolution, job.seconds ? `${job.seconds}s` : ""].filter(Boolean).join(" / "))}</span></td>
          <td>${Number(job.credits || 0)} credits</td>
          <td>${formatCny(estimateJobProviderCostCny(job))}<br><span class="muted small">planning estimate</span></td>
          <td>${escapeHtml(job.provider || "")}<br><code>${escapeHtml(shortId(job.providerJobId || ""))}</code></td>
          <td>${job.outputUrl ? `<a href="${escapeHtml(job.outputUrl)}" target="_blank" rel="noopener noreferrer nofollow">Open</a>` : `<span class="muted small">No output</span>`}</td>
          <td>${job.error ? `<code>${escapeHtml(job.error)}</code>` : `<span class="muted small">None</span>`}</td>
        </tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderStalePendingNotice(count) {
  if (!count) return "";
  return `<section class="section card">
    <h2>Stale Pending Jobs</h2>
    <p><strong>${count}</strong> job${count === 1 ? "" : "s"} has remained queued or processing for more than 30 minutes. MotionPic currently reconciles provider status only when the owning user polls the job endpoint; this notice does not call the provider, change the database, or refund credits. Verify the provider task result before any manual action.</p>
  </section>`;
}

function renderPaymentsTable(payments) {
  if (!payments.length) return `<div class="empty">No payments yet.</div>`;
  return `<table><thead><tr><th>Time</th><th>Provider</th><th>Plan</th><th>Credits</th><th>User</th><th>Payment</th></tr></thead><tbody>
    ${payments
      .map(
        (payment) => `<tr>
          <td>${escapeHtml(formatDateTime(payment.createdAt))}</td>
          <td>${escapeHtml(payment.provider || "")}</td>
          <td>${escapeHtml(payment.plan || "")}</td>
          <td>${Number(payment.credits || 0)}</td>
          <td><code title="${escapeHtml(payment.userId || "")}">${escapeHtml(shortId(payment.userId || ""))}</code></td>
          <td><code title="${escapeHtml(payment.id || "")}">${escapeHtml(shortId(payment.id || ""))}</code></td>
        </tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderLedgerTable(entries) {
  if (!entries.length) return `<div class="empty">No ledger entries yet.</div>`;
  return `<table><thead><tr><th>Time</th><th>Amount</th><th>Source</th><th>User</th><th>Balance</th></tr></thead><tbody>
    ${entries
      .map(
        (entry) => `<tr>
          <td>${escapeHtml(formatDateTime(entry.createdAt))}</td>
          <td><span class="badge ${Number(entry.amount || 0) >= 0 ? "tone-success" : "tone-warning"}">${Number(entry.amount || 0)}</span></td>
          <td>${escapeHtml(entry.source || "")}<br><code>${escapeHtml(shortId(entry.externalId || ""))}</code></td>
          <td><code title="${escapeHtml(entry.userId || "")}">${escapeHtml(shortId(entry.userId || ""))}</code></td>
          <td>${Number(entry.balanceAfter || 0)}</td>
        </tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderWebhookTable(events) {
  if (!events.length) return `<div class="empty">No webhooks yet.</div>`;
  return `<table><thead><tr><th>Time</th><th>Provider</th><th>Type</th><th>ID</th></tr></thead><tbody>
    ${events
      .map(
        (event) => `<tr>
          <td>${escapeHtml(formatDateTime(event.receivedAt))}</td>
          <td>${escapeHtml(event.provider || "")}</td>
          <td>${escapeHtml(event.type || "")}</td>
          <td><code title="${escapeHtml(event.id || "")}">${escapeHtml(shortId(event.id || ""))}</code></td>
        </tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderUsersTable(users) {
  if (!users.length) return `<div class="empty">No users yet.</div>`;
  return `<table><thead><tr><th>User</th><th>Credits</th><th>Created</th><th>Updated</th></tr></thead><tbody>
    ${users
      .map(
        (user) => `<tr>
          <td><code title="${escapeHtml(user.id || "")}">${escapeHtml(shortId(user.id || ""))}</code></td>
          <td>${Number(user.credits || 0)}</td>
          <td>${escapeHtml(formatDateTime(user.createdAt))}</td>
          <td>${escapeHtml(formatDateTime(user.updatedAt))}</td>
        </tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderRiskSignal(signal) {
  const note = signal.count
    ? "Needs review in recent events."
    : "No recent issues found.";
  return `<div class="signal">
    <span class="badge ${escapeHtml(signal.tone)}">${escapeHtml(signal.label)}</span>
    <strong>${signal.count}</strong>
    <p>${escapeHtml(note)}</p>
  </div>`;
}

function renderPreflightTable(items) {
  if (!items?.length) return `<div class="empty">No preflight data available.</div>`;
  return `<table><thead><tr><th>Check</th><th>Status</th><th>Note</th></tr></thead><tbody>
    ${items
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.label || "")}</td>
          <td><span class="badge ${escapeHtml(item.tone || "tone-neutral")}">${escapeHtml(item.status || "")}</span></td>
          <td>${escapeHtml(item.note || "")}</td>
        </tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderOwnerActionTable(items) {
  if (!items?.length) return `<div class="empty">No owner actions queued.</div>`;
  return `<table><thead><tr><th>Area</th><th>Status</th><th>Next Action</th><th>Risk</th></tr></thead><tbody>
    ${items
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.area || "")}</td>
          <td><span class="badge ${escapeHtml(item.tone || "tone-neutral")}">${escapeHtml(item.status || "")}</span></td>
          <td>${escapeHtml(item.action || "")}</td>
          <td>${escapeHtml(item.risk || "")}</td>
        </tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderRecentEventsTable(events) {
  if (!events.length) return `<div class="empty">No recent events yet.</div>`;
  return `<table class="events-table"><thead><tr><th>Time</th><th>Event</th><th>User</th><th>Page</th><th>Details</th></tr></thead><tbody>
    ${events
      .map(
        (event) => `<tr>
          <td>${escapeHtml(formatDateTime(event.createdAt))}</td>
          <td><div class="event-name"><span class="badge ${escapeHtml(eventTone(event.name))}">${escapeHtml(analyticsEventLabel(event.name))}</span><code>${escapeHtml(event.name)}</code></div></td>
          <td><span class="mono small" title="${escapeHtml(event.userId || "")}">${escapeHtml(shortId(event.userId || ""))}</span></td>
          <td>${escapeHtml(event.page || "/")}</td>
          <td>${renderEventDetails(event)}</td>
        </tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderFeedbackTemplateTable(templates) {
  if (!templates.length) return `<div class="empty">No result feedback yet. After a user clicks Good or Distorted, it will appear here.</div>`;
  return `<table><thead><tr><th>Template</th><th>Total</th><th>Good</th><th>Distorted</th><th>Usable Rate</th></tr></thead><tbody>
    ${templates
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.template)}</td>
          <td>${item.total}</td>
          <td><span class="badge tone-success">${item.good}</span></td>
          <td><span class="badge ${item.distorted ? "tone-danger" : "tone-neutral"}">${item.distorted}</span></td>
          <td>${escapeHtml(formatPercent(item.usableRate))}</td>
        </tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderChannelTable(channels) {
  if (!channels.length) return `<div class="empty">No channel data yet. Open a Launch Kit UTM link, then trigger a few product events.</div>`;
  return `<table><thead><tr><th>Channel</th><th>Events</th><th>Page Views</th><th>Uploads</th><th>Generations</th><th>Checkout</th><th>Paid Credits</th></tr></thead><tbody>
    ${channels
      .map(
        (channel) => `<tr>
          <td><strong>${escapeHtml(channel.channel)}</strong></td>
          <td>${Number(channel.events || 0)}</td>
          <td>${Number(channel.pageViews || 0)}</td>
          <td>${Number(channel.uploadSuccess || 0)} / ${Number(channel.uploadClicks || 0)}</td>
          <td>${Number(channel.generateSuccess || 0)} / ${Number(channel.generateClicks || 0)}</td>
          <td>${Number(channel.checkoutRedirects || 0)} / ${Number(channel.checkoutClicks || 0)}</td>
          <td>${Number(channel.paidCredits || 0)}</td>
        </tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderEventDetails(event) {
  const details = summarizeEventProperties(event);
  const raw = JSON.stringify(event.properties || {}, null, 2);
  return `<div class="details-list">
    ${details.length ? details.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("") : `<span class="muted small">No properties</span>`}
  </div>
  <details>
    <summary>Raw properties</summary>
    <code>${escapeHtml(raw)}</code>
  </details>`;
}

function summarizeEventProperties(event) {
  const props = event.properties || {};
  const keys = [
    "rating",
    "plan",
    "provider",
    "template",
    "ratio",
    "resolution",
    "seconds",
    "credits",
    "balance",
    "uploaded",
    "source",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmContent",
    "jobId",
    "error",
    "fileType",
    "fileSize",
    "fileNameLength",
  ];
  const items = [];

  for (const key of keys) {
    if (props[key] === undefined || props[key] === null || props[key] === "") continue;
    items.push(`${formatPropertyKey(key)}: ${formatPropertyValue(props[key])}`);
  }

  return items.slice(0, 9);
}

function formatPropertyKey(key) {
  const labels = {
    jobId: "job",
    fileType: "file",
    fileSize: "size",
    fileNameLength: "name length",
  };
  return labels[key] || key.replace(/_/g, " ");
}

function formatPropertyValue(value) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.length > 84 ? `${value.slice(0, 81)}...` : value;
  const text = JSON.stringify(value);
  return text.length > 84 ? `${text.slice(0, 81)}...` : text;
}

function shortId(value) {
  if (!value) return "";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function eventTone(name) {
  if (["upload_success", "generate_success", "checkout_return_success", "payment_credit_granted"].includes(name)) {
    return "tone-success";
  }
  if (["generate_failed", "checkout_error", "upload_invalid_file"].includes(name)) {
    return "tone-danger";
  }
  if (["generate_blocked_no_upload", "generate_blocked_low_credits"].includes(name)) {
    return "tone-warning";
  }
  if (["checkout_click", "checkout_created", "checkout_redirect", "generate_click", "generate_job_created"].includes(name)) {
    return "tone-info";
  }
  return "tone-neutral";
}

function statusLabel(status) {
  const labels = {
    queued: "Queued",
    processing: "Processing",
    in_progress: "Processing",
    succeeded: "Succeeded",
    failed: "Failed",
  };
  return labels[status] || status || "Unknown";
}

function statusTone(status) {
  if (status === "succeeded") return "tone-success";
  if (status === "failed") return "tone-danger";
  if (["queued", "processing", "in_progress"].includes(status)) return "tone-info";
  return "tone-neutral";
}

function estimateJobProviderCostCny(job) {
  if (job.status !== "succeeded" || job.provider !== "dashscope") return 0;
  const seconds = Math.max(4, Number(job.seconds || 4));
  const durationMultiplier = seconds / 4;
  const resolutionMultiplier = String(job.resolution || "").toLowerCase().includes("1080") ? 1.8 : 1;
  return roundMoney(config.estimatedVideoCostCny * durationMultiplier * resolutionMultiplier);
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatCny(value) {
  return `CNY ${roundMoney(value).toFixed(2)}`;
}

function formatNumber(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

function analyticsEventLabel(name) {
  const labels = {
    page_view: "Page View",
    upload_click: "Upload Click",
    upload_success: "Upload Success",
    upload_invalid_file: "Invalid Upload",
    template_filter_click: "Template Filter",
    template_select: "Template Select",
    duration_select: "Duration Select",
    ratio_select: "Ratio Select",
    resolution_select: "Resolution Select",
    generate_click: "Generate Click",
    generate_blocked_no_upload: "Generate Blocked: No Upload",
    generate_blocked_low_credits: "Generate Blocked: Low Credits",
    generate_job_created: "Generation Job Created",
    generate_success: "Generation Success",
    generate_failed: "Generation Failed",
    download_click: "Download Click",
    checkout_click: "Checkout Click",
    checkout_created: "Checkout Created",
    checkout_redirect: "Checkout Redirect",
    checkout_error: "Checkout Error",
    checkout_modal_open: "Checkout Modal Open",
    checkout_return_success: "Checkout Return Success",
    mock_payment_success: "Mock Payment Success",
    payment_credit_granted: "Payment Credits Granted",
    result_feedback: "Result Feedback",
  };
  return labels[name] || name;
}

function ratio(numerator = 0, denominator = 0) {
  return denominator ? numerator / denominator : 0;
}

function formatPercent(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

function formatDateTime(value) {
  if (!value) return "";
  const timestamp = parseTimestampMs(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString("en-US", { hour12: false }) : "";
}

async function grantCredits({ userId, amount, source, externalId, plan, provider = "mock", eventId = "" }) {
  if (useSupabase()) {
    await ensureSupabaseUser(userId);
    const ledgerId = `${source}:${externalId}`;
    const existingLedger = await supabaseRequest(`credit_ledger?id=eq.${filterValue(ledgerId)}&select=id,balance_after&limit=1`);
    if (existingLedger.length) {
      return { credited: false, balance: Number(existingLedger[0].balance_after || 0) };
    }

    const account = await getAccount(userId);
    const balance = account.credits + amount;

    if (provider && provider !== "mock") {
      const existingPayment = await supabaseRequest(`payments?id=eq.${filterValue(externalId)}&select=id&limit=1`);
      if (!existingPayment.length) {
        await supabaseRequest("payments", {
          method: "POST",
          body: {
            id: externalId,
            provider,
            event_id: eventId || null,
            user_id: userId,
            plan,
            credits: amount,
          },
          prefer: "return=minimal",
        });
      }
    }

    await supabaseRequest(`app_users?id=eq.${filterValue(userId)}`, {
      method: "PATCH",
      body: { credits: balance, updated_at: new Date().toISOString() },
      prefer: "return=minimal",
    });
    await supabaseRequest("credit_ledger", {
      method: "POST",
      body: {
        id: ledgerId,
        user_id: userId,
        amount,
        source,
        external_id: externalId,
        plan,
        balance_after: balance,
      },
      prefer: "return=minimal",
    });
    return { credited: true, balance };
  }

  const db = readDb();
  normalizeDb(db);
  if (provider && provider !== "mock" && !db.payments[externalId]) {
    db.payments[externalId] = {
      id: externalId,
      provider,
      eventId,
      userId,
      plan,
      credits: amount,
      createdAt: new Date().toISOString(),
    };
  }
  const credited = addCredits(db, { userId, amount, source, externalId, plan });
  writeDb(db);
  return { credited, balance: db.users[userId].credits };
}

function useSupabase() {
  return config.dataProvider === "supabase" && Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

function canReadAdminAnalytics(req, url) {
  if (!config.analyticsAdminToken) return isLocalRequest(req);
  const cookies = parseCookies(req.headers.cookie || "");
  const token =
    req.headers["x-motionpic-admin-token"] ||
    url.searchParams.get("token") ||
    cookies[analyticsCookieName] ||
    "";
  return String(token) === config.analyticsAdminToken;
}

function setAnalyticsAdminCookie(req, res) {
  const secure = isHttpsRequest(req) ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${analyticsCookieName}=${encodeURIComponent(config.analyticsAdminToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`
  );
}

function clearAnalyticsAdminCookie(req, res) {
  const secure = isHttpsRequest(req) ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${analyticsCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

function setAuthCookie(req, res, session) {
  const secure = isHttpsRequest(req) ? "; Secure" : "";
  const value = signAuthSession(session);
  res.setHeader(
    "Set-Cookie",
    `${authCookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`
  );
}

function clearAuthCookie(req, res) {
  const secure = isHttpsRequest(req) ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${authCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

function parseCookies(cookieHeader) {
  const cookies = {};
  for (const part of String(cookieHeader || "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (!key) continue;
    cookies[key] = decodeURIComponent(rest.join("=") || "");
  }
  return cookies;
}

function signAuthSession(session) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", config.authCookieSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function getAuthSession(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const raw = cookies[authCookieName] || "";
  const [payload, signature] = String(raw).split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", config.authCookieSecret).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.userId || !String(session.userId).startsWith("auth_")) return null;
    if (Number(session.exp || 0) <= Math.floor(Date.now() / 1000)) return null;
    return {
      userId: sanitizeText(session.userId, 120),
      email: normalizeEmail(session.email),
      exp: Number(session.exp || 0),
    };
  } catch {
    return null;
  }
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

function isHttpsRequest(req) {
  return String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https" || Boolean(req.socket?.encrypted);
}

function isLocalRequest(req) {
  const host = String(req.headers.host || "");
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
}

function getPublicOrigin(req) {
  const protocol = isHttpsRequest(req) ? "https" : "http";
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "localhost:8787").split(",")[0].trim();
  if (host && !host.startsWith("localhost") && !host.startsWith("127.0.0.1") && !host.startsWith("[::1]")) {
    return `${protocol}://${host}`;
  }
  return (config.appUrl || "http://localhost:8787").replace(/\/$/, "");
}

function getIndexNowKey() {
  const keyPath = resolve(join(root, "indexnow-key.txt"));
  if (!existsSync(keyPath)) return "motionpic-ai-indexnow-2026-06-02";
  return readFileSync(keyPath, "utf8").trim();
}

function getSitemapUrls() {
  const sitemapPath = resolve(join(root, "sitemap.xml"));
  if (!existsSync(sitemapPath)) return [];
  const xml = readFileSync(sitemapPath, "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function isHttpHeaderValue(value) {
  return /^[\t\x20-\x7e\x80-\xff]+$/.test(String(value || ""));
}

async function ensureSupabaseUser(userId) {
  return ensureSupabaseUserWithCredits(userId, config.starterCredits);
}

async function ensureSupabaseUserWithCredits(userId, credits) {
  const users = await supabaseRequest(`app_users?id=eq.${filterValue(userId)}&select=id&limit=1`);
  if (users.length) return;

  await supabaseRequest("app_users", {
    method: "POST",
    body: { id: userId, credits },
    prefer: "return=minimal",
  });
}

function canUseSupabaseAuth() {
  return Boolean(config.supabaseUrl && config.supabaseAuthAnonKey);
}

async function supabaseAuthRequest(path, { method = "GET", body, accessToken = "" } = {}) {
  const headers = {
    apikey: config.supabaseAuthAnonKey,
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken || config.supabaseAuthAnonKey}`,
  };

  const response = await fetch(`${config.supabaseUrl}/auth/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const data = parseJsonResponse(text);
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || text || `Supabase auth failed: ${response.status}`;
    throw new Error(message);
  }
  return data || {};
}

async function getSupabaseAuthUser(accessToken) {
  const user = await supabaseAuthRequest("user", { accessToken });
  if (!user?.id) throw new Error("Supabase Auth did not return a user id");
  return user;
}

function authAppUserId(authProviderUserId) {
  const clean = sanitizeText(authProviderUserId, 100).replace(/[^a-z0-9_-]/gi, "");
  return `auth_${clean.slice(0, 80)}`;
}

function normalizeEmail(email) {
  const value = sanitizeText(email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "";
  return value;
}

async function mergeBrowserAccountIntoAuthAccount(browserUserId, authUserId) {
  if (!/^mp_[a-z0-9_-]{12,80}$/i.test(String(browserUserId || ""))) {
    if (useSupabase()) {
      await ensureSupabaseUserWithCredits(authUserId, 0);
    } else {
      const db = readDb();
      normalizeDb(db);
      db.users[authUserId] ||= { credits: 0 };
      writeDb(db);
    }
    return;
  }

  if (browserUserId === authUserId) return;

  if (useSupabase()) {
    await mergeSupabaseBrowserAccount(browserUserId, authUserId);
    return;
  }

  const db = readDb();
  normalizeDb(db);
  db.users[authUserId] ||= { credits: 0 };
  const browser = db.users[browserUserId];
  if (browser) {
    db.users[authUserId].credits += Number(browser.credits || 0);
    for (const job of Object.values(db.jobs)) {
      if (job.userId === browserUserId) job.userId = authUserId;
    }
    for (const payment of Object.values(db.payments)) {
      if (payment.userId === browserUserId) payment.userId = authUserId;
    }
    for (const entry of db.creditLedger) {
      if (entry.userId === browserUserId) entry.userId = authUserId;
    }
    for (const event of db.analyticsEvents) {
      if (event.userId === browserUserId) event.userId = authUserId;
    }
    delete db.users[browserUserId];
  }
  writeDb(db);
}

async function mergeSupabaseBrowserAccount(browserUserId, authUserId) {
  await ensureSupabaseUserWithCredits(authUserId, 0);
  const [browserRows, authRows] = await Promise.all([
    supabaseRequest(`app_users?id=eq.${filterValue(browserUserId)}&select=id,credits&limit=1`),
    supabaseRequest(`app_users?id=eq.${filterValue(authUserId)}&select=id,credits&limit=1`),
  ]);
  if (!browserRows.length) return;

  const nextCredits = Number(authRows[0]?.credits || 0) + Number(browserRows[0]?.credits || 0);
  await supabaseRequest(`app_users?id=eq.${filterValue(authUserId)}`, {
    method: "PATCH",
    body: { credits: nextCredits, updated_at: new Date().toISOString() },
    prefer: "return=minimal",
  });

  const updates = [
    ["video_jobs", { user_id: authUserId }],
    ["payments", { user_id: authUserId }],
    ["credit_ledger", { user_id: authUserId }],
    ["analytics_events", { user_id: authUserId }],
  ];
  for (const [table, body] of updates) {
    await supabaseRequest(`${table}?user_id=eq.${filterValue(browserUserId)}`, {
      method: "PATCH",
      body,
      prefer: "return=minimal",
    });
  }

  await supabaseRequest(`app_users?id=eq.${filterValue(browserUserId)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

async function supabaseRequest(path, { method = "GET", body, prefer } = {}) {
  const headers = {
    apikey: config.supabaseServiceRoleKey,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };

  if (requiresSupabaseBearerToken(config.supabaseServiceRoleKey)) {
    headers.Authorization = `Bearer ${config.supabaseServiceRoleKey}`;
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const data = parseJsonResponse(text);
  if (!response.ok) {
    const message = data?.message || data?.error || text || `Supabase request failed: ${response.status}`;
    throw new Error(message);
  }
  return data || [];
}

function requiresSupabaseBearerToken(apiKey) {
  const key = String(apiKey || "");
  return key && !key.startsWith("sb_secret_") && !key.startsWith("sb_publishable_");
}

function supabaseKeyType(apiKey) {
  const key = String(apiKey || "");
  if (!key) return "missing";
  if (key.startsWith("sb_secret_")) return "sb_secret";
  if (key.startsWith("sb_publishable_")) return "sb_publishable";
  if (key.startsWith("eyJ")) return "legacy_jwt";
  return "unknown";
}

function parseJsonResponse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getRequestUserId(req, body = {}) {
  const authSession = getAuthSession(req);
  if (authSession?.userId) return authSession.userId;

  const candidate = body.userId || req.headers["x-motionpic-user-id"] || "";
  const userId = String(candidate).trim();
  if (/^mp_[a-z0-9_-]{12,80}$/i.test(userId)) return userId;
  return "demo-user";
}

function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeProperties(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = {};
  for (const [key, raw] of Object.entries(value).slice(0, 30)) {
    const cleanKey = sanitizeText(key, 80);
    if (!cleanKey) continue;
    if (typeof raw === "number" || typeof raw === "boolean") {
      result[cleanKey] = raw;
    } else if (raw === null) {
      result[cleanKey] = null;
    } else {
      result[cleanKey] = sanitizeText(raw, 500);
    }
  }
  return result;
}

function sanitizeAnalyticsProperties(value) {
  const result = sanitizeProperties(value);
  for (const key of ["landingPage", "page", "referrer", "returnUrl", "url"]) {
    if (typeof result[key] === "string") {
      result[key] = sanitizeAnalyticsLocation(result[key], key === "referrer");
    }
  }
  return result;
}

function sanitizeAnalyticsLocation(value, preserveOrigin = false) {
  const raw = sanitizeText(value, 2000);
  if (!raw) return "";
  try {
    const url = new URL(raw, config.appUrl);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    const allowed = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "checkout", "plan", "template"];
    const safeQuery = new URLSearchParams();
    for (const key of allowed) {
      const entry = sanitizeText(url.searchParams.get(key), 120);
      if (entry) safeQuery.set(key, entry);
    }
    const query = safeQuery.toString();
    const base = preserveOrigin ? `${url.origin}${url.pathname}` : url.pathname;
    return sanitizeText(`${base}${query ? `?${query}` : ""}`, 500);
  } catch {
    return "";
  }
}

function sanitizeAnalyticsEventForRead(event) {
  return {
    ...event,
    page: sanitizeAnalyticsLocation(event.page),
    referrer: sanitizeAnalyticsLocation(event.referrer, true),
    properties: sanitizeAnalyticsProperties(event.properties || {}),
  };
}

function hashClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || "";
  if (!ip) return "";
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function analyticsEventToRow(event) {
  return {
    id: event.id,
    user_id: event.userId,
    session_id: event.sessionId || null,
    name: event.name,
    page: event.page || null,
    referrer: event.referrer || null,
    language: event.language || null,
    properties: event.properties || {},
    user_agent: event.userAgent || null,
    ip_hash: event.ipHash || null,
    created_at: event.createdAt,
  };
}

function rowToAnalyticsEvent(row) {
  return sanitizeAnalyticsEventForRead({
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    name: row.name,
    page: row.page,
    referrer: row.referrer,
    language: row.language,
    properties: row.properties || {},
    createdAt: row.created_at,
  });
}

function rowToAdminUser(row) {
  return {
    id: row.id,
    credits: Number(row.credits || 0),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function rowToPayment(row) {
  return {
    id: row.id,
    provider: row.provider,
    eventId: row.event_id || "",
    userId: row.user_id,
    plan: row.plan,
    credits: Number(row.credits || 0),
    createdAt: row.created_at || "",
  };
}

function rowToWebhookEvent(row) {
  return {
    id: row.id,
    provider: row.provider,
    type: row.type || "",
    receivedAt: row.received_at || "",
  };
}

function filterValue(value) {
  return encodeURIComponent(String(value));
}

function jobToRow(job) {
  return {
    id: job.id,
    user_id: job.userId,
    provider: job.provider,
    status: job.status,
    template: job.template,
    ratio: job.ratio,
    resolution: job.resolution,
    seconds: job.seconds,
    credits: job.credits,
    prompt: job.prompt,
    provider_job_id: job.providerJobId,
    output_url: job.outputUrl,
    ...(job.inputUrl ? { input_url: job.inputUrl } : {}),
    error: job.error,
    created_at: job.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function rowToJob(row) {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    status: row.status,
    template: row.template,
    ratio: row.ratio,
    resolution: row.resolution,
    seconds: row.seconds,
    credits: row.credits,
    prompt: row.prompt,
    createdAt: row.created_at,
    providerJobId: row.provider_job_id || "",
    outputUrl: row.output_url || "",
    inputUrl: row.input_url || "",
    error: row.error || "",
    updatedAt: row.updated_at || "",
  };
}

function ledgerRowToEntry(row) {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    source: row.source,
    externalId: row.external_id,
    plan: row.plan,
    createdAt: row.created_at,
    balanceAfter: row.balance_after,
  };
}

async function createOpenAiVideoJob(body) {
  if (!config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const size = mapSize(body.ratio, body.resolution);
  const payload = {
    model: config.openaiVideoModel,
    prompt: body.prompt,
    seconds: Number(body.seconds),
    size,
    input_reference: {
      image_url: body.imageData,
    },
  };

  const response = await fetch("https://api.openai.com/v1/videos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "OpenAI video request failed");
  }
  return result;
}

async function getOpenAiVideoJob(providerJobId) {
  const response = await fetch(`https://api.openai.com/v1/videos/${providerJobId}`, {
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "OpenAI video status request failed");
  }
  return result;
}

async function createDashScopeVideoJob(body) {
  if (!config.dashscopeApiKey) {
    throw new Error("DASHSCOPE_API_KEY is missing");
  }

  const payload = {
    model: config.dashscopeVideoModel,
    input: {
      prompt: buildDashScopePrompt(body),
      img_url: body.imageData,
    },
    parameters: {
      resolution: mapDashScopeResolution(body.resolution),
      duration: mapDashScopeDuration(body.seconds),
      audio: config.dashscopeAudio,
      prompt_extend: config.dashscopePromptExtend,
      negative_prompt:
        "deformed face, distorted face, different person, identity change, face morphing, merged faces, duplicated face, warped eyes, asymmetrical eyes, broken teeth, open mouth distortion, lip sync, talking mouth, extra fingers, extra limbs, melting object, product deformation, logo distortion, text distortion, unreadable text, blurry face, low quality, artifacts, exaggerated motion, fast head turn, camera shake, background change, scene change",
    },
  };

  const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.dashscopeApiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(getProviderError(result, "DashScope video request failed"));
  }

  const taskId = result.output?.task_id;
  if (!taskId) {
    throw new Error("DashScope did not return task_id");
  }

  return {
    id: taskId,
    status: mapDashScopeStatus(result.output?.task_status),
    outputUrl: result.output?.video_url || "",
  };
}

async function getDashScopeVideoJob(providerJobId) {
  if (!config.dashscopeApiKey) {
    throw new Error("DASHSCOPE_API_KEY is missing");
  }

  const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${providerJobId}`, {
    headers: {
      Authorization: `Bearer ${config.dashscopeApiKey}`,
    },
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(getProviderError(result, "DashScope video status request failed"));
  }

  return {
    id: result.output?.task_id || providerJobId,
    status: mapDashScopeStatus(result.output?.task_status),
    outputUrl: result.output?.video_url || "",
    error: result.output?.message || result.message || "",
  };
}

function buildDashScopePrompt(body) {
  const basePrompt = String(body.prompt || "").trim();
  const templateGuardrail = dashScopeTemplateGuardrail(body.template);
  const ratioInstruction =
    body.ratio === "9:16"
      ? "vertical 9:16 social video framing"
      : body.ratio === "16:9"
        ? "horizontal 16:9 video framing"
        : "square 1:1 social video framing";

  return [
    "Use the uploaded photo as the exact first frame.",
    "Preserve the same people, facial identity, age, clothing, hairstyle, and background.",
    "Do not transform the subject into a different person, object, style, age, or scene.",
    "Keep faces natural and stable; avoid changing facial features, mouth shape, eyes, teeth, or skin texture.",
    "Keep mouths mostly closed unless the original photo already has an open mouth; do not add speech, lip sync, or exaggerated teeth.",
    "Use low-motion animation only: gentle camera push-in, tiny head movement, natural blinking, and very small expression change.",
    "Avoid strong facial animation, lip movement, large head turns, body motion, camera shake, or background changes.",
    "If a requested interaction is not clearly supported by the original photo, use subtle camera motion instead of inventing new contact.",
    templateGuardrail,
    ratioInstruction,
    basePrompt,
  ]
    .filter(Boolean)
    .join(" ");
}

function dashScopeTemplateGuardrail(template) {
  const name = String(template || "").toLowerCase();

  if (name.includes("product")) {
    return "For product photos, preserve the exact product shape, logo, labels, edges, packaging proportions, and readable text. Use camera motion instead of deforming the product. Do not invent new text or change brand marks.";
  }

  if (name.includes("old")) {
    return "For old photos, preserve the original identity, face proportions, clothing, historical look, and mood. Use gentle restoration-like motion only. Do not modernize the face, change the person, or alter the background.";
  }

  if (name.includes("pet")) {
    return "For pet photos, preserve the animal anatomy, eyes, fur, muzzle, ears, paws, and face shape. Use very small natural motion only. Do not stretch the body or change the species.";
  }

  if (name.includes("kiss")) {
    return "For romantic couple photos, this is an experimental effect. Preserve both faces separately, keep mouths mostly closed, avoid merging faces, avoid forced mouth movement, avoid invented contact, and keep motion extremely subtle.";
  }

  return "For portrait photos, preserve exact facial identity, face proportions, hairstyle, clothing, and background. Use only a calm portrait animation with closed-mouth micro expression.";
}

function mapDashScopeResolution(resolution) {
  if (config.dashscopeVideoModel.includes("wanx2.1")) return "720P";
  if (resolution === "1080p" || resolution === "Pro") return "1080P";
  return "720P";
}

function mapDashScopeDuration(seconds) {
  const requested = Number(seconds || 5);

  if (config.dashscopeVideoModel.includes("wanx2.1-i2v-turbo")) {
    return [3, 4, 5].includes(requested) ? requested : 4;
  }

  if (config.dashscopeVideoModel.includes("wanx2.1-i2v-plus") || config.dashscopeVideoModel.includes("wan2.2-i2v")) {
    return 5;
  }

  if (config.dashscopeVideoModel.includes("wan2.5")) {
    return requested >= 8 ? 10 : 5;
  }

  return Math.max(2, Math.min(15, requested));
}

function mapDashScopeStatus(status) {
  if (status === "SUCCEEDED") return "succeeded";
  if (["FAILED", "CANCELED", "UNKNOWN"].includes(status)) return "failed";
  if (["PENDING", "RUNNING"].includes(status)) return "processing";
  return "queued";
}

function calculateCreditCost(body) {
  const resolution = String(body.resolution || "720p");
  const seconds = Number(body.seconds || 4);
  const template = String(body.template || "");

  const baseCost =
    resolution === "Pro"
      ? 6
      : resolution === "1080p"
        ? 4
        : 2;

  const durationMultiplier = seconds >= 12 ? 3 : seconds >= 8 ? 2 : 1;
  const templateSurcharge = template === "Kiss" ? 1 : 0;

  return baseCost * durationMultiplier + templateSurcharge;
}

async function maybeStoreUploadedImage(job, dataUrl) {
  if (config.storageProvider !== "r2") return null;

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;

  const extension = parsed.contentType === "image/png" ? "png" : parsed.contentType === "image/webp" ? "webp" : "jpg";
  const key = `uploads/${job.userId}/${job.id}.${extension}`;
  const url = await putR2Object(key, parsed.buffer, parsed.contentType);
  return {
    url,
    providerUrl: config.r2PublicBaseUrl ? url : "",
  };
}

async function maybeStoreGeneratedVideo(job) {
  if (config.storageProvider !== "r2") return;
  if (job.status !== "succeeded" || !job.outputUrl) return;
  if (job.outputUrl.includes(config.r2PublicBaseUrl) && config.r2PublicBaseUrl) return;

  try {
    const response = await fetch(job.outputUrl);
    if (!response.ok) {
      throw new Error(`Could not copy generated video to storage: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "video/mp4";
    const key = `outputs/${job.userId}/${job.id}.mp4`;
    const storedUrl = await putR2Object(key, buffer, contentType);
    if (config.r2PublicBaseUrl) job.outputUrl = storedUrl;
  } catch (error) {
    console.warn(error.message);
  }
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function validateUploadImageDataUrl(dataUrl) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return {
      ok: false,
      status: 400,
      code: "UNSUPPORTED_IMAGE",
      message: "Please upload a JPG, PNG, or WebP image before generating.",
    };
  }

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(String(parsed.contentType || "").toLowerCase())) {
    return {
      ok: false,
      status: 400,
      code: "UNSUPPORTED_IMAGE",
      message: "Please upload a JPG, PNG, or WebP image. Other image formats are not supported yet.",
    };
  }

  const maxBytes = Math.max(1, config.maxUploadImageMb) * 1024 * 1024;
  if (parsed.buffer.length > maxBytes) {
    return {
      ok: false,
      status: 413,
      code: "UPLOAD_IMAGE_TOO_LARGE",
      message: `This image is too large. Please upload a JPG, PNG, or WebP image under ${config.maxUploadImageMb} MB.`,
    };
  }

  return { ok: true, ...parsed };
}

async function putR2Object(key, buffer, contentType) {
  ensureR2Config();

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = `${config.r2AccountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodeS3Path(`${config.r2Bucket}/${key}`)}`;
  const endpoint = `https://${host}${canonicalUri}`;
  const payloadHash = sha256Hex(buffer);
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n") + "\n";
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signingKey = getSignatureKey(config.r2SecretAccessKey, dateStamp, "auto", "s3");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate,
    },
    body: buffer,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`R2 upload failed: ${response.status} ${text}`);
  }

  return config.r2PublicBaseUrl ? `${config.r2PublicBaseUrl}/${encodeS3Path(key)}` : `r2://${config.r2Bucket}/${key}`;
}

function ensureR2Config() {
  const missing = [
    ["CLOUDFLARE_R2_ACCOUNT_ID", config.r2AccountId],
    ["CLOUDFLARE_R2_ACCESS_KEY_ID", config.r2AccessKeyId],
    ["CLOUDFLARE_R2_SECRET_ACCESS_KEY", config.r2SecretAccessKey],
    ["CLOUDFLARE_R2_BUCKET", config.r2Bucket],
  ].filter(([, value]) => !value);

  if (missing.length) {
    throw new Error(`Missing R2 config: ${missing.map(([key]) => key).join(", ")}`);
  }
}

function encodeS3Path(path) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function getSignatureKey(secretKey, dateStamp, region, service) {
  const kDate = createHmac("sha256", `AWS4${secretKey}`).update(dateStamp).digest();
  const kRegion = createHmac("sha256", kDate).update(region).digest();
  const kService = createHmac("sha256", kRegion).update(service).digest();
  return createHmac("sha256", kService).update("aws4_request").digest();
}

function getProviderError(result, fallback) {
  return result.message || result.output?.message || result.error?.message || result.code || fallback;
}

function mapSize(ratio, resolution) {
  const pro = resolution === "Pro";
  if (ratio === "16:9") return pro ? "1792x1024" : "1280x720";
  return pro ? "1024x1792" : "720x1280";
}

function serveStatic(pathname, res) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  let filePath = resolve(join(root, cleanPath));
  const extension = extname(filePath);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = resolve(join(filePath, "index.html"));
  }

  if (!extension && !existsSync(filePath)) {
    filePath = resolve(join(root, `${cleanPath}.html`));
  }

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    const notFoundPath = resolve(join(root, "404.html"));
    if (existsSync(notFoundPath)) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      createReadStream(notFoundPath).pipe(res);
      return;
    }
    return sendJson(res, 404, { error: "Not found" });
  }

  const responseHeaders = { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" };
  if (extname(filePath) === ".md") {
    responseHeaders["X-Robots-Tag"] = "noindex, nofollow";
  }
  res.writeHead(200, responseHeaders);
  createReadStream(filePath).pipe(res);
}

function applyBaseSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function appendQuery(url, params) {
  const next = new URL(url, config.appUrl);
  for (const [key, value] of Object.entries(params)) {
    next.searchParams.set(key, value);
  }
  return next.toString();
}

function ensureDb() {
  if (!existsSync(dataDir)) mkdirSync(dataDir);
  if (!existsSync(dbPath)) {
    writeFileSync(dbPath, JSON.stringify(createEmptyDb(), null, 2));
  }
}

function readDb() {
  const db = JSON.parse(readFileSync(dbPath, "utf8"));
  normalizeDb(db);
  return db;
}

function writeDb(db) {
  normalizeDb(db);
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function createEmptyDb() {
  return {
    users: { "demo-user": { credits: config.starterCredits } },
    jobs: {},
    payments: {},
    webhookEvents: {},
    creditLedger: [],
    analyticsEvents: [],
  };
}

function normalizeDb(db) {
  db.users ||= { "demo-user": { credits: config.starterCredits } };
  db.users["demo-user"] ||= { credits: config.starterCredits };
  db.jobs ||= {};
  db.payments ||= {};
  db.webhookEvents ||= {};
  db.creditLedger ||= [];
  db.analyticsEvents ||= [];
  return db;
}

function creditAmountForPlan(plan) {
  return plan === "commerce" ? packPlans().commerce : packPlans().creator;
}

function packPlans() {
  return {
    creator: { credits: config.creatorPackCredits, label: "Creator Pack", price: config.creatorPackPriceLabel },
    commerce: { credits: config.commercePackCredits, label: "Commerce Pack", price: config.commercePackPriceLabel },
  };
}

function readPositiveIntEnv(names, fallback) {
  for (const name of names) {
    const value = Number(process.env[name]);
    if (Number.isInteger(value) && value > 0) return value;
  }
  return fallback;
}

function readNonNegativeIntEnv(names, fallback) {
  for (const name of names) {
    const raw = process.env[name];
    if (raw === undefined || raw === "") continue;
    const value = Number(raw);
    if (Number.isInteger(value) && value >= 0) return value;
  }
  return fallback;
}

function readPositiveNumberEnv(names, fallback) {
  for (const name of names) {
    const raw = process.env[name];
    if (raw === undefined || raw === "") continue;
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return fallback;
}

function addCredits(db, { userId, amount, source, externalId, plan }) {
  db.users[userId] ||= { credits: 0 };
  const ledgerId = `${source}:${externalId}`;
  if (db.creditLedger.some((entry) => entry.id === ledgerId)) {
    return false;
  }

  db.users[userId].credits += amount;
  db.creditLedger.push({
    id: ledgerId,
    userId,
    amount,
    source,
    externalId,
    plan,
    createdAt: new Date().toISOString(),
    balanceAfter: db.users[userId].credits,
  });
  return true;
}

function getEventId(event) {
  return (
    event.id ||
    event.eventId ||
    event.object?.id ||
    event.data?.id ||
    `${event.eventType || event.type || "event"}:${event.created_at || event.createdAt || randomUUID()}`
  );
}

function getPaymentId(event) {
  return (
    event.object?.id ||
    event.data?.id ||
    event.object?.checkout?.id ||
    event.data?.checkout?.id ||
    getEventId(event)
  );
}

function sendApiError(res, status, code, message, extra = {}) {
  return sendJson(res, status, {
    error: message,
    message,
    code,
    ...extra,
  });
}

function publicErrorFromException(error) {
  const message = String(error?.message || error || "");
  if (/body too large/i.test(message)) {
    return {
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
      message: "This image is too large to upload. Please try a smaller JPG, PNG, or WebP photo.",
    };
  }
  if (error instanceof SyntaxError || /json/i.test(message)) {
    return {
      status: 400,
      code: "INVALID_JSON",
      message: "The request could not be read. Please refresh the page and try again.",
    };
  }
  return {
    status: 500,
    code: "SERVER_ERROR",
    message: "Something went wrong while processing your request. Please try again.",
  };
}

function publicVideoProviderError(error) {
  const raw = String(error?.message || error || "");
  const lower = raw.toLowerCase();

  if (lower.includes("api_key") || lower.includes("api key") || lower.includes("missing")) {
    return {
      status: 503,
      code: "VIDEO_PROVIDER_UNAVAILABLE",
      message: "Video generation is temporarily unavailable. Please try again later.",
    };
  }

  if (
    lower.includes("image") ||
    lower.includes("img_url") ||
    lower.includes("unsupported") ||
    lower.includes("invalid input") ||
    lower.includes("invalid file")
  ) {
    return {
      status: 400,
      code: "UNSUITABLE_IMAGE",
      message: "This image may not be suitable for video generation. Try a clear JPG, PNG, or WebP photo with the face or product fully visible.",
    };
  }

  if (
    lower.includes("quota") ||
    lower.includes("rate") ||
    lower.includes("throttl") ||
    lower.includes("busy") ||
    lower.includes("timeout") ||
    lower.includes("too many")
  ) {
    return {
      status: 503,
      code: "VIDEO_PROVIDER_BUSY",
      message: "The video generation service is busy right now. Credits were refunded if a job could not be started.",
    };
  }

  return {
    status: 502,
    code: "VIDEO_PROVIDER_FAILED",
    message: "Video generation failed. Credits were refunded automatically.",
  };
}

function providerFailureRecord(error) {
  const publicError = publicVideoProviderError(error);
  const reason = sanitizeText(error?.message || error || "", 240);
  if (!reason || reason === publicError.message) return publicError.message;
  return `${publicError.message} Provider reason: ${reason}`;
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  });
  res.end(JSON.stringify(data));
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(html);
}

function redirect(res, location) {
  res.writeHead(302, {
    Location: location,
    "Cache-Control": "no-store",
  });
  res.end();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function readJson(req) {
  const raw = await readRaw(req);
  return raw ? JSON.parse(raw) : {};
}

function readRaw(req) {
  return new Promise((resolvePromise, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 12_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolvePromise(raw));
    req.on("error", reject);
  });
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(",")
      .map((part) => part.split("=", 2))
  );
  const timestamp = parts.t;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const signatures = String(signatureHeader)
    .split(",")
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  return signatures.some((sig) => {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

function verifyHmacSignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const candidates = String(signatureHeader)
    .split(",")
    .map((value) => value.trim().replace(/^sha256=/, "").replace(/^v1=/, ""));

  return candidates.some((candidate) => {
    const a = Buffer.from(candidate);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

function loadDotEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
