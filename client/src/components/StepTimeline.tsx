import React, { useState, useEffect } from "react";
import { BoardSnapshot } from "../types.js";
import { sound } from "../utils/audio.js";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

interface StepTimelineProps {
  snapshots: BoardSnapshot[];
  activeStep: number;
  onStepChange: (step: number) => void;
  code?: string;
}

export const StepTimeline: React.FC<StepTimelineProps> = ({
  snapshots,
  activeStep,
  onStepChange,
  code = "",
}) => {
  const total = snapshots.length;
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let t: any = null;
    if (isPlaying) {
      t = setInterval(() => {
        if (activeStep >= total) {
          setIsPlaying(false);
        } else {
          sound.playStep?.();
          onStepChange(activeStep + 1);
        }
      }, 650);
    }
    return () => { if (t) clearInterval(t); };
  }, [isPlaying, activeStep, total, onStepChange]);

  const go = (step: number) => {
    setIsPlaying(false);
    onStepChange(Math.max(0, Math.min(total, step)));
    sound.playStep?.();
  };

  const currentSnapshot = activeStep > 0 ? snapshots[activeStep - 1] : null;
  const codeLines = code.split("\n");
  const currentLineCode = currentSnapshot && currentSnapshot.playerLine <= codeLines.length
    ? codeLines[currentSnapshot.playerLine - 1]?.trim()
    : "";

  return (
    <div className="history-section">
      <div className="history-header-row">
        <span className="history-title">Verified Move History</span>
        <div className="history-step-info">
          {activeStep === 0 ? (
            <span className="history-code-tag">Initial Board</span>
          ) : (
            <span className="history-code-tag">
              Step {activeStep}: <code>{currentLineCode || `Line ${currentSnapshot?.playerLine}`}</code>
            </span>
          )}
        </div>
      </div>

      {/* Slider + scrubber controls */}
      <div className="history-track-wrap">
        <button
          className="history-nav-btn"
          disabled={activeStep <= 0}
          onClick={() => go(activeStep - 1)}
          title="Previous move (‹)"
          aria-label="Previous step"
        >
          <ChevronLeft size={14} />
        </button>

        {total > 1 && (
          <button
            className={`history-nav-btn ${isPlaying ? "playing" : ""}`}
            onClick={() => setIsPlaying(p => !p)}
            title={isPlaying ? "Pause replay" : "Play step replay"}
            aria-label="Toggle replay"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
        )}

        <input
          type="range"
          className="history-slider"
          min={0}
          max={total}
          value={activeStep}
          onChange={e => go(parseInt(e.target.value, 10))}
          disabled={total === 0}
        />

        <button
          className="history-nav-btn"
          disabled={activeStep >= total}
          onClick={() => go(activeStep + 1)}
          title="Next move (›)"
          aria-label="Next step"
        >
          <ChevronRight size={14} />
        </button>

        <span className="history-counter">
          {activeStep} / {total}
        </span>
      </div>

      {/* Step numbers pill row */}
      {total > 0 && (
        <div className="history-pills-row">
          <button
            className={`history-step-pill ${activeStep === 0 ? "active" : ""}`}
            onClick={() => go(0)}
            title="Start: Initial board"
          >
            0
          </button>
          {snapshots.map(s => (
            <button
              key={s.stepIndex}
              className={`history-step-pill ${activeStep === s.stepIndex ? "active" : ""}`}
              onClick={() => go(s.stepIndex)}
              title={`Step ${s.stepIndex} (Line ${s.playerLine})`}
            >
              {s.stepIndex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
