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
      return handleGetAccount(res);
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

  const db = readDb();
  const cost = Number(body.credits || 1);
  const userId = "demo-user";
  db.users[userId] ||= { credits: 12 };

  if (db.users[userId].credits < cost) {
    writeDb(db);
    return sendJson(res, 402, { error: "Not enough credits", remainingCredits: db.users[userId].credits });
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

  db.users[userId].credits -= cost;
  db.jobs[job.id] = job;
  writeDb(db);

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

    const latest = readDb();
    latest.jobs[job.id] = job;
    writeDb(latest);
  }

  if (config.videoProvider === "mock") {
    job.status = "succeeded";
    job.outputUrl = `${config.appUrl}/mock-output.mp4`;
    const latest = readDb();
    latest.jobs[job.id] = job;
    writeDb(latest);
  }

  return sendJson(res, 200, { ...job, remainingCredits: db.users[userId].credits });
}

function handleGetAccount(res) {
  const db = readDb();
  const user = db.users["demo-user"] || { credits: 0 };
  return sendJson(res, 200, { userId: "demo-user", credits: user.credits });
}

async function handleGetVideoJob(_req, res, id) {
  const db = readDb();
  const job = db.jobs[id];

  if (!job) {
    return sendJson(res, 404, { error: "Job not found" });
  }

  if (job.provider === "openai" && job.providerJobId && ["queued", "in_progress"].includes(job.status)) {
    const providerJob = await getOpenAiVideoJob(job.providerJobId);
    job.status = providerJob.status || job.status;
    job.outputUrl = providerJob.output_url || job.outputUrl;
    db.jobs[id] = job;
    writeDb(db);
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

  const body = await readJson(req);
  const plan = body.plan === "commerce" ? "commerce" : "creator";
  const userId = "demo-user";
  const db = readDb();
  db.users[userId] ||= { credits: 0 };
  db.users[userId].credits += plan === "commerce" ? 400 : 100;
  writeDb(db);
  return sendJson(res, 200, {
    ok: true,
    plan,
    creditsAdded: plan === "commerce" ? 400 : 100,
    balance: db.users[userId].credits,
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
  const response = await fetch(`${baseUrl}/v1/checkouts`, {
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

  const checkout = await response.json().catch(() => ({}));
  if (!response.ok) {
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
  if (["checkout.completed", "order.created", "payment.completed"].includes(type)) {
    const metadata = event.object?.metadata || event.data?.metadata || {};
    const userId = metadata.userId || "demo-user";
    const plan = metadata.plan || "creator";
    const db = readDb();
    db.users[userId] ||= { credits: 0 };
    db.users[userId].credits += plan === "commerce" ? 400 : 100;
    writeDb(db);
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
    const db = readDb();
    db.users[userId] ||= { credits: 0 };
    db.users[userId].credits += plan === "commerce" ? 400 : 100;
    writeDb(db);
  }

  return sendJson(res, 200, { received: true });
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
    writeFileSync(dbPath, JSON.stringify({ users: { "demo-user": { credits: 12 } }, jobs: {} }, null, 2));
  }
}

function readDb() {
  return JSON.parse(readFileSync(dbPath, "utf8"));
}

function writeDb(db) {
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
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
