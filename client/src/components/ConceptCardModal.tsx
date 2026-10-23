import React from "react";
import { BookOpen, X, Play } from "lucide-react";
import { ConceptCard } from "../types.js";

interface ConceptCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: ConceptCard;
  levelTitle: string;
}

export const ConceptCardModal: React.FC<ConceptCardModalProps> = ({
  isOpen,
  onClose,
  card,
  levelTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div className="panel-title">
            <BookOpen size={18} color="#93c5fd" />
            {levelTitle}: {card.title}
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: "6px 12px" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {card.description}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Tactic Pattern Example:
            </span>
            <pre className="concept-code">{card.example}</pre>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn btn-primary" onClick={onClose}>
              <Play size={14} /> Start Proving
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
