export interface TranslatedDiagnostic {
  friendly: string;
  category: "illegal_move" | "unfinished" | "syntax_error" | "type_error" | "general_error";
  raw: string;
}

export function translateLeanMessage(raw: string): TranslatedDiagnostic {
  const trimmed = raw.trim();

  // 1. Out of bounds tiles / illegal move
  if (trimmed.includes("Illegal move: tile")) {
    return {
      friendly: trimmed,
      category: "illegal_move",
      raw
    };
  }

  if (trimmed.includes("Illegal move: row")) {
    return {
      friendly: trimmed,
      category: "illegal_move",
      raw
    };
  }

  // 2. Finish tactic failure
  if (trimmed.includes("Cannot finish: current board does not match target")) {
    return {
      friendly: "Cannot finish yet: The board does not match the target image. Make additional moves to reach the target before finishing.",
      category: "unfinished",
      raw
    };
  }

  // 3. Unsolved goals
  if (trimmed.includes("unsolved goals")) {
    return {
      friendly: "Proof incomplete: There are remaining proof steps. When your board matches the target, add 'finish' to complete the proof.",
      category: "unfinished",
      raw
    };
  }

  // 4. Unknown color
  if (trimmed.includes("Unknown color")) {
    return {
      friendly: trimmed,
      category: "syntax_error",
      raw
    };
  }

  // 5. Expected tactic / syntax errors
  if (trimmed.includes("expected tactic") || trimmed.includes("unexpected token")) {
    return {
      friendly: "Syntax error: Lean was expecting a tactic move (e.g. swap, paint, rotate_row, finish).",
      category: "syntax_error",
      raw
    };
  }

  // 6. Unknown identifier
  if (trimmed.includes("unknown identifier")) {
    const match = trimmed.match(/unknown identifier '([^']+)'/);
    const id = match ? match[1] : "this identifier";
    return {
      friendly: `Unknown move '${id}'. Available moves for this level are listed in the move palette below.`,
      category: "syntax_error",
      raw
    };
  }

  // Default fallback
  return {
    friendly: trimmed.length > 200 ? trimmed.substring(0, 197) + "..." : trimmed,
    category: "general_error",
    raw
  };
}
