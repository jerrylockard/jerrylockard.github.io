export interface RiskCheck {
  needsConfirmation: boolean;
  reason?: string;
}

const RISKY_BASH: { reason: string; pattern: RegExp }[] = [
  { reason: "git push", pattern: /\bgit\s+push\b/i },
  { reason: "force push / force flag", pattern: /\bgit\b.*(--force|-f\b)/i },
  { reason: "git commit --amend", pattern: /\bgit\s+commit\b.*--amend\b/i },
  { reason: "git reset --hard", pattern: /\bgit\s+reset\b.*--hard\b/i },
  { reason: "skip hooks", pattern: /--no-verify\b|--no-gpg-sign\b/i },
  { reason: "recursive/force delete", pattern: /\brm\s+.*-[a-z]*r[a-z]*f[a-z]*\b|\brm\s+.*-[a-z]*f[a-z]*r[a-z]*\b/i },
  { reason: "dependency change", pattern: /\b(pnpm|npm|yarn)\s+(add|install|remove|uninstall|update|upgrade)\b/i },
  { reason: "branch switch/create", pattern: /\bgit\s+(checkout|switch)\s+-?b?\s*\S+/i },
];

const PROTECTED_PATHS: RegExp[] = [
  /astro\.config\.mjs$/i,
  /(^|[\\/])package\.json$/i,
  /pnpm-workspace\.yaml$/i,
  /tsconfig(\..*)?\.json$/i,
  /(^|[\\/])mcp[\\/]AGENTS\.md$/i,
  /(^|[\\/])mcp[\\/]agents[\\/]/i,
  /\.env(\..*)?$/i,
  /(^|[\\/])\.git[\\/]/i,
];

export function checkBashRisk(command: string): RiskCheck {
  for (const { reason, pattern } of RISKY_BASH) {
    if (pattern.test(command)) return { needsConfirmation: true, reason };
  }
  return { needsConfirmation: false };
}

export function checkFilePathRisk(filePath: string): RiskCheck {
  for (const pattern of PROTECTED_PATHS) {
    if (pattern.test(filePath)) return { needsConfirmation: true, reason: "protected/config file" };
  }
  return { needsConfirmation: false };
}
