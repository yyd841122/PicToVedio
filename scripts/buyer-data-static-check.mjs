import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const schema = readFileSync(new URL("../supabase.sql", import.meta.url), "utf8");
const rpc = readFileSync(new URL("../SUPABASE_ATOMIC_CREDIT_RPC_DRAFT.sql", import.meta.url), "utf8");
const server = readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
const privacy = readFileSync(new URL("../privacy.html", import.meta.url), "utf8");

const paymentsTable = extractBlock(
  schema,
  /create table if not exists payments\s*\(([\s\S]*?)\n\);/i,
  "payments table",
);
const allowedPaymentColumns = new Set([
  "id",
  "provider",
  "event_id",
  "user_id",
  "plan",
  "credits",
  "created_at",
]);
const paymentColumns = [...paymentsTable.matchAll(/^\s*([a-z_][a-z0-9_]*)\s+/gim)].map((match) => match[1]);

assert.deepEqual(
  new Set(paymentColumns),
  allowedPaymentColumns,
  "payments must remain limited to operational payment and credit references",
);

const forbiddenBuyerFields = [
  "email",
  "customer_name",
  "full_name",
  "phone",
  "billing_address",
  "shipping_address",
  "card_number",
  "card_last4",
  "cvv",
];
for (const field of forbiddenBuyerFields) {
  assert.doesNotMatch(paymentsTable, new RegExp(`\\b${field}\\b`, "i"), `payments must not store ${field}`);
}

assert.match(
  server,
  /supabaseRequest\("payments",[\s\S]*?body:\s*\{\s*id:\s*externalId,\s*provider,\s*event_id:\s*eventId\s*\|\|\s*null,\s*user_id:\s*userId,\s*plan,\s*credits:\s*amount,\s*\}/,
  "non-atomic payment persistence must use the reviewed allowlist",
);
assert.match(
  server,
  /supabaseRequest\("webhook_events",[\s\S]*?body:\s*\{\s*id,\s*provider,\s*type\s*\}/,
  "webhook persistence must not save the full provider event body",
);
assert.match(
  rpc,
  /insert into public\.payments\s*\(id,\s*provider,\s*event_id,\s*user_id,\s*plan,\s*credits,\s*created_at\)/i,
  "atomic RPC must use the reviewed payment column allowlist",
);
assert.doesNotMatch(
  rpc,
  /customer_(?:email|name|phone)|billing_address|shipping_address|card_number|cvv/i,
  "atomic RPC must not add buyer profile or card fields",
);
assert.match(
  privacy,
  /does not receive or store full payment card numbers, security codes, or billing addresses/i,
  "privacy policy must disclose payment-data minimization",
);

console.log("Buyer data static checks passed.");

function extractBlock(source, pattern, label) {
  const match = source.match(pattern);
  assert(match, `Could not locate ${label}`);
  return match[1];
}
