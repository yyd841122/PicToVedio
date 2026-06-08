import { spawn, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import net from "node:net";
import vm from "node:vm";
import { formatJobAge, isStalePendingJob } from "../lib/job-status.mjs";
import { parseTimestampMs } from "../lib/timestamps.mjs";

const root = new URL("../", import.meta.url);
const port = await findOpenPort();
const origin = `http://127.0.0.1:${port}`;

const server = spawn(process.execPath, ["server.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    APP_URL: origin,
    DATA_PROVIDER: "file",
    VIDEO_PROVIDER: "mock",
    MOCK_VIDEO_FAILURE: "true",
    PAYMENT_PROVIDER: "mock",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_AUTH_ANON_KEY: "test-public-key",
    STARTER_CREDITS: "2",
  },
  stdio: "pipe",
});

let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

try {
  await waitForHealth(origin);
  await assertSecurityHeaders(origin);
  await assertPublicPages(origin);
  await assertFavicon(origin);
  await assertSeoMetadata(origin);
  await assertHomeFormSemantics(origin);
  await assertSupportAndLaunchCopy(origin);
  await assertAccountApi(origin);
  await assertFailedJobRefund(origin);
  await assertAnalyticsUrlPrivacy(origin);
  await assertCheckoutRequiresLogin(origin);
  await assertOpsPreflight(origin);
  assertTimestampParsing();
  assertStaleJobDetection();
  assertReadinessStatus();
  await assertInlineScriptsCompile();
  console.log("Smoke checks passed");
} finally {
  server.kill("SIGTERM");
  setTimeout(() => server.kill("SIGKILL"), 1000).unref();
}

