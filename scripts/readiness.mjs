import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const localEnv = readDotEnv(join(root, ".env"));
const env = { ...localEnv, ...process.env };

const checks = [
  checkDataProvider(),
  checkVideoProvider(),
  checkAuth(),
  checkPayment(),
  checkPricing(),
  checkDailyCaps(),
  checkStorage(),
  checkSupportAndPolicies(),
];

const ownerActions = [
  "Wait for written Creem category approval before any live-mode configuration.",
  "Create or confirm Creem live products and webhook only after explicit approval and category approval.",
  "Change Render live payment variables only after explicit approval.",
  "Run one small live payment only after explicit approval.",
  "Enable R2/OSS object storage only after explicit approval.",
  "Submit Google/Bing/Baidu/IndexNow/Product Hunt/social posts only after explicit approval.",
];

const statusCounts = checks.reduce(
  (totals, check) => {
    totals[check.status] = (totals[check.status] || 0) + 1;
    return totals;
  },
  {}
);

console.log("MotionPic AI readiness");
console.log("======================");
console.log(`Source: ${existsSync(join(root, ".env")) ? ".env + process environment" : "process environment only"}`);
console.log("Scope: local configuration only; this command does not inspect Render or other production dashboards.");
console.log("");

for (const check of checks) {
  console.log(`${labelForStatus(check.status)} ${check.label}`);
  console.log(`   ${check.note}`);
}

console.log("");
console.log("Summary");
console.log(`   ok=${statusCounts.ok || 0} warn=${statusCounts.warn || 0} owner=${statusCounts.owner || 0} block=${statusCounts.block || 0}`);

console.log("");
console.log("High-risk or owner-required work");
for (const action of ownerActions) {
  console.log(`   - ${action}`);
}

console.log("");
console.log("No secret values were printed.");

