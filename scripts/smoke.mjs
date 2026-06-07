import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import net from "node:net";
import vm from "node:vm";

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
  await assertPublicPages(origin);
  await assertSeoMetadata(origin);
  await assertSupportAndLaunchCopy(origin);
  await assertAccountApi(origin);
  await assertAnalyticsUrlPrivacy(origin);
  await assertCheckoutRequiresLogin(origin);
  await assertOpsPreflight(origin);
  await assertInlineScriptsCompile();
  console.log("Smoke checks passed");
} finally {
  server.kill("SIGTERM");
  setTimeout(() => server.kill("SIGKILL"), 1000).unref();
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
      return;
    } catch {
      await delay(150);
    }
  }
  throw new Error(`Server did not become ready. Output:\n${serverOutput}`);
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
  const creditPack = ops.livePaymentPreflight.find((item) => item.label === "Credit Packs");
  assert(creditPack?.status === "$9/40 + $29/160", "preflight should show controlled pack values");
  const dailyCaps = ops.livePaymentPreflight.find((item) => item.label === "Daily Spend Caps");
  assert(dailyCaps?.status === "10 site / 2 user", "preflight should show controlled daily caps");
  const promotionGate = ops.ownerActionChecklist.find((item) => item.area === "Promotion");
  assert(promotionGate?.status === "Do not publish", "ops should keep promotion publishing gated");
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
