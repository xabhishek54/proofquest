import React from "react";
import { VerificationResult } from "../types.js";
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, Terminal, ShieldAlert } from "lucide-react";

interface MessagePanelProps {
  result: VerificationResult | null;
  onOpenRawOutput: () => void;
  isVerifying: boolean;
}

export const MessagePanel: React.FC<MessagePanelProps> = ({
  result,
  onOpenRawOutput,
  isVerifying
}) => {
  if (isVerifying) {
    return (
      <div className="message-panel">
        <div className="status-banner unfinished">
          <div className="banner-icon">
            <HelpCircle size={18} />
          </div>
          <div className="banner-content">
            <div className="banner-title">Checking proof with Lean 4...</div>
            <div className="banner-text">Evaluating tactic chain and verifying board transformations in sandbox.</div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="message-panel">
        <div className="status-banner unfinished">
          <div className="banner-icon">
            <HelpCircle size={18} />
          </div>
          <div className="banner-content">
            <div className="banner-title">Ready to Prove</div>
            <div className="banner-text">Write your Lean move tactics in the editor and click "Run Proof" (or press Ctrl+Enter).</div>
          </div>
        </div>
      </div>
    );
  }

  const renderStatusDetails = () => {
    switch (result.status) {
      case "solved":
        return {
          icon: <CheckCircle2 size={20} />,
          className: "solved",
          title: "Proof Verified by Lean!"
        };
      case "illegal_move":
        return {
          icon: <AlertCircle size={20} />,
          className: "illegal_move",
          title: "Illegal Move Rejected"
        };
      case "syntax_error":
        return {
          icon: <AlertTriangle size={20} />,
          className: "syntax_error",
          title: "Syntax Issue"
        };
      case "cheat_detected":
        return {
          icon: <ShieldAlert size={20} />,
          className: "illegal_move",
          title: "Security Rule Violation"
        };
      default:
        return {
          icon: <HelpCircle size={20} />,
          className: "unfinished",
          title: "Proof Unfinished"
        };
    }
  };

  const status = renderStatusDetails();

  return (
    <div className="message-panel">
      <div className={`status-banner ${status.className}`}>
        <div className="banner-icon">{status.icon}</div>
        <div className="banner-content">
          <div className="banner-title">{status.title}</div>
          <div className="banner-text">{result.summary}</div>
          <div className="banner-latency">
            Lean 4 execution time: {result.latencyMs}ms {result.cached ? "(cached)" : ""}
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={onOpenRawOutput}
          title="Inspect the raw messages directly returned by the Lean compiler"
          style={{ padding: "6px 12px", fontSize: "0.75rem", flexShrink: 0 }}
        >
          <Terminal size={14} />
          Raw Lean Output
        </button>
      </div>
    </div>
  );
};
