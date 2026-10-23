import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { LevelData, BoardSpec, LEVELS } from "./levels.js";
import { sanitizePlayerCode, detectOutputCheat } from "./sanitizer.js";
import { assembleLeanFile } from "./template.js";
import { translateLeanMessage, TranslatedDiagnostic } from "./translator.js";

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

const RESULT_CACHE = new Map<string, VerificationResult>();

function boardsEqual(a: BoardSpec, b: BoardSpec): boolean {
  if (a.width !== b.width || a.height !== b.height || a.cells.length !== b.cells.length) {
    return false;
  }
  for (let i = 0; i < a.cells.length; i++) {
    if (a.cells[i] !== b.cells[i]) return false;
  }
  return true;
}

export async function verifyProof(
  level: LevelData,
  playerCode: string,
  leanProjectDir: string,
  elanBinDir: string = path.join(process.env.HOME || "", ".elan/bin")
): Promise<VerificationResult> {
  const startTime = Date.now();

  // 1. Check in-memory result cache
  const cacheKey = crypto.createHash("sha256").update(`${level.id}:${playerCode}`).digest("hex");
  if (RESULT_CACHE.has(cacheKey)) {
    const cached = RESULT_CACHE.get(cacheKey)!;
    return { ...cached, cached: true, latencyMs: Date.now() - startTime };
  }

  // 2. Sanitize player code
  const sanitizeRes = sanitizePlayerCode(playerCode, level.hasHelpers);
  if (!sanitizeRes.allowed) {
    return {
      success: false,
      status: "cheat_detected",
      summary: sanitizeRes.reason || "Submission rejected by security rules.",
      diagnostics: [{
        line: 1,
        col: 1,
        severity: "error",
        message: sanitizeRes.reason || "Forbidden construct used.",
        raw: sanitizeRes.reason || "",
        category: "syntax_error"
      }],
      boardSnapshots: [],
      matchesTarget: false,
      movesCount: 0,
      isPar: false,
      latencyMs: Date.now() - startTime,
      rawOutput: `[Security Filter] ${sanitizeRes.reason}`
    };
  }

  // 3. Assemble Lean file with line mapping
  const assembled = assembleLeanFile(level, playerCode);

  // 4. Create temporary working directory inside lean project
  const tmpDir = path.join(leanProjectDir, ".tmp");
  await fs.mkdir(tmpDir, { recursive: true });
  const uniqueId = crypto.randomUUID();
  const tmpFilePath = path.join(tmpDir, `PQ_Check_${uniqueId}.lean`);
  await fs.writeFile(tmpFilePath, assembled.leanCode, "utf8");

  const lakeBinary = path.join(elanBinDir, "lake");

  try {
    const execPromise = new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
      execFile(
        lakeBinary,
        ["env", "lean", "--json", tmpFilePath],
        {
          cwd: leanProjectDir,
          timeout: 4500,
          maxBuffer: 10 * 1024 * 1024
        },
        (error, stdout, stderr) => {
          resolve({
            stdout: stdout || "",
            stderr: stderr || "",
            exitCode: error ? (error.code ? Number(error.code) : 1) : 0
          });
        }
      );
    });

    const execResult = await execPromise;
    const combinedOutput = execResult.stdout + "\n" + execResult.stderr;

    // Check for cheat warnings in output
    if (detectOutputCheat(combinedOutput)) {
      return {
        success: false,
        status: "cheat_detected",
        summary: "Lean detected an illegal escape ('sorry' or similar construct).",
        diagnostics: [{
          line: 1,
          col: 1,
          severity: "error",
          message: "Cheat detected: proof relies on sorry.",
          raw: combinedOutput,
          category: "syntax_error"
        }],
        boardSnapshots: [],
        matchesTarget: false,
        movesCount: 0,
        isPar: false,
        latencyMs: Date.now() - startTime,
        rawOutput: combinedOutput
      };
    }

    // 5. Parse JSON output from Lean
    const outputLines = combinedOutput.split("\n").filter(l => l.trim().startsWith("{"));
    const diagnostics: LineDiagnostic[] = [];
    const boardSnapshots: BoardSnapshot[] = [];
    let stepIndex = 0;

    for (const jsonLine of outputLines) {
      try {
        const item = JSON.parse(jsonLine);
        const dataStr: string = item.data || "";
        const leanLine: number = item.pos?.line ?? 1;
        const leanCol: number = item.pos?.column ?? 1;
        const playerLine = assembled.mapLeanLineToPlayerLine(leanLine);

        if (dataStr.startsWith("PQ_STATE ")) {
          const jsonPayload = dataStr.substring("PQ_STATE ".length).trim();
          const parsedBoard = JSON.parse(jsonPayload) as BoardSpec;
          stepIndex++;
          boardSnapshots.push({
            playerLine: playerLine ?? stepIndex,
            stepIndex,
            board: parsedBoard
          });
        } else {
          // Regular Lean compiler diagnostic
          const severity = (item.severity === "error" || item.severity === "warning" || item.severity === "information")
            ? item.severity
            : "information";

          if (playerLine !== null) {
            const playerCol = assembled.mapLeanColToPlayerCol(leanLine, leanCol);
            const translated = translateLeanMessage(dataStr);
            diagnostics.push({
              line: playerLine,
              col: playerCol,
              severity,
              message: translated.friendly,
              raw: dataStr,
              category: translated.category
            });
          }
        }
      } catch {
        // Non-JSON line or parser issue, ignore
      }
    }

    const finalBoard = boardSnapshots.length > 0
      ? boardSnapshots[boardSnapshots.length - 1].board
      : level.start;

    const matchesTarget = boardsEqual(finalBoard, level.target);
    const hasErrors = diagnostics.some(d => d.severity === "error");

    let status: VerificationResult["status"] = "unfinished";
    let summary = "";
    const movesCount = boardSnapshots.length;
    const isPar = movesCount > 0 && movesCount <= level.par;

    if (!hasErrors && matchesTarget && combinedOutput.toLowerCase().includes("finish") || (!hasErrors && matchesTarget && execResult.exitCode === 0)) {
      status = "solved";
      summary = isPar
        ? `Level solved in ${movesCount} moves! Met par target (Par: ${level.par}) ★★★`
        : `Level solved! Lean verified the proof in ${movesCount} moves. (Par: ${level.par})`;
    } else if (hasErrors) {
      const firstErr = diagnostics.find(d => d.severity === "error");
      if (firstErr?.category === "illegal_move") {
        status = "illegal_move";
        summary = `Illegal move on line ${firstErr.line}: ${firstErr.message}`;
      } else if (firstErr?.category === "syntax_error") {
        status = "syntax_error";
        summary = `Syntax issue on line ${firstErr.line}: ${firstErr.message}`;
      } else if (firstErr?.category === "unfinished") {
        status = "unfinished";
        summary = firstErr.message;
      } else {
        status = "error";
        summary = firstErr ? `Error on line ${firstErr.line}: ${firstErr.message}` : "Compilation failed.";
      }
    } else {
      status = "unfinished";
      summary = "Proof is legal so far, but target has not been reached yet.";
    }

    const latencyMs = Date.now() - startTime;
    const result: VerificationResult = {
      success: status === "solved",
      status,
      summary,
      diagnostics,
      boardSnapshots,
      finalBoard,
      matchesTarget,
      movesCount,
      isPar,
      latencyMs,
      rawOutput: combinedOutput
    };

    RESULT_CACHE.set(cacheKey, result);
    return result;

  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const isTimeout = err?.killed || err?.signal === "SIGTERM" || (err?.message && err.message.includes("timed out"));
    return {
      success: false,
      status: isTimeout ? "timeout" : "error",
      summary: isTimeout
        ? "Lean execution timed out after 4.5 seconds. Check for recursive loops."
        : `System error during verification: ${err?.message || "Unknown error"}`,
      diagnostics: [{
        line: 1,
        col: 1,
        severity: "error",
        message: isTimeout ? "Execution timed out" : "Process execution failed",
        raw: err?.message || "",
        category: "general_error"
      }],
      boardSnapshots: [],
      matchesTarget: false,
      movesCount: 0,
      isPar: false,
      latencyMs,
      rawOutput: err?.stack || String(err)
    };
  } finally {
    // Cleanup temporary file
    try {
      await fs.unlink(tmpFilePath);
    } catch {
      // Ignore cleanup error
    }
  }
}
