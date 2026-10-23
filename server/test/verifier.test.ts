import { describe, it, expect } from "vitest";
import path from "path";
import { fileURLToPath } from "url";
import { LEVELS } from "../src/levels.js";
import { verifyProof } from "../src/verifier.js";
import { sanitizePlayerCode } from "../src/sanitizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEAN_DIR = path.resolve(__dirname, "../../lean");
const ELAN_BIN_DIR = path.join(process.env.HOME || "", ".elan/bin");

describe("Sanitizer & Cheat Resistance", () => {
  it("rejects sorry escape", () => {
    const res = sanitizePlayerCode("sorry");
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("sorry");
  });

  it("rejects axiom declaration", () => {
    const res = sanitizePlayerCode("axiom cheat : True");
    expect(res.allowed).toBe(false);
  });

  it("rejects native_decide", () => {
    const res = sanitizePlayerCode("exact native_decide");
    expect(res.allowed).toBe(false);
  });

  it("rejects #eval commands", () => {
    const res = sanitizePlayerCode("#eval 1 + 1");
    expect(res.allowed).toBe(false);
  });

  it("rejects imports", () => {
    const res = sanitizePlayerCode("import Init");
    expect(res.allowed).toBe(false);
  });

  it("rejects macro in levels without helpers unlocked", () => {
    const res = sanitizePlayerCode("macro \"foo\" : tactic => `(tactic| rfl)", false);
    expect(res.allowed).toBe(false);
  });

  it("allows macro in levels with helpers unlocked", () => {
    const res = sanitizePlayerCode("macro \"foo\" : tactic => `(tactic| swap 0 1)", true);
    expect(res.allowed).toBe(true);
  });
});

describe("Illegal Moves & Error Handling", () => {
  it("detects out-of-bounds tile on swap", async () => {
    const level1 = LEVELS[0];
    const result = await verifyProof(level1, "swap 0 99\nfinish", LEAN_DIR, ELAN_BIN_DIR);
    expect(result.success).toBe(false);
    expect(result.status).toBe("illegal_move");
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].line).toBe(1);
    expect(result.diagnostics[0].message).toContain("out of bounds");
  });

  it("detects premature finish when boards do not match", async () => {
    const level1 = LEVELS[0];
    const result = await verifyProof(level1, "finish", LEAN_DIR, ELAN_BIN_DIR);
    expect(result.success).toBe(false);
    expect(result.status).toBe("unfinished");
  });
});

describe("Reference Solutions for Every Level (1 to 10)", () => {
  for (const level of LEVELS) {
    it(`Level ${level.id} (${level.title}): reference solution compiles, matches target, and satisfies par`, async () => {
      const result = await verifyProof(level, level.referenceSolution, LEAN_DIR, ELAN_BIN_DIR);
      expect(result.success, `Level ${level.id} failed: ${result.summary}\nRaw output:\n${result.rawOutput}`).toBe(true);
      expect(result.status).toBe("solved");
      expect(result.matchesTarget).toBe(true);
      expect(result.movesCount).toBeGreaterThan(0);
      expect(result.movesCount).toBeLessThanOrEqual(level.par);
    }, 20000); // 20s timeout for Lean compilation
  }
});
