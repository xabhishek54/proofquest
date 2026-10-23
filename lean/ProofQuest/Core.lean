namespace ProofQuest

inductive Color
  | red
  | blue
  | green
  | yellow
  | purple
  | orange
  deriving Repr, DecidableEq, Inhabited

def Color.toString : Color → String
  | .red    => "red"
  | .blue   => "blue"
  | .green  => "green"
  | .yellow => "yellow"
  | .purple => "purple"
  | .orange => "orange"

instance : ToString Color where
  toString := Color.toString

structure Board where
  width  : Nat := 3
  height : Nat := 3
  cells  : List Color
  deriving Repr, DecidableEq, Inhabited

def Board.size (b : Board) : Nat :=
  b.cells.length

def Board.get? (b : Board) (idx : Nat) : Option Color :=
  b.cells.get? idx

def Board.set (b : Board) (idx : Nat) (c : Color) : Board :=
  { b with cells := b.cells.set idx c }

def Board.toJsonString (b : Board) : String :=
  let cellStrs := b.cells.map (fun c => "\"" ++ toString c ++ "\"")
  let joined := String.intercalate ", " cellStrs
  s!"\{\"width\": {b.width}, \"height\": {b.height}, \"cells\": [{joined}]}"

inductive Move
  | paint (idx : Nat) (c : Color)
  | swap (i j : Nat)
  | rotateRow (row : Nat)
  deriving Repr, DecidableEq

/-- Cyclic shift of a list to the right by 1 element. -/
def rotateRightOne {α : Type} : List α → List α
  | [] => []
  | [x] => [x]
  | xs =>
    match xs.reverse with
    | [] => []
    | last :: revInit => last :: revInit.reverse

/-- Rotate row `r` (0-indexed) cyclically right by 1 tile. -/
def Board.rotateRowImpl (b : Board) (r : Nat) : Option Board :=
  if r < b.height && b.cells.length == b.width * b.height && b.width > 0 then
    let startIdx := r * b.width
    let rowCells := (b.cells.drop startIdx).take b.width
    let rotatedRow := rotateRightOne rowCells
    let beforeRow := b.cells.take startIdx
    let afterRow := b.cells.drop (startIdx + b.width)
    some { b with cells := beforeRow ++ rotatedRow ++ afterRow }
  else
    none

/-- Compute the resulting board if a move is legal, or return `none` if illegal. -/
def Board.apply? (b : Board) : Move → Option Board
  | .paint idx c =>
    if idx < b.cells.length then
      some (b.set idx c)
    else
      none
  | .swap i j =>
    if i < b.cells.length && j < b.cells.length then
      match b.get? i, b.get? j with
      | some ci, some cj =>
        let b' := (b.set i cj).set j ci
        some b'
      | _, _ => none
    else
      none
  | .rotateRow r =>
    b.rotateRowImpl r

/-- "Target board `c` can be reached from initial board `a` through a sequence of legal moves." -/
inductive Reaches : Board → Board → Prop
  | done (b : Board) : Reaches b b
  | step (m : Move) {a b c : Board} :
      a.apply? m = some b → Reaches b c → Reaches a c

end ProofQuest
