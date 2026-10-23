import ProofQuest.Core
import Lean

open Lean Meta Elab Tactic
open ProofQuest

namespace ProofQuest

/-- Parse a color term from an identifier or syntax -/
def parseColorName (str : String) : Option Color :=
  match str with
  | "red"    => some Color.red
  | "blue"   => some Color.blue
  | "green"  => some Color.green
  | "yellow" => some Color.yellow
  | "purple" => some Color.purple
  | "orange" => some Color.orange
  | _        => none

def colorToSyntax (c : Color) : Ident :=
  match c with
  | .red    => mkIdent `ProofQuest.Color.red
  | .blue   => mkIdent `ProofQuest.Color.blue
  | .green  => mkIdent `ProofQuest.Color.green
  | .yellow => mkIdent `ProofQuest.Color.yellow
  | .purple => mkIdent `ProofQuest.Color.purple
  | .orange => mkIdent `ProofQuest.Color.orange

/-- Extract the current and target boards from `Reaches a c` -/
def extractReachesBoards (goalType : Expr) : MetaM (Expr × Expr) := do
  match goalType.getAppFnArgs with
  | (``ProofQuest.Reaches, #[a, c]) => pure (a, c)
  | _ => throwError "Current proof goal is not of the form (Reaches start target). Current goal: {goalType}"

/-- Helper to safely evaluate a closed Expr representing a Board -/
unsafe def evalBoardUnsafe (e : Expr) : MetaM Board := do
  evalExpr Board (mkConst ``Board) e

@[implemented_by evalBoardUnsafe]
opaque evalBoard (e : Expr) : MetaM Board

/-- Helper to safely evaluate a closed Expr representing a Move -/
unsafe def evalMoveUnsafe (e : Expr) : MetaM Move := do
  evalExpr Move (mkConst ``Move) e

@[implemented_by evalMoveUnsafe]
opaque evalMove (e : Expr) : MetaM Move

/-- Core tactic stepper that verifies legality and logs board state -/
def stepAndReport (m : Move) (stx : Syntax) : TacticM Unit := withMainContext do
  let goal ← getMainGoal
  let goalType ← goal.getType
  let (curBoardExpr, _) ← extractReachesBoards goalType
  let curBoard ← try
    evalBoard curBoardExpr
  catch ex =>
    throwErrorAt stx "Failed to evaluate current board state: {ex.toMessageData}"
  
  match curBoard.apply? m with
  | none =>
    let errMsg := match m with
    | .paint idx _ =>
      s!"Illegal move: tile {idx} is out of bounds (board has {curBoard.cells.length} tiles: 0 to {curBoard.cells.length - 1})."
    | .swap i j =>
      if i >= curBoard.cells.length && j >= curBoard.cells.length then
        s!"Illegal move: tiles {i} and {j} are out of bounds (board has {curBoard.cells.length} tiles: 0 to {curBoard.cells.length - 1})."
      else if i >= curBoard.cells.length then
        s!"Illegal move: tile {i} is out of bounds (board has {curBoard.cells.length} tiles: 0 to {curBoard.cells.length - 1})."
      else
        s!"Illegal move: tile {j} is out of bounds (board has {curBoard.cells.length} tiles: 0 to {curBoard.cells.length - 1})."
    | .rotateRow r =>
      s!"Illegal move: row {r} does not exist (board has {curBoard.height} rows: 0 to {curBoard.height - 1})."
    throwErrorAt stx errMsg
  | some nextBoard =>
    -- Log the machine-readable board snapshot attached to this tactic's syntax position
    logInfoAt stx s!"PQ_STATE {nextBoard.toJsonString}"
    -- Refine the proof goal by taking a Reaches.step
    let moveSyntax ← match m with
    | .paint idx c =>
      let numStx := Syntax.mkNumLit (toString idx)
      let colStx := colorToSyntax c
      `(ProofQuest.Move.paint $numStx $colStx)
    | .swap i j =>
      let iStx := Syntax.mkNumLit (toString i)
      let jStx := Syntax.mkNumLit (toString j)
      `(ProofQuest.Move.swap $iStx $jStx)
    | .rotateRow r =>
      let rStx := Syntax.mkNumLit (toString r)
      `(ProofQuest.Move.rotateRow $rStx)
    
    evalTactic (← `(tactic| refine ProofQuest.Reaches.step $moveSyntax (by rfl) ?_))

/-- Syntax for `paint <index> <color>` -/
syntax (name := paintTac) "paint " num ident : tactic

@[tactic paintTac]
def evalPaint : Tactic := fun stx => do
  let idx := stx[1].toNat
  let colIdent := stx[2].getId.toString
  match parseColorName colIdent with
  | some c =>
    stepAndReport (Move.paint idx c) stx
  | none =>
    throwErrorAt stx[2] s!"Unknown color '{colIdent}'. Valid colors are: red, blue, green, yellow, purple, orange."

/-- Syntax for `swap <i> <j>` -/
syntax (name := swapTac) "swap " num num : tactic

@[tactic swapTac]
def evalSwap : Tactic := fun stx => do
  let i := stx[1].toNat
  let j := stx[2].toNat
  stepAndReport (Move.swap i j) stx

/-- Syntax for `rotate_row <r>` -/
syntax (name := rotateRowTac) "rotate_row " num : tactic

@[tactic rotateRowTac]
def evalRotateRow : Tactic := fun stx => do
  let r := stx[1].toNat
  stepAndReport (Move.rotateRow r) stx

/-- Syntax for `finish` -/
syntax (name := finishTac) "finish" : tactic

@[tactic finishTac]
def evalFinish : Tactic := fun stx => withMainContext do
  let goal ← getMainGoal
  let goalType ← goal.getType
  let (curBoardExpr, targetBoardExpr) ← extractReachesBoards goalType
  let curBoard ← try evalBoard curBoardExpr catch _ => throwErrorAt stx "Could not evaluate current board"
  let targetBoard ← try evalBoard targetBoardExpr catch _ => throwErrorAt stx "Could not evaluate target board"
  
  if curBoard == targetBoard then
    -- Current board matches target! Finish with Reaches.done
    evalTactic (← `(tactic| apply ProofQuest.Reaches.done))
  else
    throwErrorAt stx "Cannot finish: current board does not match target board yet. Check the tiles and continue proving!"

end ProofQuest