async function assertSecurityHeaders(baseUrl) {
  const paths = ["/", "/login", "/favicon.ico", "/health", "/missing-security-check"];

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`);
    assert(
      response.headers.get("x-content-type-options") === "nosniff",
      `${path} should disable MIME sniffing`,
    );
    assert(
      response.headers.get("x-frame-options") === "DENY",
      `${path} should block framing`,
    );
    assert(
      response.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
      `${path} should limit referrer disclosure`,
    );
    assert(
      response.headers.get("permissions-policy") === "camera=(), microphone=(), geolocation=()",
      `${path} should disable unused sensitive browser permissions`,
    );
  }

  const accountResponse = await fetch(`${baseUrl}/api/account`, {
    headers: { "X-MotionPic-User-ID": "mp_securitycheckuser1234567890" },
  });
  assert(
    accountResponse.headers.get("cache-control") === "no-store",
    "JSON account responses should not be cached",
  );
}

function assertReadinessStatus() {
  const result = spawnSync(process.execPath, ["scripts/readiness.mjs"], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
  });
  assert(result.status === 0, "readiness command should complete successfully");
  assert(
    result.stdout.includes("inbox receive, outbound sender, and public email DNS are confirmed"),
    "readiness should report the confirmed support email path",
  );
  assert(
    !result.stdout.includes("Confirm the public support inbox is actively monitored"),
    "readiness should not list completed support inbox work as an owner action",
  );
}

async function findOpenPort() {
  return await new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.on("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      listener.close(() => resolve(address.port));
    });
  });
}

async function waitForHealth(baseUrl) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();
      assert(response.ok, "/health should return 200");
      assert(data.ok === true, "/health should report ok=true");
      assert(data.provider === "mock", "/health should use mock provider in smoke");
      assert(data.build === "local", "/health should identify the local build");
      assert(Number.isFinite(Date.parse(data.serverTime)), "/health should include a valid server timestamp");
      return;
    } catch {
      await delay(150);
    }
  }
  throw new Error(`Server did not become ready. Output:\n${serverOutput}`);
}

async function assertFavicon(baseUrl) {
  const response = await fetch(`${baseUrl}/favicon.ico`);
  assert(response.ok, "/favicon.ico should resolve without a 404");
  assert(
    response.headers.get("content-type") === "image/x-icon",
    "/favicon.ico should return an icon response",
  );
  assert(response.url === `${baseUrl}/favicon.ico`, "/favicon.ico should be served directly");
  const iconBytes = new Uint8Array(await response.arrayBuffer());
  assert(iconBytes.byteLength > 1000, "/favicon.ico should return a non-empty image");
  assert(iconBytes[0] === 0 && iconBytes[1] === 0, "favicon should use the ICO header");
  assert(iconBytes[2] === 1 && iconBytes[3] === 0, "favicon should identify itself as an icon");
  assert(iconBytes[4] === 3 && iconBytes[5] === 0, "favicon should include 16, 32, and 48 pixel sizes");

  await assertPngDimensions(baseUrl, "/favicon-32.png", 32);
  await assertPngDimensions(baseUrl, "/apple-touch-icon.png", 180);
  await assertPngDimensions(baseUrl, "/icon-192.png", 192);
  await assertPngDimensions(baseUrl, "/icon-512.png", 512);

  const manifestResponse = await fetch(`${baseUrl}/site.webmanifest`);
  assert(manifestResponse.ok, "/site.webmanifest should return 200");
  assert(
    manifestResponse.headers.get("content-type")?.startsWith("application/manifest+json"),
    "/site.webmanifest should use the manifest content type",
  );
  const manifest = await manifestResponse.json();
  assert(manifest.name === "MotionPic AI", "manifest should use the product name");
  assert(manifest.icons?.length === 2, "manifest should include 192 and 512 pixel icons");
}

async function assertPngDimensions(baseUrl, path, expectedSize) {
  const response = await fetch(`${baseUrl}${path}`);
  assert(response.ok, `${path} should return 200`);
  assert(response.headers.get("content-type") === "image/png", `${path} should be a PNG`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert(bytes.byteLength > 24, `${path} should contain PNG data`);
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  signature.forEach((value, index) => {
    assert(bytes[index] === value, `${path} should have a valid PNG signature`);
  });
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert(view.getUint32(16, false) === expectedSize, `${path} should be ${expectedSize}px wide`);
  assert(view.getUint32(20, false) === expectedSize, `${path} should be ${expectedSize}px high`);
}

async function assertPublicPages(baseUrl) {
  const pages = [
    "/",
    "/account",
    "/login",
    "/auth-callback",
    "/privacy",
    "/terms",
    "/refund",
    "/guides",
    "/guides/best-photos-for-ai-video",
    "/guides/reduce-ai-video-distortion",
    "/guides/photo-to-video-cost",
    "/templates/ai-kiss-video",
    "/templates/product-video-ad",
    "/templates/pet-animation",
    "/templates/old-photo-alive",
    "/launch-kit",
    "/site.webmanifest",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
  ];

  for (const path of pages) {
    const response = await fetch(`${baseUrl}${path}`);
    assert(response.ok, `${path} should return 200`);
    const body = await response.text();
    assert(body.length > 100, `${path} should return content`);
  }
}

async function assertHomeFormSemantics(baseUrl) {
  const home = await fetchText(baseUrl, "/");
  assert(
    home.includes('<label class="visually-hidden" for="fileInput">'),
    "homepage file upload should have an associated label",
  );
  assert(
    home.includes('id="templateGrid" role="group" aria-labelledby="templateLabel"'),
    "template buttons should use a labelled group",
  );
  assert(
    home.includes('class="option-grid" role="group" aria-labelledby="ratioLabel"'),
    "aspect-ratio buttons should use a labelled group",
  );
  assert(
    home.includes('class="option-grid" role="group" aria-labelledby="qualityLabel"'),
    "quality buttons should use a labelled group",
  );
  assert(
    !home.includes('<label for="templateGrid">'),
    "labels should not target non-form containers",
  );
  assert(
    home.includes('setAllText(".editor .field-group > .field-label, .editor .field-group > label"'),
    "localized field titles should include labels and labelled button groups",
  );
}

async function assertSeoMetadata(baseUrl) {
  const home = await fetchText(baseUrl, "/");
  assert(home.includes('<link rel="canonical" href="https://video.cozyguidehub.com/"'), "homepage should have canonical URL");
  assert(home.includes('<meta name="robots" content="index, follow"'), "homepage should be indexable");
  assert(home.includes('property="og:image"'), "homepage should include Open Graph image");
  assert(home.includes('name="twitter:card"'), "homepage should include Twitter card");

  const jsonLdBlocks = extractJsonLd(home);
  assert(jsonLdBlocks.length >= 1, "homepage should include JSON-LD");
  const graph = jsonLdBlocks.flatMap((block) => block["@graph"] || [block]);
  const faq = graph.find((entry) => entry["@type"] === "FAQPage");
  assert(faq, "homepage JSON-LD should include FAQPage");
  assert((faq.mainEntity || []).length >= 7, "homepage FAQ JSON-LD should cover support/refund questions");

  const sitemap = await fetchText(baseUrl, "/sitemap.xml");
  [
    "https://video.cozyguidehub.com/",
    "https://video.cozyguidehub.com/templates/product-video-ad",
    "https://video.cozyguidehub.com/guides/best-photos-for-ai-video",
  ].forEach((url) => assert(sitemap.includes(url), `sitemap should include ${url}`));
  ["/account", "/admin", ".md"].forEach((privatePath) => {
    assert(!sitemap.includes(privatePath), `sitemap should not include ${privatePath}`);
  });

  const robots = await fetchText(baseUrl, "/robots.txt");
  ["Disallow: /admin", "Disallow: /account", "Disallow: /*.md"].forEach((rule) => {
    assert(robots.includes(rule), `robots.txt should include ${rule}`);
  });
}

async function assertSupportAndLaunchCopy(baseUrl) {
  const account = await fetchText(baseUrl, "/account");
  assert(account.includes("<title>Account - MotionPic AI</title>"), "account page should use the current account title");
  assert(account.includes("Email login is available now"), "account page should say email login is available");
  assert(account.includes("Sign in with email to keep access across browser sessions and devices"), "browser accounts should explain the login benefit");
  assert(!account.includes("Email login is planned"), "account page should not describe released email login as planned");

  const refund = await fetchText(baseUrl, "/refund");
  assert(refund.includes("If a provider request fails technically"), "refund page should explain failed generation refunds");
  assert(refund.includes("If a job succeeds but the result is aesthetically imperfect"), "refund page should explain imperfect successful outputs");
  assert(refund.includes("MotionPic account ID"), "refund page should tell users to include the account ID");
  assert(refund.includes("selected template"), "refund page should tell users to include the selected template");
  assert(refund.includes("Do not send private photos unless support specifically asks"), "refund page should discourage private photo sharing");

  const launchKit = await fetchText(baseUrl, "/launch-kit");
  assert(launchKit.includes("Private launch helper"), "launch kit should identify itself as a private helper");
  assert(launchKit.includes("Launch gates"), "launch kit should show launch gates");
  assert(launchKit.includes("Owner only"), "launch kit should show owner-only guardrails");
  assert(launchKit.includes("一张照片变 AI 短视频"), "launch kit should keep Xiaohongshu copy readable");
  assert(launchKit.includes("At least three Stage 1 Good videos are saved privately"), "launch kit should show preserved demo status");
  assert(launchKit.includes("A real provider failure is still unverified"), "launch kit should distinguish local refund tests from production proof");
  ["涓€", "鎴", "瀹", "�"].forEach((garbled) => {
    assert(!launchKit.includes(garbled), `launch kit should not contain garbled text marker ${garbled}`);
  });
}

async function assertAccountApi(baseUrl) {
  const response = await fetch(`${baseUrl}/api/account`, {
    headers: { "X-MotionPic-User-ID": "mp_smoketestuser1234567890" },
  });
  const account = await response.json();
  assert(response.ok, "/api/account should return 200");
  assert(account.authAvailable === true, "/api/account should report authAvailable=true");
  assert(account.authenticated === false, "/api/account should report authenticated=false without cookie");
  assert(account.credits === 2, "/api/account should use STARTER_CREDITS=2");
  assert(account.plans?.creator?.credits === 40, "/api/account should expose controlled creator credits");
}

async function assertFailedJobRefund(baseUrl) {
  const userId = `mp_refundtest${Date.now()}`;
  const headers = {
    "Content-Type": "application/json",
    "X-MotionPic-User-ID": userId,
  };
  const createResponse = await fetch(`${baseUrl}/api/video/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      imageData: "data:image/png;base64,iVBORw0KGgo=",
      prompt: "subtle motion",
      template: "Portrait",
      ratio: "9:16",
      resolution: "720p",
      seconds: 4,
    }),
  });
  const failedJob = await createResponse.json();
  assert(createResponse.ok, "mock failed job should return its final job state");
  assert(failedJob.status === "failed", "mock failure mode should create a failed job");
  assert(failedJob.credits === 2, "failed standard job should record a 2-credit cost");
  assert(failedJob.remainingCredits === 2, "failed job should restore the starter balance");
  assert(failedJob.error.includes("Credits were refunded automatically"), "failed job should explain the refund");

  const accountResponse = await fetch(`${baseUrl}/api/account`, {
    headers: { "X-MotionPic-User-ID": userId },
  });
  const account = await accountResponse.json();
  assert(accountResponse.ok, "refund test account should be readable");
  assert(account.credits === 2, "refund test account should retain its original balance");
  const jobEntries = account.recentCredits.filter((entry) => entry.externalId === failedJob.id);
  assert(jobEntries.length === 2, "failed job should have exactly one debit and one refund ledger entry");
  assert(
    jobEntries.some((entry) => entry.source === "video-debit" && entry.amount === -2),
    "failed job should retain its debit ledger entry",
  );
  assert(
    jobEntries.some((entry) => entry.source === "video-refund" && entry.amount === 2),
    "failed job should create one refund ledger entry",
  );

  const repeatResponse = await fetch(`${baseUrl}/api/video/jobs/${encodeURIComponent(failedJob.id)}`, {
    headers: { "X-MotionPic-User-ID": userId },
  });
  assert(repeatResponse.ok, "failed job should remain readable");
  const repeatedAccountResponse = await fetch(`${baseUrl}/api/account`, {
    headers: { "X-MotionPic-User-ID": userId },
  });
  const repeatedAccount = await repeatedAccountResponse.json();
  assert(repeatedAccount.credits === 2, "reading a failed job again should not change the balance");
  assert(
    repeatedAccount.recentCredits.filter(
      (entry) => entry.externalId === failedJob.id && entry.source === "video-refund",
    ).length === 1,
    "reading a failed job again should not create a duplicate refund",
  );
}

