export interface BoardSpec {
  width: number;
  height: number;
  cells: string[];
}

export interface ConceptCard {
  title: string;
  description: string;
  example: string;
}

export interface LevelData {
  id: number;
  title: string;
  tagline: string;
  concept: string;
  conceptCard: ConceptCard;
  allowedMoves: string[];
  par: number;
  start: BoardSpec;
  target: BoardSpec;
  initialCode: string;
  hints: [string, string, string];
  hasHelpers?: boolean;
}

export interface LineDiagnostic {
  line: number;
  col: number;
  endLine?: number;
  endCol?: number;
  severity: "error" | "warning" | "information";
  message: string;
  raw: string;
  category: "illegal_move" | "unfinished" | "syntax_error" | "type_error" | "general_error";
}

export interface BoardSnapshot {
  playerLine: number;
  stepIndex: number;
  board: BoardSpec;
}

export interface VerificationResult {
  success: boolean;
  status: "solved" | "illegal_move" | "syntax_error" | "unfinished" | "cheat_detected" | "timeout" | "error";
  summary: string;
  diagnostics: LineDiagnostic[];
  boardSnapshots: BoardSnapshot[];
  finalBoard?: BoardSpec;
  matchesTarget: boolean;
  movesCount: number;
  isPar: boolean;
  latencyMs: number;
  rawOutput: string;
  cached?: boolean;
}
