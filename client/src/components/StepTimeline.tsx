import React from "react";
import { BoardSnapshot } from "../types.js";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  return (
    <div className="timeline-card">
      <div className="timeline-header">
        <div className="timeline-label">
          Step {activeStep} of {totalSteps} {activeStep === 0 ? "(Start)" : `(After Move ${activeStep})`}
        </div>
        <div className="timeline-controls">
          <button
            className="btn btn-secondary"
            style={{ padding: "4px 8px" }}
            disabled={activeStep <= 0}
            onClick={() => onStepChange(Math.max(0, activeStep - 1))}
            title="Step back"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: "4px 8px" }}
            disabled={activeStep >= totalSteps}
            onClick={() => onStepChange(Math.min(totalSteps, activeStep + 1))}
            title="Step forward"
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
        onChange={e => onStepChange(parseInt(e.target.value, 10))}
      />

      <div className="timeline-steps">
        <button
          className={`step-chip ${activeStep === 0 ? "active" : ""}`}
          onClick={() => onStepChange(0)}
        >
          0: Start
        </button>
        {snapshots.map(s => (
          <button
            key={s.stepIndex}
            className={`step-chip ${activeStep === s.stepIndex ? "active" : ""}`}
            onClick={() => onStepChange(s.stepIndex)}
          >
            {s.stepIndex}: Line {s.playerLine}
          </button>
        ))}
      </div>
    </div>
  );
};
