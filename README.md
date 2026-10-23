# ProofQuest — Every Move Must Be Proven

> **Syntax Error 2026** · Functional Programming Track · Challenge: *Proof Puzzle*
> A visual puzzle game where **every move is a machine-checked Lean 4 proof step**. Lean decides whether a move is legal and whether the puzzle is solved. The browser only displays what Lean verified.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT (React + TS + Vite)               │
│  - Dual Board Display: Current Board + Target Board                     │
│    (Color-blind accessible: high-contrast colors, symbols & numbers)    │
│  - CodeMirror 6 Editor: Per-line proof status gutters & error squiggles │
│  - Step Timeline Scrubber: Inspect intermediate board after each step   │
│  - 3-Tier Progressive Hints + Concept Introduction Cards                │
│  - Raw Lean 4 Diagnostics Modal Inspector                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP POST /api/verify
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER (Node.js + Express)              │
│  - Security Sanitizer & AST Filter: Blocks sorry, axiom, native_decide, │
│    imports, #eval, etc.                                                │
│  - Sandbox Executor: Timeout (4.5s), Memory Cap (512MB), isolated user │
│  - File Assembler: Immutable Prelude + Level Goal + Player Tactic Body │
│  - Output Parser: Extracts tagged board snapshots (`PQ_STATE`) & diags │
│  - Friendly Translator: Maps raw Lean errors into beginner-friendly msg│
│  - In-Memory SHA-256 Verification Cache (instant replay)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Spawns Lean process
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        LEAN 4 ENGINE (v4.16.0 Core Library)            │
│  - ProofQuest/Core.lean: Color, Board, Move, apply?, Reaches relation  │
│  - ProofQuest/Tactics.lean: paint, swap, rotate_row, finish tactics    │
│  - ProofQuest/Report.lean: Emits `PQ_STATE {"width":..,"cells":..}`    │
│  - Levels 1 to 10: Formally proved reachability theorems               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## The Proof Model

- **State Representation**: The grid is represented by an immutable Lean inductive structure `Board` containing a list of `Color`s (`red`, `blue`, `green`, `yellow`, `purple`, `orange`).
- **Moves**: Moves are constructors of inductive type `Move`: `paint (idx : Nat) (c : Color)`, `swap (i j : Nat)`, `rotateRow (r : Nat)`.
- **Preconditions & Legality**: Pure function `Board.apply? : Move → Option Board` returns `none` if preconditions fail (e.g. out-of-bounds tile index or non-existent row), or `some nextBoard` if legal.
- **Reachability Relation**:
  ```lean
  inductive Reaches : Board → Board → Prop
    | done (b : Board) : Reaches b b
    | step (m : Move) {a b c : Board} :
        a.apply? m = some b → Reaches b c → Reaches a c
  ```
- **Tactic Steps**: Each line of player code (e.g. `swap 0 1`, `paint 8 green`, `rotate_row 0`) elaborates as a tactic that verifies preconditions, logs the board snapshot (`PQ_STATE {...}`), and refines the goal via `Reaches.step move (by rfl) ?_`.
- **Completion**: `finish` succeeds only when `currentBoard == targetBoard`, closing the proof with `Reaches.done`.

---

## Quickstart: Running ProofQuest

### Option 1: One-Command Docker Setup (Recommended for Judges)
```bash
docker compose up --build
```
Open **`http://localhost:3001`** in your browser.

### Option 2: Local Native Setup

**Prerequisites:**
- Node.js >= 20
- Lean 4 toolchain via `elan` (`curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain leanprover/lean4:v4.16.0`)

**Steps:**
```bash
# 1. Build the Lean 4 library
cd lean && ~/.elan/bin/lake build && cd ..

# 2. Build the client and server
npm run build

# 3. Start the server (serves both API and frontend UI)
npm start
```
Visit **`http://localhost:3001`**.

---

## Running the Automated Test Suite

Every level's reference solution, cheat resistance filter, illegal move diagnostics, and par conditions are verified end-to-end against real Lean 4:

```bash
npm test
```

