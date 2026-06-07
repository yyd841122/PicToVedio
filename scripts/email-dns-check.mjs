import { resolveMx, resolveTxt } from "node:dns/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const domain = (process.argv[2] || "cozyguidehub.com").trim().toLowerCase();
const sendDomain = `send.${domain}`;
const dkimDomain = `resend._domainkey.${domain}`;
const dmarcDomain = `_dmarc.${domain}`;
const execFileAsync = promisify(execFile);

function flattenTxt(records) {
  return records.map((chunks) => chunks.join(""));
}

function normalizeHost(value) {
  return String(value || "").trim().toLowerCase().replace(/\.$/, "");
}

async function loadWindowsDnsSnapshot() {
  const script = `
$ErrorActionPreference = "Stop"
function Get-TxtRecords([string]$Name) {
  @(
    Resolve-DnsName -Name $Name -Type TXT |
      Where-Object { $_.Type -eq "TXT" } |
      ForEach-Object { $_.Strings -join "" }
  )
}
function Get-MxRecords([string]$Name) {
  @(
    Resolve-DnsName -Name $Name -Type MX |
      Where-Object { $_.Type -eq "MX" } |
      ForEach-Object {
        [ordered]@{
          exchange = $_.NameExchange
          priority = [int]$_.Preference
        }
      }
  )
}
[ordered]@{
  rootMx = @(Get-MxRecords "${domain}")
  dkimTxt = @(Get-TxtRecords "${dkimDomain}")
  sendMx = @(Get-MxRecords "${sendDomain}")
  sendTxt = @(Get-TxtRecords "${sendDomain}")
  dmarcTxt = @(Get-TxtRecords "${dmarcDomain}")
} | ConvertTo-Json -Compress -Depth 5
`;

  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { timeout: 15000, windowsHide: true, maxBuffer: 1024 * 1024 },
  );

  return JSON.parse(stdout.trim());
}

const windowsSnapshot =
  process.platform === "win32" ? await loadWindowsDnsSnapshot() : null;

async function lookupMx(name) {
  if (!windowsSnapshot) return resolveMx(name);
  return name === domain ? windowsSnapshot.rootMx : windowsSnapshot.sendMx;
}

async function lookupTxt(name) {
  if (!windowsSnapshot) return flattenTxt(await resolveTxt(name));
  if (name === dkimDomain) return windowsSnapshot.dkimTxt;
  if (name === sendDomain) return windowsSnapshot.sendTxt;
  return windowsSnapshot.dmarcTxt;
}

const checks = [
  {
    label: "Cloudflare inbound MX",
    run: async () => {
      const records = await lookupMx(domain);
      return records.some(({ exchange }) =>
        normalizeHost(exchange).endsWith(".mx.cloudflare.net"),
      );
    },
  },
  {
    label: "Resend DKIM",
    run: async () => {
      const records = await lookupTxt(dkimDomain);
      return records.some((value) => value.startsWith("p=") && value.length > 40);
    },
  },
  {
    label: "Resend return-path MX",
    run: async () => {
      const records = await lookupMx(sendDomain);
      return records.some(
        ({ exchange, priority }) =>
          normalizeHost(exchange) ===
            "feedback-smtp.us-east-1.amazonses.com" && priority === 10,
      );
    },
  },
  {
    label: "Resend SPF",
    run: async () => {
      const records = await lookupTxt(sendDomain);
      return records.some(
        (value) =>
          value.startsWith("v=spf1") &&
          value.includes("include:amazonses.com"),
      );
    },
  },
  {
    label: "DMARC monitoring policy",
    run: async () => {
      const records = await lookupTxt(dmarcDomain);
      return records.some(
        (value) =>
          value.startsWith("v=DMARC1") && /(?:^|;)\s*p=none(?:;|$)/i.test(value),
      );
    },
  },
];

console.log(`Email DNS check: ${domain}`);

let failed = 0;

for (const check of checks) {
  try {
    const passed = await check.run();
    console.log(`${passed ? "[OK]" : "[FAIL]"} ${check.label}`);
    if (!passed) failed += 1;
  } catch (error) {
    const code = error && typeof error === "object" ? error.code : "";
    console.log(`[FAIL] ${check.label}${code ? ` (${code})` : ""}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`Email DNS check failed: ${failed} check(s) need review.`);
  process.exitCode = 1;
} else {
  console.log("Email DNS check passed. No credential values were read or printed.");
}