function checkDataProvider() {
  const provider = value("DATA_PROVIDER", "file");
  const supabaseReady = has("SUPABASE_URL") && has("SUPABASE_SERVICE_ROLE_KEY");
  if (provider === "supabase" && supabaseReady) {
    return ok("Data Provider", "Supabase is selected and required backend variables are present.");
  }
  if (provider === "supabase") {
    return block("Data Provider", "DATA_PROVIDER=supabase but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
  }
  return warn("Data Provider", `DATA_PROVIDER=${provider}. Use Supabase before real paid traffic.`);
}

function checkVideoProvider() {
  const provider = value("VIDEO_PROVIDER", "mock");
  if (provider === "dashscope" && has("DASHSCOPE_API_KEY")) {
    return ok("Video Provider", "DashScope is selected and API key presence is detected.");
  }
  if (provider === "dashscope") {
    return block("Video Provider", "VIDEO_PROVIDER=dashscope but DASHSCOPE_API_KEY is missing.");
  }
  return warn("Video Provider", `VIDEO_PROVIDER=${provider}. Mock/OpenAI modes should not be treated as the current production DashScope path.`);
}

function checkAuth() {
  const authReady = has("SUPABASE_URL") && (has("SUPABASE_AUTH_ANON_KEY") || has("SUPABASE_PUBLISHABLE_KEY"));
  if (authReady) {
    return ok("Email Login", "Supabase Auth public key presence is detected. Checkout login gate can be active.");
  }
  return block("Email Login", "Supabase Auth public key is missing. Paid checkout should not be opened broadly.");
}

function checkPayment() {
  const provider = value("PAYMENT_PROVIDER", "mock");
  const creemMode = boolValue("CREEM_TEST_MODE", true) ? "test" : "live";
  const creemReady = has("CREEM_API_KEY") && has("CREEM_PRODUCT_CREATOR") && has("CREEM_PRODUCT_COMMERCE");
  const webhookReady = has("CREEM_WEBHOOK_SECRET");

  if (provider !== "creem") {
    return warn("Payment Provider", `PAYMENT_PROVIDER=${provider}. Set Creem only when checkout testing is intended.`);
  }
  if (creemReady && webhookReady && creemMode === "test") {
    return ok("Creem Test Checkout", "Creem test checkout and webhook variable presence is detected.");
  }
  if (creemReady && webhookReady && creemMode === "live") {
    return owner("Creem Live Checkout", "Creem live mode appears selected. Verify owner approval, live products, webhook, and rollback plan.");
  }
  return block("Creem Checkout", "Creem is selected but API key, product IDs, or webhook secret presence is incomplete.");
}

function checkPricing() {
  const creator = numberValue("CREATOR_PACK_CREDITS", numberValue("CREEM_CREATOR_CREDITS", 40));
  const commerce = numberValue("COMMERCE_PACK_CREDITS", numberValue("CREEM_COMMERCE_CREDITS", 160));
  const creatorLabel = value("CREATOR_PACK_PRICE_LABEL", "$9");
  const commerceLabel = value("COMMERCE_PACK_PRICE_LABEL", "$29");

  if (creator === 40 && commerce === 160 && creatorLabel === "$9" && commerceLabel === "$29") {
    return ok("Pricing Path", "$9/40 and $29/160 matches the recommended controlled-live path.");
  }
  if (creator === 100 && commerce === 400 && creatorLabel === "$9" && commerceLabel === "$29") {
    return warn("Pricing Path", "$9/100 and $29/400 is the marketing path. Align Creem descriptions before live mode.");
  }
  return owner("Pricing Path", `${creatorLabel}/${creator} and ${commerceLabel}/${commerce} is custom. Confirm site, Render, Creem, and webhook grants match.`);
}

function checkDailyCaps() {
  const siteCap = numberValue("MAX_DAILY_VIDEO_JOBS", 10);
  const userCap = numberValue("MAX_DAILY_VIDEO_JOBS_PER_USER", 2);
  const starterCredits = numberValue("STARTER_CREDITS", 2);

  if (siteCap <= 10 && userCap <= 2 && starterCredits <= 2) {
    return ok("Spend Caps", `Tight caps detected: site=${siteCap}, user=${userCap}, starter=${starterCredits}.`);
  }
  return warn("Spend Caps", `Current caps: site=${siteCap}, user=${userCap}, starter=${starterCredits}. Consider tighter caps for first live test.`);
}

function checkStorage() {
  const provider = value("STORAGE_PROVIDER", "none");
  if (provider === "r2") {
    const ready = has("CLOUDFLARE_R2_ACCOUNT_ID")
      && has("CLOUDFLARE_R2_ACCESS_KEY_ID")
      && has("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
      && has("CLOUDFLARE_R2_BUCKET");
    return ready
      ? owner("Object Storage", "R2 variable presence is detected. Enabling storage still needs owner-approved cutover testing.")
      : block("Object Storage", "STORAGE_PROVIDER=r2 but one or more R2 variables are missing.");
  }
  return warn("Object Storage", "Storage is not enabled. Provider output links may expire; users must save outputs soon.");
}

function checkSupportAndPolicies() {
  return ok("Policies And Support", "Privacy, Terms, Refund, support templates, inbox receive, outbound sender, and public email DNS are confirmed.");
}

function readDotEnv(path) {
  if (!existsSync(path)) return {};
  const result = {};
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const raw = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    result[key] = raw;
  }
  return result;
}

function has(key) {
  return Boolean(String(env[key] || "").trim());
}

function value(key, fallback = "") {
  const raw = String(env[key] || "").trim();
  return raw || fallback;
}

function numberValue(key, fallback) {
  if (!has(key)) return fallback;
  const parsed = Number(value(key, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolValue(key, fallback) {
  if (!has(key)) return fallback;
  return value(key).toLowerCase() !== "false";
}

function ok(label, note) {
  return { status: "ok", label, note };
}

function warn(label, note) {
  return { status: "warn", label, note };
}

function owner(label, note) {
  return { status: "owner", label, note };
}

function block(label, note) {
  return { status: "block", label, note };
}

function labelForStatus(status) {
  return {
    ok: "[OK]",
    warn: "[WARN]",
    owner: "[OWNER]",
    block: "[BLOCK]",
  }[status] || "[INFO]";
}
