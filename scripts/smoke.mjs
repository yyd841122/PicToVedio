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
    CREATOR_PACK_CREDITS: "40",
    COMMERCE_PACK_CREDITS: "160",
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
  await assertAccountApi(origin);
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
  const creditPack = ops.livePaymentPreflight.find((item) => item.label === "Credit Packs");
  assert(creditPack?.status === "$9/40 + $29/160", "preflight should show controlled pack values");
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
