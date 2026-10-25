import React from "react";
import { BoardSpec } from "../types.js";

interface BoardViewProps {
  board: BoardSpec;
  target?: BoardSpec;
  isTarget?: boolean;
  hoveredIdx?: number | null;
  onHoverIdx?: (idx: number | null) => void;
  showDiff?: boolean;
  showSymbols?: boolean;
  showCoords?: boolean;
}

// Consistent white geometric symbols for maximum accessibility
const TILE_META: Record<string, { symbol: string; label: string }> = {
  red:    { symbol: "●", label: "Red" },
  blue:   { symbol: "▲", label: "Blue" },
  green:  { symbol: "◆", label: "Green" },
  yellow: { symbol: "★", label: "Yellow" },
  purple: { symbol: "⬟", label: "Purple" },
  orange: { symbol: "⬢", label: "Orange" },
};

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  target,
  isTarget = false,
  hoveredIdx = null,
  onHoverIdx,
  showDiff = true,
  showSymbols = true,
  showCoords = true,
}) => {
  const w = board.width || 3;
  const is4x4 = w === 4;

  return (
    <div
      className={`board-grid ${is4x4 ? "grid-4" : "grid-3"} ${isTarget ? "board-target-grid" : ""}`}
      role="grid"
      aria-label={isTarget ? "Target reference board" : "Current board state"}
      onMouseLeave={() => onHoverIdx?.(null)}
    >
      {board.cells.map((color, idx) => {
        const meta = TILE_META[color.toLowerCase()] ?? { symbol: "■", label: color };
        const row = Math.floor(idx / w);
        const col = idx % w;
        const differs = !isTarget && target && target.cells[idx] !== color;
        const hovered = hoveredIdx === idx;

        // Highlight ONLY cells that differ with clear amber outline and indicator tag
        const diffClass = (showDiff && !isTarget && differs) ? "tile-differs" : "";

        return (
          <div key={idx} className="board-cell">
            <div
              className={`tile tile-${color.toLowerCase()} ${hovered ? "tile-hovered" : ""} ${diffClass}`}
              role="gridcell"
              aria-label={`(${row},${col}) ${meta.label}`}
              title={`(${row},${col}) ${meta.label}${!isTarget && target ? (differs ? ` — Differs from target (${target.cells[idx]})` : " — Matches target") : ""}`}
              onMouseEnter={() => onHoverIdx?.(idx)}
            >
              {showSymbols && <span className="tile-symbol">{meta.symbol}</span>}
              {showDiff && !isTarget && differs && (
                <span className="tile-diff-indicator" title={`Tile differs! Current: ${color}, Target: ${target?.cells[idx]}`}>
                  ≠
                </span>
              )}
            </div>
            {showCoords && (
              <span className="tile-coord-label">{row},{col}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const TileLegend: React.FC<{ colors: string[] }> = ({ colors }) => {
  const unique = [...new Set(colors.map(c => c.toLowerCase()))];
  const LEGEND_COLORS: Record<string, { cssVar: string; symbol: string }> = {
    red:    { cssVar: "var(--tile-red)",    symbol: "●" },
    blue:   { cssVar: "var(--tile-blue)",   symbol: "▲" },
    green:  { cssVar: "var(--tile-green)",  symbol: "◆" },
    yellow: { cssVar: "var(--tile-yellow)", symbol: "★" },
    purple: { cssVar: "var(--tile-purple)", symbol: "⬟" },
    orange: { cssVar: "var(--tile-orange)", symbol: "⬢" },
  };

  return (
    <div className="tile-legend">
      <span className="legend-label">Legend</span>
      <div className="legend-items">
        {unique.map(c => {
          const l = LEGEND_COLORS[c];
          if (!l) return null;
          return (
            <div key={c} className="legend-item" title={`${c} tile with geometric symbol ${l.symbol}`}>
              <div className="legend-swatch" style={{ background: l.cssVar }}>
                <span className="legend-swatch-sym">{l.symbol}</span>
              </div>
              <span className="legend-name">{c.charAt(0).toUpperCase() + c.slice(1)}</span>
            </div>
          );
        })}
        {/* Difference indicator legend */}
        <div className="legend-item legend-diff-item" title="Orange outline and ≠ tag mark positions that differ from target">
          <div className="legend-swatch legend-diff-swatch">
            <span className="legend-diff-sym">≠</span>
          </div>
          <span className="legend-name" style={{ color: "var(--warning)", fontWeight: 500 }}>Differs</span>
        </div>
      </div>
    </div>
  );
};
