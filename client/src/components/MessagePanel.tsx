import React from "react";
import { VerificationResult } from "../types.js";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Sparkles, Terminal } from "lucide-react";

interface MessagePanelProps {
  result: VerificationResult | null;
  onOpenRawOutput: () => void;
  isVerifying: boolean;
  diffCount?: number;
}

export const MessagePanel: React.FC<MessagePanelProps> = ({
  result,
  onOpenRawOutput,
  isVerifying,
  diffCount = 0,
}) => {
  // 1. Checking proof
  if (isVerifying) {
    return (
      <div className="proof-status-card status-checking">
        <div className="status-icon-wrap icon-checking">
          <Loader2 size={16} className="spin" />
        </div>
        <div className="status-content">
          <div className="status-headline">Checking proof…</div>
          <div className="status-subline">Validating moves and checking the final board in Lean 4…</div>
        </div>
        <div className="status-actions">
          <span className="status-tag tag-checking">Checking…</span>
        </div>
      </div>
    );
  }

  // 2. Idle state (not verified yet)
  if (!result) {
    return (
      <div className="proof-status-card status-idle">
        <div className="status-icon-wrap icon-idle">
          <Sparkles size={15} />
        </div>
        <div className="status-content">
          <div className="status-headline">Ready to verify</div>
          <div className="status-subline">
            Write your proof tactics and press <kbd>Ctrl+Enter</kbd> to run Lean 4.
          </div>
        </div>
        <div className="status-actions">
          <span className="status-tag tag-idle">Unverified</span>
        </div>
      </div>
    );
  }

  // Determine stage flags
  const hasSyntaxError = result.status === "syntax_error" || result.diagnostics.some(d => d.category === "syntax_error");
  const isIllegalMove = result.status === "illegal_move" || result.diagnostics.some(d => d.category === "illegal_move");
  const hasMoves = result.boardSnapshots.length > 0;
  const isSolved = result.success === true;
  const isTargetMatched = result.matchesTarget === true;

  // 3. Proof verified & Puzzle Solved (Only when Lean has actually accepted the proof!)
  if (isSolved) {
    return (
      <div className="proof-status-card status-verified">
        <div className="status-icon-wrap icon-verified">
          <CheckCircle2 size={16} />
        </div>
        <div className="status-content">
          <div className="status-headline">Proof verified · Solved</div>
          <div className="status-subline">
            Lean 4 verified the proof in {result.movesCount} {result.movesCount === 1 ? "move" : "moves"}. Final board matches target.
          </div>
        </div>
        <div className="status-actions">
          <span className="status-tag tag-verified">Proof verified</span>
          <button
            onClick={onOpenRawOutput}
            className="raw-output-link"
            title="Inspect Lean 4 compiler output"
          >
            <Terminal size={12} />
            <span>{result.latencyMs}ms</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Illegal move (referring to a tile outside the board or illegal rule)
  if (isIllegalMove) {
    const err = result.diagnostics.find(d => d.category === "illegal_move" || d.severity === "error");
    const msg = err ? `Line ${err.line}: ${err.message}` : (result.summary || "Move refers to an invalid tile index.");
    return (
      <div className="proof-status-card status-invalid">
        <div className="status-icon-wrap icon-invalid">
          <XCircle size={16} />
        </div>
        <div className="status-content">
          <div className="status-headline">Illegal move rejected</div>
          <div className="status-subline">{msg}</div>
        </div>
        <div className="status-actions">
          <span className="status-tag tag-invalid">Illegal move</span>
          <button
            onClick={onOpenRawOutput}
            className="raw-output-link"
            title="Inspect Lean 4 compiler output"
          >
            <Terminal size={12} />
            <span>Raw</span>
          </button>
        </div>
      </div>
    );
  }

  // 5. Syntax error / compilation failure
  if (hasSyntaxError) {
    const firstError = result.diagnostics.find(d => d.severity === "error");
    const errorMsg = firstError
      ? `Line ${firstError.line}: ${firstError.message}`
      : result.summary || "Syntax not accepted by Lean 4.";

    return (
      <div className="proof-status-card status-invalid">
        <div className="status-icon-wrap icon-invalid">
          <XCircle size={16} />
        </div>
        <div className="status-content">
          <div className="status-headline">Syntax rejected</div>
          <div className="status-subline">{errorMsg}</div>
        </div>
        <div className="status-actions">
          <span className="status-tag tag-invalid">Syntax rejected</span>
          <button
            onClick={onOpenRawOutput}
            className="raw-output-link"
            title="Inspect Lean 4 compiler output"
          >
            <Terminal size={12} />
            <span>Raw</span>
          </button>
        </div>
      </div>
    );
  }

  // 6. Target matched but proof not closed (needs finish)
  if (isTargetMatched && !isSolved) {
    return (
      <div className="proof-status-card status-incomplete">
        <div className="status-icon-wrap icon-incomplete">
          <AlertTriangle size={16} />
        </div>
        <div className="status-content">
          <div className="status-headline">Proof checked (Awaiting finish)</div>
          <div className="status-subline">
            Board matches target, but the proof goal is still open. Add <code>finish</code> to close.
          </div>
        </div>
        <div className="status-actions">
          <span className="status-tag tag-incomplete">Proof checked</span>
          <button
            onClick={onOpenRawOutput}
            className="raw-output-link"
            title="Inspect Lean 4 compiler output"
          >
            <Terminal size={12} />
            <span>Raw</span>
          </button>
        </div>
      </div>
    );
  }

  // 7. Moves valid, but board does not match target yet
  if (hasMoves) {
    return (
      <div className="proof-status-card status-incomplete">
        <div className="status-icon-wrap icon-incomplete">
          <AlertTriangle size={16} />
        </div>
        <div className="status-content">
          <div className="status-headline">Moves valid (Proof incomplete)</div>
          <div className="status-subline">
            {result.summary || `${result.movesCount} moves verified. ${diffCount} ${diffCount === 1 ? "tile differs" : "tiles differ"} from target.`}
          </div>
        </div>
        <div className="status-actions">
          <span className="status-tag tag-incomplete">Moves valid</span>
          <button
            onClick={onOpenRawOutput}
            className="raw-output-link"
            title="Inspect Lean 4 compiler output"
          >
            <Terminal size={12} />
            <span>Raw</span>
          </button>
        </div>
      </div>
    );
  }

  // 8. Syntax accepted, but no moves written yet
  return (
    <div className="proof-status-card status-idle">
      <div className="status-icon-wrap icon-idle">
        <Sparkles size={15} />
      </div>
      <div className="status-content">
        <div className="status-headline">Syntax accepted (No moves yet)</div>
        <div className="status-subline">
          Add tactics like <code>swap 0 1</code> or <code>paint 0 green</code>.
        </div>
      </div>
      <div className="status-actions">
        <span className="status-tag tag-idle">Syntax accepted</span>
        <button
          onClick={onOpenRawOutput}
          className="raw-output-link"
          title="Inspect Lean 4 compiler output"
        >
          <Terminal size={12} />
          <span>Raw</span>
        </button>
      </div>
    </div>
  );
};
