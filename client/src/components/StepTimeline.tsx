import React, { useState, useEffect } from "react";
import { BoardSnapshot } from "../types.js";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from "lucide-react";
import { sound } from "../utils/audio.js";

interface StepTimelineProps {
  snapshots: BoardSnapshot[];
  activeStep: number;
  onStepChange: (step: number) => void;
}

export const StepTimeline: React.FC<StepTimelineProps> = ({
  snapshots,
  activeStep,
  onStepChange
}) => {
  const totalSteps = snapshots.length;
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play animation through intermediate boards
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        if (activeStep >= totalSteps) {
          setIsPlaying(false);
        } else {
          const next = activeStep + 1;
          sound.playStep();
          onStepChange(next);
        }
      }, 700);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, totalSteps, onStepChange]);

  const handleStep = (step: number) => {
    setIsPlaying(false);
    onStepChange(step);
    sound.playStep();
  };

  const currentSnapshot = activeStep > 0 ? snapshots[activeStep - 1] : null;

  return (
    <div className="timeline-card">
      <div className="timeline-header">
        <div className="timeline-label">
          <strong>Step {activeStep} of {totalSteps}</strong>{" "}
          <span style={{ opacity: 0.75 }}>
            {activeStep === 0
              ? "(Initial Board)"
              : `(Line ${currentSnapshot?.playerLine || activeStep})`}
          </span>
        </div>
        <div className="timeline-controls">
          <button
            className={`btn ${isPlaying ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "4px 8px" }}
            disabled={totalSteps === 0}
            onClick={() => {
              if (activeStep >= totalSteps) onStepChange(0);
              setIsPlaying(!isPlaying);
            }}
            title={isPlaying ? "Pause auto-playback" : "Play step-by-step playback"}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: "4px 8px" }}
            disabled={activeStep <= 0}
            onClick={() => handleStep(0)}
            title="Jump to Start"
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: "4px 8px" }}
            disabled={activeStep <= 0}
            onClick={() => handleStep(Math.max(0, activeStep - 1))}
            title="Step back (Left Arrow)"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: "4px 8px" }}
            disabled={activeStep >= totalSteps}
            onClick={() => handleStep(Math.min(totalSteps, activeStep + 1))}
            title="Step forward (Right Arrow)"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <input
        type="range"
        className="timeline-slider"
        min={0}
        max={totalSteps}
        value={activeStep}
        onChange={e => handleStep(parseInt(e.target.value, 10))}
      />

      <div className="timeline-steps">
        <button
          className={`step-chip ${activeStep === 0 ? "active" : ""}`}
          onClick={() => handleStep(0)}
        >
          0: Start
        </button>
        {snapshots.map(s => (
          <button
            key={s.stepIndex}
            className={`step-chip ${activeStep === s.stepIndex ? "active" : ""}`}
            onClick={() => handleStep(s.stepIndex)}
          >
            {s.stepIndex}: Line {s.playerLine}
          </button>
        ))}
      </div>
    </div>
  );
};
