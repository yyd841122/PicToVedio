import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const sql = readFileSync(new URL("../SUPABASE_ATOMIC_CREDIT_RPC_DRAFT.sql", import.meta.url), "utf8");
const preflight = readFileSync(new URL("../SUPABASE_ATOMIC_CREDIT_PREFLIGHT_READONLY.sql", import.meta.url), "utf8");
const verification = readFileSync(
  new URL("../SUPABASE_ATOMIC_CREDIT_RPC_VERIFY_READONLY.sql", import.meta.url),
  "utf8",
);
const server = readFileSync(new URL("../server.mjs", import.meta.url), "utf8");

assert.match(
  sql,
  /create\s+or\s+replace\s+function\s+public\.motionpic_process_payment_credit\s*\(/i,
  "payment-credit RPC function should be present",
);
assert.match(sql, /security\s+definer/i, "RPC should use security definer");
assert.match(sql, /set\s+search_path\s*=\s*''/i, "RPC should pin an empty search_path");
assert.match(sql, /for\s+update/i, "RPC should lock the user balance row");
assert.doesNotMatch(sql, /if\s+not\s+found\s+then/i, "RPC should use explicit row-found flags");
assert.match(sql, /v_event_found\s+boolean\s*:=\s*false/i, "RPC should track webhook event lookup explicitly");
assert.match(sql, /v_user_found\s+boolean\s*:=\s*false/i, "RPC should track user lookup explicitly");
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
assert.match(preflight, /ledger_missing_payment/i, "preflight should find checkout ledgers without payments");
assert.match(preflight, /payment_event_reused/i, "preflight should find event ids linked to multiple payments");
assert.doesNotMatch(preflight, /\b(insert|update|delete|create|drop|alter|grant|revoke|truncate)\b/i, "preflight must be read-only");
assert.match(
  verification,
  /to_regprocedure\(\s*'public\.motionpic_process_payment_credit\(text,text,text,text,text,text,integer,text\)'\s*\)/i,
  "post-install verification should require the exact RPC signature",
);
assert.match(verification, /prosecdef/i, "post-install verification should check security definer");
assert.match(
  verification,
  /select[\s\S]+p\.proacl[\s\S]+from\s+pg_catalog\.pg_proc\s+p/i,
  "post-install verification should select the function ACL before expanding it",
);
assert.match(verification, /search_path=/i, "post-install verification should check the empty search path");
assert.match(verification, /service_role_execute/i, "post-install verification should check service_role execute");
assert.match(verification, /public_execute_revoked/i, "post-install verification should check public execute");
assert.match(verification, /anon_execute_revoked/i, "post-install verification should check anon execute");
assert.match(
  verification,
  /authenticated_execute_revoked/i,
  "post-install verification should check authenticated execute",
);
assert.match(
  verification,
  /only_service_role_execute/i,
  "post-install verification should reject unexpected non-owner execute grants",
);
assert.doesNotMatch(
  verification,
  /\b(insert|update|delete|create|drop|alter|grant|revoke|truncate|call)\b/i,
  "post-install verification must be read-only",
);
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