async function assertAnalyticsUrlPrivacy(baseUrl) {
  const sensitivePage = "/?checkout=success&plan=creator&request_id=req_private&checkout_id=ch_private&order_id=ord_private&customer_id=cust_private";
  const response = await fetch(`${baseUrl}/api/analytics/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-MotionPic-User-ID": "mp_smoketestuser1234567890",
    },
    body: JSON.stringify({
      name: "privacy_url_check",
      page: sensitivePage,
      referrer: `${baseUrl}${sensitivePage}`,
      properties: {
        landingPage: sensitivePage,
        plan: "creator",
      },
    }),
  });
  assert(response.ok, "analytics privacy event should be accepted");

  const summaryResponse = await fetch(`${baseUrl}/api/admin/analytics?limit=50`);
  const summary = await summaryResponse.json();
  assert(summaryResponse.ok, "analytics summary should be available from localhost");
  const event = summary.recent.find((item) => item.name === "privacy_url_check");
  assert(event, "analytics privacy event should be returned");
  assert(event.page === "/?checkout=success&plan=creator", "analytics page should retain only safe query parameters");
  assert(event.referrer === `${baseUrl}/?checkout=success&plan=creator`, "analytics referrer should retain only safe query parameters");
  assert(event.properties?.landingPage === "/?checkout=success&plan=creator", "analytics landing page should retain only safe query parameters");
  const serialized = JSON.stringify(event);
  ["request_id", "checkout_id", "order_id", "customer_id", "req_private", "ch_private", "ord_private", "cust_private"].forEach((value) => {
    assert(!serialized.includes(value), `analytics event should not retain ${value}`);
  });
}

async function assertCheckoutRequiresLogin(baseUrl) {
  const response = await fetch(`${baseUrl}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-MotionPic-User-ID": "mp_smoketestuser1234567890",
    },
    body: JSON.stringify({ plan: "creator", userId: "mp_smoketestuser1234567890", returnUrl: baseUrl }),
  });
  const payload = await response.json();
  assert(response.status === 401, "/api/checkout should require login when Auth is available");
  assert(payload.code === "LOGIN_REQUIRED", "/api/checkout should return LOGIN_REQUIRED");
}

