export interface BoardSpec {
  width: number;
  height: number;
  cells: string[];
}

export interface LevelData {
  id: number;
  title: string;
  tagline: string;
  concept: string;
  conceptCard: {
    title: string;
    description: string;
    example: string;
  };
  allowedMoves: string[];
  par: number;
  start: BoardSpec;
  target: BoardSpec;
  initialCode: string;
  referenceSolution: string;
  hints: [string, string, string];
  hasHelpers?: boolean;
}

export const LEVELS: LevelData[] = [
  {
    id: 1,
    title: "First Brush",
    tagline: "Your first proof step",
    concept: "A proof is a sequence of tactic steps. finish certifies that the goal matches the target.",
    conceptCard: {
      title: "Tactics as Proof Steps",
      description: "In Lean, each line inside a proof is a tactic that transforms the current state. The 'paint' tactic changes the color of a specific tile. When your board matches the target, 'finish' completes the proof.",
      example: "paint 0 green\nfinish"
    },
    allowedMoves: ["paint", "finish"],
    par: 2,
    start: {
      width: 3,
      height: 3,
      cells: [
        "red", "blue", "green",
        "yellow", "red", "blue",
        "green", "yellow", "red"
      ]
    },
    target: {
      width: 3,
      height: 3,
      cells: [
        "green", "blue", "green",
        "yellow", "red", "blue",
        "green", "yellow", "red"
      ]
    },
    initialCode: "-- Welcome to ProofQuest! Every line is a verified Lean move.\n-- Change tile 0 to green, then finish the proof.\n",
    referenceSolution: "paint 0 green\nfinish",
    hints: [
      "Compare the current board with the target. Notice tile 0 (top-left) is red instead of green.",
      "The tactic 'paint <tile> <color>' repaints a tile. Try: paint 0 green",
      "Type 'paint 0 green' on line 1, then 'finish' on line 2."
    ]
  },
  {
    id: 2,
    title: "Trade Places",
    tagline: "Exchanging elements",
    concept: "Different tactics address different transformations while preserving state validity.",
    conceptCard: {
      title: "The Swap Tactic",
      description: "The 'swap i j' tactic exchanges the positions of tile i and tile j. Lean verifies that both indices exist on the board and proves the new board reaches the target.",
      example: "swap 0 1\nfinish"
    },
    allowedMoves: ["swap", "finish"],
    par: 2,
    start: {
      width: 3,
      height: 3,
      cells: [
        "blue", "red", "green",
        "yellow", "red", "blue",
        "green", "yellow", "red"
      ]
    },
    target: {
      width: 3,
      height: 3,
      cells: [
        "red", "blue", "green",
        "yellow", "red", "blue",
        "green", "yellow", "red"
      ]
    },
    initialCode: "-- Tiles 0 and 1 are swapped. Use 'swap' to fix them.\n",
    referenceSolution: "swap 0 1\nfinish",
    hints: [
      "Look at the first two tiles: tile 0 is blue and tile 1 is red, but the target has them reversed.",
      "Use the 'swap' tactic: swap 0 1",
      "Add 'swap 0 1' and close with 'finish'."
    ]
  },
  {
    id: 3,
    title: "Swap & Paint",
    tagline: "Sequencing tactics",
    concept: "Tactics chain sequentially: each step transforms the state and forwards the remaining goal.",
    conceptCard: {
      title: "Order of Operations",
      description: "Tactics execute one after the other. Each line takes the board produced by the previous line and passes the updated board to the next step.",
      example: "swap 0 1\npaint 8 green\nfinish"
    },
    allowedMoves: ["swap", "paint", "finish"],
    par: 3,
    start: {
      width: 3,
      height: 3,
      cells: [
        "red", "blue", "green",
        "yellow", "red", "blue",
        "green", "yellow", "red"
      ]
    },
    target: {
      width: 3,
      height: 3,
      cells: [
        "blue", "red", "green",
        "yellow", "red", "blue",
        "green", "yellow", "green"
      ]
    },
    initialCode: "-- Two differences to fix: swap tiles 0 and 1, and repaint tile 8.\n",
    referenceSolution: "swap 0 1\npaint 8 green\nfinish",
    hints: [
      "There are two discrepancies: tiles 0 & 1 need swapping, and tile 8 (bottom-right) should be green.",
      "Run 'swap 0 1' first, then 'paint 8 green'.",
      "Write 'swap 0 1', then 'paint 8 green', then 'finish'."
    ]
  },
  {
    id: 4,
    title: "Round and Round",
    tagline: "Bulk transformations",
    concept: "Bulk operations transform entire collections at once, modeling higher-order operations.",
    conceptCard: {
      title: "Row Rotation",
      description: "The 'rotate_row r' tactic shifts all tiles in row r cyclically to the right by 1 position. The last tile wraps around to the beginning.",
      example: "rotate_row 0\nfinish"
    },
    allowedMoves: ["rotate_row", "swap", "paint", "finish"],
    par: 2,
    start: {
      width: 3,
      height: 3,
      cells: [
        "green", "red", "blue",
        "yellow", "red", "blue",
        "green", "yellow", "red"
      ]
    },
    target: {
      width: 3,
      height: 3,
      cells: [
        "blue", "green", "red",
        "yellow", "red", "blue",
        "green", "yellow", "red"
      ]
    },
    initialCode: "-- The top row (row 0) needs to shift cyclically to the right.\n",
    referenceSolution: "rotate_row 0\nfinish",
    hints: [
      "In row 0, green moved to position 1, red moved to 2, and blue wrapped to 0.",
      "The 'rotate_row <rowIndex>' tactic rotates a whole row at once.",
      "Type 'rotate_row 0' followed by 'finish'."
    ]
  },
  {
    id: 5,
    title: "Out of Bounds",
    tagline: "Reading Lean diagnostics",
    concept: "Formal verification rejects invalid inputs before execution; errors guide debugging.",
    conceptCard: {
      title: "Illegal Moves & Diagnostics",
      description: "When a move fails its preconditions (such as indexing non-existent tile 9 on a 3x3 board), Lean stops at that exact line and highlights it red. Fix the line to let the proof proceed.",
      example: "-- swap 0 9 is illegal (only tiles 0-8 exist!)\nswap 0 2\nfinish"
    },
    allowedMoves: ["swap", "paint", "rotate_row", "finish"],
    par: 2,
    start: {
      width: 3,
      height: 3,
      cells: [
        "red", "blue", "yellow",
        "yellow", "red", "blue",
        "green", "yellow", "red"
      ]
    },
    target: {
      width: 3,
      height: 3,
      cells: [
        "yellow", "blue", "red",
        "yellow", "red", "blue",
        "green", "yellow", "red"
      ]
    },
    initialCode: "-- Fix the illegal move below!\nswap 0 9\nfinish\n",
    referenceSolution: "swap 0 2\nfinish",
    hints: [
      "Look at the red line error: tile 9 does not exist on a 9-tile board (indices are 0 to 8).",
      "Look at the target: tile 0 (red) and tile 2 (yellow) need to be swapped.",
      "Replace 'swap 0 9' with 'swap 0 2'."
    ]
  },
  {
    id: 6,
    title: "Many Roads",
    tagline: "Proof optimization & Par",
    concept: "Proofs are not unique. Choosing more powerful abstractions yields shorter, more elegant proofs.",
    conceptCard: {
      title: "Proof Efficiency & Par",
      description: "Multiple sequences of moves can reach the target. You could solve this puzzle with 4 individual swaps, or with 2 row rotations. Par measures the optimal move count.",
      example: "rotate_row 0\nrotate_row 1\nfinish"
    },
    allowedMoves: ["swap", "rotate_row", "paint", "finish"],
    par: 3,
    start: {
      width: 3,
      height: 3,
      cells: [
        "red", "blue", "green",
        "blue", "green", "red",
        "yellow", "yellow", "yellow"
      ]
    },
    target: {
      width: 3,
      height: 3,
      cells: [
        "green", "red", "blue",
        "red", "blue", "green",
        "yellow", "yellow", "yellow"
      ]
    },
    initialCode: "-- Solve this puzzle within the Par budget (3 lines or fewer, including finish).\n",
    referenceSolution: "rotate_row 0\nrotate_row 1\nfinish",
    hints: [
      "Both row 0 and row 1 have their tiles shifted rightward by 1 step.",
      "Instead of multiple swaps, row rotations can do the job in 1 line per row.",
      "Write 'rotate_row 0', then 'rotate_row 1', then 'finish'."
    ]
  },
  {
    id: 7,
    title: "Name It",
    tagline: "Your first reusable helper",
    concept: "Abstraction: naming a sequence of operations lets you encapsulate complex behavior.",
    conceptCard: {
      title: "User-Defined Helpers (Macros)",
      description: "In Lean, you can name a compound tactic using macros. This bundles multiple moves into a single reusable command.",
      example: "macro \"cross_swap\" : tactic => `(tactic| (swap 0 8 ; swap 2 6))\ncross_swap\nfinish"
    },
    allowedMoves: ["macro", "swap", "paint", "finish"],
    par: 3,
    hasHelpers: true,
    start: {
      width: 3,
      height: 3,
      cells: [
        "red", "blue", "yellow",
        "blue", "purple", "blue",
        "orange", "blue", "green"
      ]
    },
    target: {
      width: 3,
      height: 3,
      cells: [
        "green", "blue", "orange",
        "blue", "purple", "blue",
        "yellow", "blue", "red"
      ]
    },
    initialCode: "-- Define a helper macro that swaps opposite corners!\nmacro \"cross_swap\" : tactic => `(tactic| (swap 0 8 ; swap 2 6))\n\ncross_swap\nfinish\n",
    referenceSolution: "macro \"cross_swap\" : tactic => `(tactic| (swap 0 8 ; swap 2 6))\ncross_swap\nfinish",
    hints: [
      "The 4 corners need opposite diagonal swaps: 0 with 8, and 2 with 6.",
      "The helper macro 'cross_swap' executes both swaps in a single command.",
      "Define the macro and then call 'cross_swap', followed by 'finish'."
    ]
  },
  {
    id: 8,
    title: "Reuse",
    tagline: "Calling helpers repeatedly",
    concept: "Reuse eliminates duplication: write once, invoke across multiple contexts.",
    conceptCard: {
      title: "Multi-Invocation Helpers",
      description: "Define a reusable macro once at the top of your proof, and invoke it multiple times to transform symmetric structures across the board.",
      example: "macro \"shift_pair\" : tactic => `(tactic| (swap 0 1 ; swap 1 2))\nshift_pair\nrotate_row 1\nfinish"
    },
    allowedMoves: ["macro", "swap", "rotate_row", "paint", "finish"],
    par: 4,
    hasHelpers: true,
    start: {
      width: 3,
      height: 3,
      cells: [
        "red", "green", "blue",
        "yellow", "yellow", "yellow",
        "orange", "purple", "red"
      ]
    },
    target: {
      width: 3,
      height: 3,
      cells: [
        "green", "blue", "red",
        "yellow", "yellow", "yellow",
        "purple", "red", "orange"
      ]
    },
    initialCode: "-- Rotate row 0 and row 2. Can you define a macro to rotate both or swap pairs?\n",
    referenceSolution: "rotate_row 0\nrotate_row 0\nrotate_row 2\nrotate_row 2\nfinish",
    hints: [
      "Notice rows 0 and 2 each need two cyclic shifts to reach their target.",
      "You can call 'rotate_row 0' twice and 'rotate_row 2' twice, or create a macro for a double rotation.",
      "Run: rotate_row 0, rotate_row 0, rotate_row 2, rotate_row 2, then finish."
    ]
  },
  {
    id: 9,
    title: "Build on Build",
    tagline: "Helper composition",
    concept: "Functional composition: building higher-level abstractions out of lower-level helpers.",
    conceptCard: {
      title: "Composing Helpers",
      description: "Just as functions call other functions, helper macros can invoke other macros, building a rich language of domain transformations.",
      example: "macro \"step_one\" : tactic => `(tactic| swap 0 1)\nmacro \"step_two\" : tactic => `(tactic| (step_one ; swap 3 4))\nstep_two\nfinish"
    },
    allowedMoves: ["macro", "swap", "rotate_row", "paint", "finish"],
    par: 4,
    hasHelpers: true,
    start: {
      width: 3,
      height: 3,
      cells: [
        "blue", "red", "green",
        "yellow", "purple", "orange",
        "red", "green", "blue"
      ]
    },
    target: {
      width: 3,
      height: 3,
      cells: [
        "red", "blue", "green",
        "purple", "yellow", "orange",
        "green", "red", "blue"
      ]
    },
    initialCode: "-- Compose helpers: macro 'flip_pair' swaps two tiles, and 'flip_both' calls it for multiple rows!\nmacro \"swap_first\" : tactic => `(tactic| (swap 0 1 ; swap 3 4))\nmacro \"swap_all\" : tactic => `(tactic| (swap_first ; swap 6 7))\n\nswap_all\nfinish\n",
    referenceSolution: "macro \"swap_first\" : tactic => `(tactic| (swap 0 1 ; swap 3 4))\nmacro \"swap_all\" : tactic => `(tactic| (swap_first ; swap 6 7))\nswap_all\nfinish",
    hints: [
      "Every single row has its first two tiles swapped (0 with 1, 3 with 4, 6 with 7).",
      "Notice how 'swap_all' composes 'swap_first' and adds the final row swap.",
      "Call 'swap_all' then 'finish'."
    ]
  },
  {
    id: 10,
    title: "Grand Pattern",
    tagline: "The 4x4 tapestry finale",
    concept: "Putting it all together: sequencing, bulk shifts, and precision edits on a larger grid.",
    conceptCard: {
      title: "The 4x4 Finale",
      description: "A 4x4 board contains 16 tiles (indices 0 to 15, rows 0 to 3). Combine row rotation, precise swaps, and custom helpers to solve the grand tapestry.",
      example: "rotate_row 0\nrotate_row 2\nswap 5 10\nfinish"
    },
    allowedMoves: ["macro", "swap", "rotate_row", "paint", "finish"],
    par: 4,
    hasHelpers: true,
    start: {
      width: 4,
      height: 4,
      cells: [
        "red", "blue", "green", "yellow",
        "orange", "purple", "red", "blue",
        "yellow", "green", "orange", "purple",
        "blue", "red", "yellow", "green"
      ]
    },
    target: {
      width: 4,
      height: 4,
      cells: [
        "yellow", "red", "blue", "green",
        "orange", "red", "purple", "blue",
        "purple", "yellow", "green", "orange",
        "blue", "red", "yellow", "green"
      ]
    },
    initialCode: "-- 4x4 Finale! Rotate row 0, swap tiles 5 and 6 in row 1, and rotate row 2.\n",
    referenceSolution: "rotate_row 0\nswap 5 6\nrotate_row 2\nfinish",
    hints: [
      "Check each row: Row 0 is rotated cyclically right by 1. Row 1 has tiles 5 and 6 swapped. Row 2 is rotated cyclically right.",
      "Use 'rotate_row 0', 'swap 5 6', and 'rotate_row 2'.",
      "Chain those three moves and finish."
    ]
  }
];
