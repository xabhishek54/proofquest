import React from "react";
import { X } from "lucide-react";

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box manual-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">How to Play</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
              Transform the board to match the target using Lean 4 tactics.
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="manual-body" style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 20px", maxHeight: "75vh", overflowY: "auto" }}>
          
          {/* Objective */}
          <div className="manual-card">
            <div className="manual-card-title">1. Objective</div>
            <p>
              Match the <strong>Current Board</strong> to the <strong>Target Board</strong>. Write your moves in the editor and click <strong>Run proof</strong> (or press <kbd>Ctrl+Enter</kbd>). Lean verifies each move mathematically.
            </p>
          </div>

          {/* Coordinates grid */}
          <div className="manual-card">
            <div className="manual-card-title">2. Tile Coordinates (0–8)</div>
            <p style={{ marginBottom: 8 }}>
              Tiles are indexed from 0 to 8, left to right, top to bottom:
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 44px)",
              gap: 6,
              margin: "6px auto",
              justifyContent: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 600,
            }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} style={{
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--card-inner)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--ink)",
                }}>
                  {i}
                </div>
              ))}
            </div>
          </div>

          {/* Tactics Table */}
          <div className="manual-card">
            <div className="manual-card-title">3. Tactics Reference</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 6 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <code style={{ minWidth: 105, color: "var(--primary)", fontWeight: 600 }}>swap i j</code>
                <span style={{ fontSize: 12, color: "var(--text-2)" }}>Swaps tile <code>i</code> and tile <code>j</code> (e.g. <code>swap 0 1</code>)</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <code style={{ minWidth: 105, color: "var(--primary)", fontWeight: 600 }}>paint i color</code>
                <span style={{ fontSize: 12, color: "var(--text-2)" }}>Repaints tile <code>i</code> (<code>red</code>, <code>blue</code>, <code>green</code>, <code>yellow</code>, <code>purple</code>, <code>orange</code>)</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <code style={{ minWidth: 105, color: "var(--primary)", fontWeight: 600 }}>rotate_row r</code>
                <span style={{ fontSize: 12, color: "var(--text-2)" }}>Shifts row <code>r</code> right with wrap-around (e.g. <code>rotate_row 0</code>)</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <code style={{ minWidth: 105, color: "var(--primary)", fontWeight: 600 }}>finish</code>
                <span style={{ fontSize: 12, color: "var(--text-2)" }}>Closes the proof once all tiles match the target</span>
              </div>
            </div>
          </div>

          {/* Working Example */}
          <div className="manual-card">
            <div className="manual-card-title">4. Example Solution</div>
            <div style={{
              background: "var(--ed-bg)",
              color: "var(--ed-foreground)",
              padding: "8px 12px",
              borderRadius: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              lineHeight: 1.6,
              border: "1px solid var(--ed-border)",
              marginTop: 6,
            }}>
              <div><span style={{ color: "#60A5FA" }}>swap</span> <span style={{ color: "#FBBF24" }}>0</span> <span style={{ color: "#FBBF24" }}>1</span></div>
              <div><span style={{ color: "#60A5FA" }}>paint</span> <span style={{ color: "#FBBF24" }}>8</span> <span style={{ color: "#34D399" }}>green</span></div>
              <div><span style={{ color: "#34D399" }}>finish</span></div>
            </div>
          </div>

          {/* Shortcuts */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "var(--text-2)", paddingTop: 2 }}>
            <span><kbd>Ctrl+Enter</kbd> Run proof</span>
            <span><kbd>Esc</kbd> Close modal</span>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: "1px solid var(--border)", padding: "10px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: "6px 16px" }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