Expected output:
```
 ✓ test/verifier.test.ts (19 tests)
   ✓ Sanitizer & Cheat Resistance > rejects sorry escape
   ✓ Sanitizer & Cheat Resistance > rejects axiom declaration
   ✓ Sanitizer & Cheat Resistance > rejects native_decide
   ✓ Sanitizer & Cheat Resistance > rejects #eval commands
   ✓ Sanitizer & Cheat Resistance > rejects imports
   ✓ Sanitizer & Cheat Resistance > rejects macro in levels without helpers unlocked
   ✓ Sanitizer & Cheat Resistance > allows macro in levels with helpers unlocked
   ✓ Illegal Moves & Error Handling > detects out-of-bounds tile on swap
   ✓ Illegal Moves & Error Handling > detects premature finish when boards do not match
   ✓ Reference Solutions for Every Level (1 to 10) > Level 1 (First Brush)
   ✓ Reference Solutions for Every Level (1 to 10) > Level 2 (Trade Places)
   ✓ ...
   ✓ Reference Solutions for Every Level (1 to 10) > Level 10 (Grand Pattern)
 Test Files  1 passed (1)
 Tests       19 passed (19)
```

---

## Level Map & Learning Ramp

| Level | Title | Core Concept | Moves Available | Par |
|---|---|---|---|---|
| **01** | First Brush | Tactic steps & goal completion | `paint`, `finish` | 2 |
| **02** | Trade Places | State transformations with preconditions | `swap`, `finish` | 2 |
| **03** | Swap & Paint | Sequencing and order of operations | `swap`, `paint`, `finish` | 3 |
| **04** | Round and Round | Bulk transformations | `rotate_row`, `swap`, `paint`, `finish` | 2 |
| **05** | Out of Bounds | Reading Lean diagnostics & fixing illegal moves | all | 2 |
| **06** | Many Roads | Proof optimization & Par budget | all | 3 |
| **07** | Name It | First reusable helper macro (Abstraction) | `macro`, all | 3 |
| **08** | Reuse | Multi-invocation helper across the board | `macro`, all | 4 |
| **09** | Build on Build | Composition: Helpers calling helpers | `macro`, all | 4 |
| **10** | Grand Pattern | 4×4 Tapestry finale (16 tiles) | `macro`, all | 4 |

---

## 2-to-3 Minute Live Demo Script

1. **0:00 — The Problem & Premise**: Open `http://localhost:3001`. Point out the dual boards (Current vs Target) and the CodeMirror proof editor. Emphasize: *"This is not a JavaScript game pretending to check code. Lean 4 is the referee."*
2. **0:25 — Level 1 / First Step**: Type `paint 0 green` followed by `finish`. Click **Run Proof** (or Ctrl+Enter). Show the green success banner, latency metric (~1.1s), and star rating.
3. **0:50 — Stepping through Time**: Open Level 3 (*Swap & Paint*). Use the **Step Timeline Scrubber** slider to scrub backward and forward through intermediate board states.
4. **1:20 — The Referee in Action (Deliberate Illegal Move)**: Open Level 5 (*Out of Bounds*). Run the pre-filled proof containing `swap 0 9`. Show the exact red line highlight: *"Illegal move: tile 9 is out of bounds (board has 9 tiles: 0 to 8)"*. Explain how Lean halted goal progression and succeeding lines are greyed out. Change `9` to `2` and run again to clear the level.
5. **1:55 — Complete Transparency**: Click the **Raw Lean Output** button in the message panel to show judges the underlying Lean 4 JSON diagnostics.
6. **2:20 — Functional Abstraction & Composition**: Jump to Level 7 (*Name It*) or Level 9 (*Build on Build*). Demonstrate defining a Lean `macro` helper and reusing it, showing the FP payoff of abstraction and composition.

---

## Honesty About Limits & Verification Scope

- **What is formally verified**: Lean 4 proves that the target board is mechanically reachable from the start board via the game's inductive `Reaches` relation using strictly legal moves.
- **What is server-defined**: The game rules (`Board.apply?`) and level definitions (`pq_start`, `pq_target`) are defined by our library in `Core.lean`. Lean guarantees our rules are followed faithfully; it does not prove game balance or human solvability beyond our automated reference test suite.
- **Security Sandboxing**: Untrusted code is sanitized against forbidden keywords (`sorry`, `axiom`, `native_decide`, `unsafe`, etc.), executed under strict 4.5s timeouts and memory limits, and runs in a container under an unprivileged user.
