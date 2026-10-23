export interface SanitizeResult {
  allowed: boolean;
  reason?: string;
}

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /\bsorry\b/, description: "The 'sorry' escape is forbidden in ProofQuest." },
  { pattern: /\baxiom\b/, description: "Declaring custom axioms is forbidden." },
  { pattern: /\bnative_decide\b/, description: "The 'native_decide' escape tactic is forbidden." },
  { pattern: /\bdecide\b/, description: "Direct 'decide' shortcut is disabled; please use game tactics." },
  { pattern: /\bunsafe\b/, description: "Unsafe code execution is strictly prohibited." },
  { pattern: /#eval\b/, description: "#eval commands are not permitted." },
  { pattern: /#check\b/, description: "#check commands are not permitted." },
  { pattern: /#print\b/, description: "#print commands are not permitted." },
  { pattern: /#reduce\b/, description: "#reduce commands are not permitted." },
  { pattern: /\brun_cmd\b/, description: "Meta command execution is prohibited." },
  { pattern: /\bimport\b/, description: "Imports are controlled by the server template." },
  { pattern: /\bopen\b/, description: "Namespace opening is controlled by the server template." },
  { pattern: /\bset_option\b/, description: "Compiler options may not be altered." },
  { pattern: /\battribute\b/, description: "Attribute modifications are forbidden." },
  { pattern: /\binitialize\b/, description: "Initialization blocks are prohibited." },
  { pattern: /\belab\b/, description: "Custom elaborators cannot be defined by player code." },
  { pattern: /\belab_rules\b/, description: "Elaborator rules are disabled." },
  { pattern: /\bIO\b/, description: "IO operations are forbidden." },
  { pattern: /\bSystem\b/, description: "System calls are forbidden." },
  { pattern: /\bProcess\b/, description: "Process execution is forbidden." },
  { pattern: /\bFilePath\b/, description: "Filesystem operations are forbidden." }
];

export function sanitizePlayerCode(code: string, allowHelpers: boolean = false): SanitizeResult {
  if (code.length > 4000) {
    return {
      allowed: false,
      reason: "Submission exceeds maximum allowed length of 4,000 characters."
    };
  }

  // If helpers are not allowed for this level, reject `macro`
  if (!allowHelpers && /\bmacro\b/.test(code)) {
    return {
      allowed: false,
      reason: "Macros and helpers are locked for this level. Solve it using the base tactics!"
    };
  }

  // Check forbidden keywords
  for (const item of FORBIDDEN_PATTERNS) {
    if (item.pattern.test(code)) {
      return {
        allowed: false,
        reason: item.description
      };
    }
  }

  return { allowed: true };
}

export function detectOutputCheat(leanOutput: string): boolean {
  const lower = leanOutput.toLowerCase();
  if (lower.includes("uses 'sorry'") || lower.includes("declaration uses 'sorry'")) {
    return true;
  }
  return false;
}