async function assertOpsPreflight(baseUrl) {
  const response = await fetch(`${baseUrl}/api/admin/ops`);
  const ops = await response.json();
  assert(response.ok, "/api/admin/ops should return 200 from localhost");
  assert(Array.isArray(ops.livePaymentPreflight), "ops should include livePaymentPreflight");
  assert(ops.livePaymentPreflight.length >= 8, "preflight should include all launch checks");
  assert(Array.isArray(ops.ownerActionChecklist), "ops should include ownerActionChecklist");
  assert(ops.ownerActionChecklist.length >= 6, "owner action queue should include high-risk gates");
  assert(ops.totals?.stalePendingJobs === 0, "fresh local ops data should have no stale pending jobs");
  const creditPack = ops.livePaymentPreflight.find((item) => item.label === "Credit Packs");
  assert(creditPack?.status === "$9/40 + $29/160", "preflight should show controlled pack values");
  const dailyCaps = ops.livePaymentPreflight.find((item) => item.label === "Daily Spend Caps");
  assert(dailyCaps?.status === "10 site / 2 user", "preflight should show controlled daily caps");
  const promotionGate = ops.ownerActionChecklist.find((item) => item.area === "Promotion");
  assert(promotionGate?.status === "Do not publish", "ops should keep promotion publishing gated");
}

