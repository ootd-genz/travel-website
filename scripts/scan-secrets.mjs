import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const filesResult = spawnSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
);
if (filesResult.status !== 0) {
  console.error("Secret scan gagal membaca daftar file Git.");
  process.exit(1);
}

const forbiddenFile = /(^|\/)(?:\.env(?:\..+)?|\.insforge\/project\.json|id_rsa|id_ed25519|.*\.(?:pem|key|p12|pfx))$/i;
const allowedFile = /(^|\/)env\.example$/i;
const secretPatterns = [
  ["private_key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["github_token", /\bgh[opsu]_[A-Za-z0-9]{30,}\b/g],
  ["slack_token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ["stripe_live_key", /\bsk_live_[A-Za-z0-9]{16,}\b/g],
  ["aws_access_key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["jwt", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
];
const sensitiveEnvLine =
  /^[ \t]*(?:export[ \t]+)?(SUPABASE_SERVICE_ROLE_KEY|WHATSAPP_ACCESS_TOKEN|ADMIN_SETUP_PASSWORD|OBSERVABILITY_ERROR_WEBHOOK_URL)[ \t]*=[ \t]*([^\r\n]*)$/gm;

const findings = [];
const paths = filesResult.stdout.split("\0").filter(Boolean);
for (const path of paths) {
  const normalizedPath = path.replaceAll("\\", "/");
  if (forbiddenFile.test(normalizedPath) && !allowedFile.test(normalizedPath)) {
    findings.push({ path: normalizedPath, line: 1, rule: "sensitive_file" });
    continue;
  }

  let content;
  try {
    const bytes = readFileSync(path);
    if (bytes.length > 2 * 1024 * 1024 || bytes.includes(0)) continue;
    content = bytes.toString("utf8");
  } catch {
    continue;
  }

  for (const [rule, pattern] of secretPatterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const line = content.slice(0, match.index).split("\n").length;
      findings.push({ path: normalizedPath, line, rule });
    }
  }

  sensitiveEnvLine.lastIndex = 0;
  for (const match of content.matchAll(sensitiveEnvLine)) {
    const rawValue = match[2].trim().replace(/^['"]|['"]$/g, "");
    const isPlaceholder =
      !rawValue ||
      /^(?:your-|example|placeholder|changeme|\[|<|\$\{|Read-Host)/i.test(
        rawValue,
      );
    if (!isPlaceholder) {
      const line = content.slice(0, match.index).split("\n").length;
      findings.push({ path: normalizedPath, line, rule: "server_secret_value" });
    }
  }
}

if (findings.length > 0) {
  console.error("Secret scan menemukan material sensitif:");
  for (const finding of findings) {
    console.error(`- ${finding.path}:${finding.line} (${finding.rule})`);
  }
  process.exit(1);
}

console.log(`Secret scan passed: ${paths.length} tracked/unignored files diperiksa.`);
