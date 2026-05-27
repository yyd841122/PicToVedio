import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const dataDir = join(root, "data");
const dbPath = join(dataDir, "db.json");

loadDotEnv();
ensureDb();

const config = {
  port: Number(process.env.PORT || 8787),
  appUrl: process.env.APP_URL || "http://localhost:8787",
  videoProvider: process.env.VIDEO_PROVIDER || "mock",
  dataProvider: process.env.DATA_PROVIDER || "file",
  supabaseUrl: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiVideoModel: process.env.OPENAI_VIDEO_MODEL || "sora-2",
  paymentProvider: process.env.PAYMENT_PROVIDER || "mock",
  creemTestMode: process.env.CREEM_TEST_MODE !== "false",
  creemApiKey: process.env.CREEM_API_KEY || "",
  creemWebhookSecret: process.env.CREEM_WEBHOOK_SECRET || "",
  creemCreatorProduct: process.env.CREEM_PRODUCT_CREATOR || "",
  creemCommerceProduct: process.env.CREEM_PRODUCT_COMMERCE || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripeCreatorPrice: process.env.STRIPE_PRICE_CREATOR || "",
  stripeCommercePrice: process.env.STRIPE_PRICE_COMMERCE || "",
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", config.appUrl);

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { ok: true, provider: config.videoProvider });
    }

    if (req.method === "GET" && url.pathname === "/api/account") {
      return await handleGetAccount(res);
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
    console.error(error);
    return sendJson(res, 500, { error: "Internal server error" });
  }
});

server.listen(config.port, () => {
  console.log(`MotionPic AI listening on ${config.appUrl}`);
  console.log(`Video provider: ${config.videoProvider}`);
});

async function handleCreateVideoJob(req, res) {
  const body = await readJson(req);
  const required = ["imageData", "prompt", "template", "ratio", "resolution", "seconds", "credits"];
  const missing = required.filter((key) => body[key] === undefined || body[key] === "");

  if (missing.length) {
    return sendJson(res, 400, { error: `Missing fields: ${missing.join(", ")}` });
  }

  if (!String(body.imageData).startsWith("data:image/")) {
    return sendJson(res, 400, { error: "imageData must be a data URL image" });
  }

  const cost = Number(body.credits || 1);
  const userId = "demo-user";
  const account = await getAccount(userId);

  if (account.credits < cost) {
    return sendJson(res, 402, { error: "Not enough credits", remainingCredits: account.credits });
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
    error: "",
  };

  const remainingCredits = await createJobAndDebit(job, cost);

  if (config.videoProvider === "openai") {
    try {
      const providerJob = await createOpenAiVideoJob(body);
      job.status = providerJob.status || "queued";
      job.providerJobId = providerJob.id || "";
      job.outputUrl = providerJob.output_url || "";
    } catch (error) {
      job.status = "failed";
      job.error = error.message;
    }

    await saveJob(job);
  }

  if (config.videoProvider === "mock") {
    job.status = "succeeded";
    job.outputUrl = `${config.appUrl}/mock-output.mp4`;
    await saveJob(job);
  }

  return sendJson(res, 200, { ...job, remainingCredits });
}

async function handleGetAccount(res) {
  const account = await getAccount("demo-user");
  return sendJson(res, 200, {
    userId: "demo-user",
    credits: account.credits,
    recentCredits: account.recentCredits,
  });
}

async function handleGetVideoJob(_req, res, id) {
  const job = await getJob(id);

  if (!job) {
    return sendJson(res, 404, { error: "Job not found" });
  }

  if (job.provider === "openai" && job.providerJobId && ["queued", "in_progress"].includes(job.status)) {
    const providerJob = await getOpenAiVideoJob(job.providerJobId);
    job.status = providerJob.status || job.status;
    job.outputUrl = providerJob.output_url || job.outputUrl;
    await saveJob(job);
  }

  return sendJson(res, 200, job);
}

async function handleCheckout(req, res) {
  const body = await readJson(req);
  const plan = body.plan === "commerce" ? "commerce" : "creator";

  if (config.paymentProvider === "creem") {
    return await handleCreemCheckout(res, body, plan);
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
    success_url: `${body.returnUrl || config.appUrl}?checkout=success`,
    cancel_url: `${body.returnUrl || config.appUrl}?checkout=cancelled`,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    "metadata[plan]": plan,
    "metadata[userId]": "demo-user",
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

  return sendJson(res, 200, { url: checkout.url });
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
  const userId = "demo-user";
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

async function handleCreemCheckout(res, body, plan) {
  const productId = plan === "commerce" ? config.creemCommerceProduct : config.creemCreatorProduct;

  if (!config.creemApiKey || !productId) {
    return sendJson(res, 200, {
      mock: true,
      error: "Creem is not configured. Set CREEM_API_KEY and product ids to enable real checkout.",
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
        success_url: appendQuery(body.returnUrl || config.appUrl, { checkout: "success", plan }),
        metadata: {
          plan,
          userId: "demo-user",
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
    };
  }

  const db = readDb();
  normalizeDb(db);
  const user = db.users[userId] || { credits: 0 };
  return {
    credits: user.credits,
    recentCredits: db.creditLedger.slice(-5).reverse(),
  };
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
    return remainingCredits;
  }

  const db = readDb();
  normalizeDb(db);
  db.users[job.userId] ||= { credits: 12 };
  db.users[job.userId].credits -= cost;
  db.jobs[job.id] = job;
  writeDb(db);
  return db.users[job.userId].credits;
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

function isLocalRequest(req) {
  const host = String(req.headers.host || "");
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
}

async function ensureSupabaseUser(userId) {
  const users = await supabaseRequest(`app_users?id=eq.${filterValue(userId)}&select=id&limit=1`);
  if (users.length) return;

  await supabaseRequest("app_users", {
    method: "POST",
    body: { id: userId, credits: 12 },
    prefer: "return=minimal",
  });
}

async function supabaseRequest(path, { method = "GET", body, prefer } = {}) {
  const headers = {
    apikey: config.supabaseServiceRoleKey,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };

  if (!config.supabaseServiceRoleKey.startsWith("sb_")) {
    headers.Authorization = `Bearer ${config.supabaseServiceRoleKey}`;
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.error || `Supabase request failed: ${response.status}`;
    throw new Error(message);
  }
  return data || [];
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
    error: row.error || "",
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

function mapSize(ratio, resolution) {
  const pro = resolution === "Pro";
  if (ratio === "16:9") return pro ? "1792x1024" : "1280x720";
  return pro ? "1024x1792" : "720x1280";
}

function serveStatic(pathname, res) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = resolve(join(root, cleanPath));

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    return sendJson(res, 404, { error: "Not found" });
  }

  res.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
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
    users: { "demo-user": { credits: 12 } },
    jobs: {},
    payments: {},
    webhookEvents: {},
    creditLedger: [],
  };
}

function normalizeDb(db) {
  db.users ||= { "demo-user": { credits: 12 } };
  db.users["demo-user"] ||= { credits: 12 };
  db.jobs ||= {};
  db.payments ||= {};
  db.webhookEvents ||= {};
  db.creditLedger ||= [];
  return db;
}

function creditAmountForPlan(plan) {
  return plan === "commerce"
    ? { credits: 400, label: "Commerce Pack" }
    : { credits: 100, label: "Creator Pack" };
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

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
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
