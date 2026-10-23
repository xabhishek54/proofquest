import React, { useState } from "react";
import { X, Copy, Check, Terminal } from "lucide-react";

interface RawOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawOutput: string;
}

export const RawOutputModal: React.FC<RawOutputModalProps> = ({
  isOpen,
  onClose,
  rawOutput
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="panel-title">
            <Terminal size={18} color="#38bdf8" />
            Raw Lean 4 Compiler Diagnostics
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-secondary" onClick={handleCopy} style={{ padding: "6px 12px" }}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: "6px 12px" }}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="modal-body">
          {rawOutput || "(No raw output returned from Lean process)"}
        </div>
      </div>
    </div>
  );
};
