import React from "react";

interface RawOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawOutput: string;
}

export const RawOutputModal: React.FC<RawOutputModalProps> = ({ isOpen, onClose, rawOutput }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <span className="modal-title">Raw Lean 4 Output</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{rawOutput || "(no output)"}</div>
      </div>
    </div>
  );
};
