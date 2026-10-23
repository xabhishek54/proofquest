import React from "react";
import { BoardSpec } from "../types.js";
import { Check, AlertCircle } from "lucide-react";

interface BoardViewProps {
  board: BoardSpec;
  target?: BoardSpec;
  isTarget?: boolean;
  hoveredIdx?: number | null;
  onHoverIdx?: (idx: number | null) => void;
  showDiff?: boolean;
  showSymbols?: boolean;
  showNumbers?: boolean;
}

const COLOR_METADATA: Record<string, { symbol: string; letter: string; name: string }> = {
  red: { symbol: "◆", letter: "R", name: "Red" },
  blue: { symbol: "▲", letter: "B", name: "Blue" },
  green: { symbol: "●", letter: "G", name: "Green" },
  yellow: { symbol: "★", letter: "Y", name: "Yellow" },
  purple: { symbol: "⬟", letter: "P", name: "Purple" },
  orange: { symbol: "⬢", letter: "O", name: "Orange" }
};

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  target,
  isTarget = false,
  hoveredIdx = null,
  onHoverIdx,
  showDiff = true,
  showSymbols = true,
  showNumbers = true
}) => {
  const is4x4 = board.width === 4;

  return (
    <div
      className={`board-grid-box ${is4x4 ? "grid-4" : "grid-3"}`}
      role="grid"
      aria-label={isTarget ? "Target Board" : "Current Board"}
      onMouseLeave={() => onHoverIdx && onHoverIdx(null)}
    >
      {board.cells.map((cellColor, idx) => {
        const meta = COLOR_METADATA[cellColor.toLowerCase()] || {
          symbol: "■",
          letter: cellColor[0]?.toUpperCase() || "?",
          name: cellColor
        };

        const matchesTarget = !isTarget && target && target.cells[idx] === cellColor;
        const differsFromTarget = !isTarget && target && target.cells[idx] !== cellColor;
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={idx}
            className={`tile tile-${cellColor.toLowerCase()} ${isHovered ? "tile-hovered" : ""} ${showDiff && differsFromTarget ? "tile-diff-mismatch" : ""}`}
            title={`Tile ${idx}: ${meta.name} (${meta.letter})${!isTarget && target ? (matchesTarget ? " - Matches target" : ` - Target is ${target.cells[idx]}`) : ""}`}
            role="gridcell"
            aria-label={`Tile ${idx}, ${meta.name}`}
            onMouseEnter={() => onHoverIdx && onHoverIdx(idx)}
          >
            {showNumbers && <span className="tile-index">{idx}</span>}
            {showSymbols && <span className="tile-symbol">{meta.symbol}</span>}
            <span className="tile-letter">{meta.letter}</span>

            {showDiff && matchesTarget && (
              <span className="match-indicator" title="Matches Target!">
                <Check size={10} strokeWidth={3} />
              </span>
            )}

            {showDiff && differsFromTarget && (
              <span className="mismatch-indicator" title={`Needs to be ${target?.cells[idx]}`}>
                <AlertCircle size={9} strokeWidth={3} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
