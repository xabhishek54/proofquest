import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Award, Star, ArrowRight, RotateCcw } from "lucide-react";
import { LevelData, VerificationResult } from "../types.js";

interface WinModalProps {
  isOpen: boolean;
  level: LevelData;
  result: VerificationResult;
  usedHints: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onClose: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  isOpen,
  level,
  result,
  usedHints,
  onNextLevel,
  onReplay,
  onClose
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti bursts
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stars = !usedHints && result.isPar ? 3 : result.isPar || !usedHints ? 2 : 1;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content win-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{
          width: 64,
          height: 64,
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))",
          borderRadius: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #10b981"
        }}>
          <Award size={36} color="#10b981" />
        </div>

        <h2 className="win-title">Level {level.id} Cleared!</h2>
        
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Lean 4 certified your proof in <strong>{result.movesCount} moves</strong> (Par: {level.par}).
        </p>

        <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
          {[1, 2, 3].map(s => (
            <Star
              key={s}
              size={28}
              fill={s <= stars ? "#fbbf24" : "none"}
              color={s <= stars ? "#fbbf24" : "#475569"}
            />
          ))}
        </div>

        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          padding: "10px 18px",
          borderRadius: "var(--radius-md)",
          fontSize: "0.8rem",
          color: "var(--text-muted)"
        }}>
          {stars === 3 && "★★★ Flawless Proof! Met Par without any hints."}
          {stars === 2 && "★★☆ Great job! Proof verified by Lean."}
          {stars === 1 && "★☆☆ Solved! Try reaching Par without hints for 3 stars."}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12, width: "100%", justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={onReplay}>
            <RotateCcw size={16} /> Replay
          </button>
          <button className="btn btn-primary" onClick={onNextLevel}>
            Next Level <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
