import React from "react";
import { BoardSpec } from "../types.js";
import { Check } from "lucide-react";

interface BoardViewProps {
  board: BoardSpec;
  target?: BoardSpec;
  isTarget?: boolean;
}

const COLOR_METADATA: Record<string, { symbol: string; letter: string; name: string }> = {
  red: { symbol: "◆", letter: "R", name: "Red" },
  blue: { symbol: "▲", letter: "B", name: "Blue" },
  green: { symbol: "●", letter: "G", name: "Green" },
  yellow: { symbol: "★", letter: "Y", name: "Yellow" },
  purple: { symbol: "⬟", letter: "P", name: "Purple" },
  orange: { symbol: "⬢", letter: "O", name: "Orange" }
};

export const BoardView: React.FC<BoardViewProps> = ({ board, target, isTarget = false }) => {
  const is4x4 = board.width === 4;

  return (
    <div
      className={`board-grid-box ${is4x4 ? "grid-4" : "grid-3"}`}
      role="grid"
      aria-label={isTarget ? "Target Board" : "Current Board"}
    >
      {board.cells.map((cellColor, idx) => {
        const meta = COLOR_METADATA[cellColor.toLowerCase()] || {
          symbol: "■",
          letter: cellColor[0]?.toUpperCase() || "?",
          name: cellColor
        };

        const matchesTarget = !isTarget && target && target.cells[idx] === cellColor;

        return (
          <div
            key={idx}
            className={`tile tile-${cellColor.toLowerCase()}`}
            title={`Tile ${idx}: ${meta.name} (${meta.letter})`}
            role="gridcell"
            aria-label={`Tile ${idx}, ${meta.name}`}
          >
            <span className="tile-index">{idx}</span>
            <span className="tile-symbol">{meta.symbol}</span>
            <span className="tile-letter">{meta.letter}</span>
            {matchesTarget && (
              <span className="match-indicator" title="Matches Target!">
                <Check size={10} strokeWidth={3} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