function assertTimestampParsing() {
  const expected = Date.UTC(2026, 5, 4, 8, 47, 40, 123);
  [
    "2026-06-04T08:47:40.123456+00:00",
    "2026-06-04 08:47:40.123456+00",
    "2026-06-04T08:47:40.123456+00",
  ].forEach((value) => {
    assert(parseTimestampMs(value) === expected, `timestamp parser should support ${value}`);
  });
  assert(Number.isNaN(parseTimestampMs("")), "timestamp parser should reject empty values");
}

function assertStaleJobDetection() {
  const now = Date.UTC(2026, 5, 7, 8, 0, 1);
  const oldJob = { status: "processing", createdAt: "2026-06-04T08:00:00.123456+00" };
  const freshJob = { status: "processing", createdAt: "2026-06-07T07:45:00+00" };
  assert(isStalePendingJob(oldJob, now), "three-day processing job should be stale");
  assert(formatJobAge(oldJob, now) === "3d", "three-day processing job should display 3d age");
  assert(!isStalePendingJob(freshJob, now), "15-minute processing job should not be stale");
  assert(!isStalePendingJob({ ...oldJob, status: "succeeded" }, now), "succeeded job should not be stale");
}

async function fetchText(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  assert(response.ok, `${path} should return 200`);
  return await response.text();
}

function extractJsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
}

async function assertInlineScriptsCompile() {
  const files = ["index.html", "login.html", "auth-callback.html"].map((file) => new URL(file, root));
  let compiled = 0;
  for (const file of files) {
    const html = await readFile(file, "utf8");
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
    scripts.forEach((script, index) => {
      new vm.Script(script, { filename: `${file.pathname}#inline-${index}.js` });
      compiled += 1;
    });
  }
  assert(compiled >= 3, "expected inline scripts to compile");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
