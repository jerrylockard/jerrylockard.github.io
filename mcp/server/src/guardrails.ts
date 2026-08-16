export interface SafetyViolation {
  label: string;
  match: string;
}

export interface SafetyResult {
  safe: boolean;
  violations: SafetyViolation[];
}

// Structural/keyword pattern checks only — never embed Jerry's actual
// SSN, student ID, address, or middle name here. That defeats the point.
const CHECKS: { label: string; pattern: RegExp }[] = [
  { label: "SSN-shaped number", pattern: /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/ },
  { label: "Social Security reference", pattern: /\bsocial\s+security\b/i },
  { label: "GPA / grade point average", pattern: /\bgpa\b|\bgrade\s+point\s+average\b/i },
  { label: "Student ID reference", pattern: /\bstudent\s*id\b/i },
  {
    label: "Street-address shape",
    pattern: /\b\d{1,5}\s+[A-Za-z0-9.'\s]{2,30}\b(rd|road|st|street|ave|avenue|apt|dr|drive|ln|lane|blvd|way|ct|court)\b\.?/i,
  },
  { label: "Inserted middle name (Jerry ___ Lockard)", pattern: /\bJerry\s+\S+\s+Lockard\b/ },
  {
    label: "Run-for-office ambition",
    pattern: /\brun(ning)?\s+for\s+(public\s+)?office\b|\bpolitical\s+ambition\b|\bfuture\s+political\s+actor\b/i,
  },
];

export function checkContentSafety(text: string): SafetyResult {
  const violations: SafetyViolation[] = [];
  for (const check of CHECKS) {
    const match = text.match(check.pattern);
    if (match) violations.push({ label: check.label, match: match[0] });
  }
  return { safe: violations.length === 0, violations };
}
