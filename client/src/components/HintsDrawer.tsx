import React, { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, Eye } from "lucide-react";

interface HintsDrawerProps {
  hints: [string, string, string];
  onUseHint: (tierIndex: number) => void;
}

export const HintsDrawer: React.FC<HintsDrawerProps> = ({ hints, onUseHint }) => {
  const [unlockedTiers, setUnlockedTiers] = useState<boolean[]>([false, false, false]);

  const toggleTier = (index: number) => {
    setUnlockedTiers(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
    onUseHint(index);
  };

  const tierLabels = [
    { name: "Tier 1: Gentle Nudge", desc: "A subtle pointer to notice discrepancies." },
    { name: "Tier 2: Tactic Clue", desc: "Which tactics to choose and order." },
    { name: "Tier 3: Full Solution", desc: "Exact moves to prove the level." }
  ];

  return (
    <div className="hints-container">
      {hints.map((hintText, idx) => {
        const isUnlocked = unlockedTiers[idx];
        const label = tierLabels[idx];

        return (
          <div key={idx} className="hint-tier">
            <div className="hint-header" onClick={() => toggleTier(idx)}>
              <span className="hint-title">
                <Lightbulb size={14} color={isUnlocked ? "#fbbf24" : "#94a3b8"} />
                {label.name}
              </span>
              {isUnlocked ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            {isUnlocked ? (
              <div className="hint-text">{hintText}</div>
            ) : (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <Eye size={12} /> Click to reveal {label.desc}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
