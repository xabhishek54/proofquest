import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface HintsDrawerProps {
  hints: [string, string, string];
  onUseHint: (tier: number) => void;
}

export const HintsDrawer: React.FC<HintsDrawerProps> = ({ hints, onUseHint }) => {
  const [open, setOpen] = useState<boolean[]>([false, false, false]);
  const labels = ["Hint 1", "Hint 2", "Solution"];

  const toggle = (i: number) => {
    setOpen(prev => {
      const n = [...prev];
      n[i] = !n[i];
      return n;
    });
    if (!open[i]) onUseHint(i);
  };

  return (
    <div className="hints-list">
      {hints.map((text, i) => (
        <div key={i} className="hint-row">
          <div className="hint-header-row" onClick={() => toggle(i)}>
            <span className="hint-tier-lbl">{labels[i]}</span>
            {open[i] ? <ChevronUp size={13} color="var(--text-3)" /> : <ChevronDown size={13} color="var(--text-3)" />}
          </div>
          {open[i] && <div className="hint-content">{text}</div>}
        </div>
      ))}
    </div>
  );
};
