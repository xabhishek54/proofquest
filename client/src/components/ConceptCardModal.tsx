import React from "react";
import { ConceptCard } from "../types.js";

interface ConceptCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: ConceptCard;
  levelTitle: string;
}

export const ConceptCardModal: React.FC<ConceptCardModalProps> = ({ isOpen, onClose, card, levelTitle }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <span className="modal-title">{levelTitle} — {card.title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="concept-body">
          <p className="concept-desc">{card.description}</p>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
              Tactic Pattern
            </div>
            <pre className="concept-code">{card.example}</pre>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={onClose}>Start Proving</button>
          </div>
        </div>
      </div>
    </div>
  );
};
