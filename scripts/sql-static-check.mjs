import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const sql = readFileSync(new URL("../SUPABASE_ATOMIC_CREDIT_RPC_DRAFT.sql", import.meta.url), "utf8");
const preflight = readFileSync(new URL("../SUPABASE_ATOMIC_CREDIT_PREFLIGHT_READONLY.sql", import.meta.url), "utf8");
const server = readFileSync(new URL("../server.mjs", import.meta.url), "utf8");

assert.match(
  sql,
  /create\s+or\s+replace\s+function\s+public\.motionpic_process_payment_credit\s*\(/i,
  "payment-credit RPC function should be present",
);
assert.match(sql, /security\s+definer/i, "RPC should use security definer");
assert.match(sql, /set\s+search_path\s*=\s*''/i, "RPC should pin an empty search_path");
assert.match(sql, /for\s+update/i, "RPC should lock the user balance row");
assert.match(
  sql,
  /from\s+public\.webhook_events\s+as\s+e[\s\S]+where\s+e\.id\s*=\s*v_event_id[\s\S]+for\s+update/i,
  "RPC should lock the webhook event row before checking its payment linkage",
);
assert.match(sql, /on\s+conflict\s*\(id\)\s+do\s+nothing/i, "RPC should tolerate duplicate event/user inserts");
assert.match(sql, /credit_ledger/i, "RPC should write or inspect credit_ledger");
assert.match(sql, /webhook_events/i, "RPC should record webhook_events in the same transaction");
assert.match(sql, /payments/i, "RPC should write or inspect payments");
assert.match(sql, /app_users/i, "RPC should update app_users");
assert.match(
  sql,
  /Existing payment has no credit ledger row and requires manual reconciliation/i,
  "legacy payment rows without ledgers should stop for manual review",
);
assert.match(
  sql,
  /Existing credit ledger has no payment row and requires manual reconciliation/i,
  "ledger rows without payments should stop for manual review",
);
assert.match(
  sql,
  /Existing credit ledger row does not match the attempted credit grant/i,
  "duplicate ledger rows should be validated before returning success",
);
assert.match(
  sql,
  /Existing webhook event is already linked to a different payment/i,
  "one webhook event must not grant more than one payment",
);
assert.match(
  preflight,
  /left\s+join\s+public\.credit_ledger[\s\S]+where\s+l\.id\s+is\s+null/i,
  "preflight should find legacy payments without matching ledgers",
);
assert.match(preflight, /payment_ledger_mismatch/i, "preflight should find payment and ledger field mismatches");
assert.match(preflight, /payment_event_reused/i, "preflight should find event ids linked to multiple payments");
assert.doesNotMatch(preflight, /\b(insert|update|delete|create|drop|alter|grant|revoke|truncate)\b/i, "preflight must be read-only");
assert.match(
  server,
  /process\.env\.SUPABASE_ATOMIC_CREDIT_RPC\s*===\s*"true"/,
  "backend RPC integration should require an explicit true feature flag",
);
assert.match(
  server,
  /rpc\/motionpic_process_payment_credit/,
  "backend should call the reviewed payment-credit RPC endpoint",
);
assert.match(
  sql,
  /revoke\s+execute[\s\S]+motionpic_process_payment_credit[\s\S]+from\s+public/i,
  "RPC execute should be revoked from public",
);
assert.match(
  sql,
  /revoke\s+execute[\s\S]+motionpic_process_payment_credit[\s\S]+from\s+anon,\s*authenticated/i,
  "RPC execute should be revoked from anon and authenticated",
);
assert.match(
  sql,
  /grant\s+execute[\s\S]+motionpic_process_payment_credit[\s\S]+to\s+service_role/i,
  "RPC execute should be granted to service_role",
);

const executeGrants = sql
  .split(/\r?\n/)
  .filter((line) => /^\s*grant\s+execute\b/i.test(line) || /^\s*to\s+/i.test(line))
  .join("\n");
assert.doesNotMatch(executeGrants, /\bto\s+(public|anon|authenticated)\b/i, "RPC must not grant execute to browser roles");

console.log("SQL static checks passed");
