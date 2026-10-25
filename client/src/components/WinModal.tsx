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
  isOpen, level, result, usedHints, onNextLevel, onReplay, onClose
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => {
        confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1 } });
      }, 250);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  const stars = !usedHints && result.isPar ? 3 : result.isPar || !usedHints ? 2 : 1;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title">Level {level.id} Complete</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="win-body">
          <div className="win-icon-wrap">
            <Award size={28} color="#16a34a" />
          </div>
          <div>
            <div className="win-title">{level.title}</div>
            <div className="win-sub" style={{ marginTop: 4 }}>
              Lean 4 certified your proof
            </div>
          </div>
          <div className="win-stats">
            <div className="win-stat">
              <div className="win-stat-val">{result.movesCount}</div>
              <div className="win-stat-lbl">Moves</div>
            </div>
            <div className="win-stat">
              <div className="win-stat-val">{level.par}</div>
              <div className="win-stat-lbl">Par</div>
            </div>
            <div className="win-stat">
              <div className="win-stat-val">{result.latencyMs}ms</div>
              <div className="win-stat-lbl">Lean Time</div>
            </div>
          </div>
          <div className="win-stars">
            {[1, 2, 3].map(s => (
              <Star key={s} size={28}
                fill={s <= stars ? "#eab308" : "none"}
                color={s <= stars ? "#eab308" : "#d1d5db"}
              />
            ))}
          </div>
          <div className="win-actions">
            <button className="btn btn-ghost" onClick={onReplay}>
              <RotateCcw size={14} /> Retry
            </button>
            <button className="btn btn-primary" onClick={onNextLevel}>
              Next Level <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
