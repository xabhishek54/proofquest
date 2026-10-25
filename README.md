# ProofQuest — Every Move Must Be Proven

> A visual puzzle game where **every move is a machine-checked Lean 4 proof step**.
> Lean decides whether a move is legal and whether the puzzle is solved — the browser just shows what Lean verified.

Built for **Syntax Error 2026**, Functional Programming Track.

---

## What it is

ProofQuest is a grid-based puzzle game where you solve levels by writing real Lean 4 tactic proofs. The catch: there's no fake validation layer. Each line you type is handed to Lean 4, which either accepts it as a valid move toward the goal or rejects it with a precise error. You can't guess your way through — the type system is the referee.

The 10 levels introduce concepts progressively: from single-step repainting to sequencing moves, reading diagnostics, recovering from illegal operations, and eventually writing reusable Lean macros that you call across a 4×4 board.

---

## How it works

The game is built around an inductive `Reaches` relation in Lean 4:

```lean
inductive Reaches : Board → Board → Prop
  | done (b : Board) : Reaches b b
  | step (m : Move) {a b c : Board} :
      a.apply? m = some b → Reaches b c → Reaches a c
```

Each tactic you write (`paint`, `swap`, `rotate_row`) is a step in this proof. When you call `finish`, Lean checks that the current board state actually matches the target — it won't close the goal otherwise. The puzzle is solved when and only when Lean says so.

The backend wraps Lean in a sandboxed subprocess (4.5s timeout, 512MB memory cap, forbidden keyword filter), parses board snapshots from tagged output, and translates raw Lean errors into something readable for beginners.

---

## Architecture

```
Browser (React + TypeScript + Vite)
  │  Dual board view, CodeMirror 6 editor, step timeline, hints drawer
  │
  │  HTTP POST /api/verify
  ▼
Express Server (Node.js)
  │  Sanitizer → File assembler → Lean subprocess → Output parser → Cache
  │
  ▼
Lean 4 Engine (v4.16.0)
  │  ProofQuest/Core.lean    — Board, Color, Move, apply?, Reaches
  │  ProofQuest/Tactics.lean — paint, swap, rotate_row, finish
  │  ProofQuest/Report.lean  — PQ_STATE snapshot emitter
  └  Levels 1–10             — Formally stated reachability goals
```

---

## Running it locally

**Prerequisites:**
- Node.js >= 20
- Lean 4 via elan:
  ```bash
  curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain leanprover/lean4:v4.16.0
  ```

```bash
# 1. Build the Lean library
cd lean && lake build && cd ..

# 2. Build client + server
npm run build

# 3. Start (serves both API and UI on the same port)
npm start
```

Open `http://localhost:3001`.

---

## Tests

```bash
npm test
```

Runs 19 end-to-end tests against the real Lean 4 engine — sanitizer rules, illegal move detection, and a reference solution for every level.

---

## Level Map

| # | Title | What you learn | Par |
|---|-------|----------------|-----|
| 01 | First Brush | Writing your first tactic step | 1 |
| 02 | Trade Places | State transformations with preconditions | 1 |
| 03 | Swap & Paint | Sequencing and order of operations | 2 |
| 04 | Round and Round | Bulk row transformations | 2 |
| 05 | Out of Bounds | Reading Lean errors, fixing illegal moves | 2 |
| 06 | Many Roads | Proof optimization within a par budget | 3 |
| 07 | Name It | Defining a reusable Lean macro | 3 |
| 08 | Reuse | Calling a helper multiple times | 4 |
| 09 | Build on Build | Composing helpers that call other helpers | 4 |
| 10 | Grand Pattern | 4×4 board finale — 16 tiles | 4 |

---

## Security

Untrusted input is sanitized before reaching Lean. Blocked: `sorry`, `axiom`, `native_decide`, `unsafe`, `#eval`, `import`, and macro definitions in early levels. Execution runs in a subprocess with a hard timeout and memory cap.

---

## What's formally verified vs. what isn't

**Verified by Lean:** the target board is reachable from the start board via the game's inductive `Reaches` relation, using only moves that pass `Board.apply?`.

**Not verified by Lean:** game balance, human solvability, or that the levels are "fun". Those are on us.
