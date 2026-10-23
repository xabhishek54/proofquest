import { LevelData } from "./levels.js";

export interface AssembledFile {
  leanCode: string;
  mapLeanLineToPlayerLine: (leanLine: number) => number | null;
  mapLeanColToPlayerCol: (leanLine: number, leanCol: number) => number;
}

function colorToLean(colorName: string): string {
  switch (colorName.toLowerCase()) {
    case "red": return "Color.red";
    case "blue": return "Color.blue";
    case "green": return "Color.green";
    case "yellow": return "Color.yellow";
    case "purple": return "Color.purple";
    case "orange": return "Color.orange";
    default: return "Color.red";
  }
}

export function assembleLeanFile(level: LevelData, playerCode: string): AssembledFile {
  const startCells = level.start.cells.map(c => colorToLean(c)).join(", ");
  const targetCells = level.target.cells.map(c => colorToLean(c)).join(", ");

  const preludeLines = [
    "import ProofQuest",
    "open ProofQuest",
    "",
    `def pq_start : Board := { width := ${level.start.width}, height := ${level.start.height}, cells := [${startCells}] }`,
    `def pq_target : Board := { width := ${level.target.width}, height := ${level.target.height}, cells := [${targetCells}] }`,
    ""
  ];

  const assembledLines: string[] = [...preludeLines];
  const lineMap = new Map<number, number>();
  const isIndentedMap = new Map<number, boolean>();

  const rawLines = playerCode.split("\n");

  // Separate macro declarations from tactic lines
  const macroLines: Array<{ text: string; playerLine: number }> = [];
  const tacticLines: Array<{ text: string; playerLine: number }> = [];

  let inMacroDef = false;

  for (let i = 0; i < rawLines.length; i++) {
    const pLine = i + 1;
    const lineText = rawLines[i];
    const trimmed = lineText.trim();

    if (trimmed.startsWith("macro ") || trimmed.startsWith("local macro ")) {
      inMacroDef = true;
      macroLines.push({ text: lineText, playerLine: pLine });
    } else if (inMacroDef) {
      if (trimmed === "" || trimmed.startsWith("--")) {
        macroLines.push({ text: lineText, playerLine: pLine });
      } else if (lineText.startsWith("  ") || lineText.startsWith("\t")) {
        // Continuation of macro
        macroLines.push({ text: lineText, playerLine: pLine });
      } else {
        // Out of macro definition
        inMacroDef = false;
        tacticLines.push({ text: lineText, playerLine: pLine });
      }
    } else {
      tacticLines.push({ text: lineText, playerLine: pLine });
    }
  }

  // 1. Append macro lines (if any)
  for (const m of macroLines) {
    assembledLines.push(m.text);
    const assembledLineNum = assembledLines.length;
    lineMap.set(assembledLineNum, m.playerLine);
    isIndentedMap.set(assembledLineNum, false);
  }

  if (macroLines.length > 0) {
    assembledLines.push("");
  }

  // 2. Append theorem header
  assembledLines.push(`theorem pq_level_${level.id} : Reaches pq_start pq_target := by`);

  // 3. Append tactic lines indented
  for (const t of tacticLines) {
    if (t.text.trim() === "") {
      assembledLines.push("");
    } else {
      assembledLines.push(`  ${t.text}`);
    }
    const assembledLineNum = assembledLines.length;
    lineMap.set(assembledLineNum, t.playerLine);
    isIndentedMap.set(assembledLineNum, true);
  }

  const leanCode = assembledLines.join("\n") + "\n";

  return {
    leanCode,
    mapLeanLineToPlayerLine: (leanLine: number) => {
      return lineMap.get(leanLine) ?? null;
    },
    mapLeanColToPlayerCol: (leanLine: number, leanCol: number) => {
      const indented = isIndentedMap.get(leanLine) ?? false;
      if (indented) {
        return Math.max(1, leanCol - 2);
      }
      return leanCol;
    }
  };
}
