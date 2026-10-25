import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Play, RotateCcw, BookOpen, Star, ChevronDown, ChevronUp,
  Volume2, VolumeX, Cpu, HelpCircle
} from "lucide-react";
import { BoardView, TileLegend } from "./components/BoardView.js";
import { CodeEditor } from "./components/CodeEditor.js";
import { MessagePanel } from "./components/MessagePanel.js";
import { StepTimeline } from "./components/StepTimeline.js";
import { HintsDrawer } from "./components/HintsDrawer.js";
import { RawOutputModal } from "./components/RawOutputModal.js";
import { ConceptCardModal } from "./components/ConceptCardModal.js";
import { WinModal } from "./components/WinModal.js";
import { ManualModal } from "./components/ManualModal.js";
import { LevelData, VerificationResult, BoardSpec } from "./types.js";
import { sound } from "./utils/audio.js";

export const App: React.FC = () => {
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [code, setCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [usedHints, setUsedHints] = useState<boolean>(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [showDiff, setShowDiff] = useState<boolean>(true);
  const [showSymbols, setShowSymbols] = useState<boolean>(true);
  const [showCoords, setShowCoords] = useState<boolean>(true);

  const [isRawModalOpen, setIsRawModalOpen] = useState<boolean>(false);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);
  const [hintsTrayOpen, setHintsTrayOpen] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [levelMenuOpen, setLevelMenuOpen] = useState<boolean>(false);
  const levelMenuRef = useRef<HTMLDivElement>(null);

  const [starsMap, setStarsMap] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem("pq_stars") || "{}"); }
    catch { return {}; }
  });

  // Close level dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (levelMenuRef.current && !levelMenuRef.current.contains(e.target as Node)) {
        setLevelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggleAudio = () => {
    sound.enabled = !audioEnabled;
    setAudioEnabled(a => !a);
  };

  // Load level list
  useEffect(() => {
    fetch("/api/levels")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.levels)) setLevels(d.levels); })
      .catch(console.error);
  }, []);

  // Load a level's details
  const loadLevel = useCallback((id: number) => {
    fetch(`/api/levels/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.level) {
          setCurrentLevelId(id);
          setCode(d.level.initialCode || "");
          setResult(null);
          setActiveStep(0);
          setUsedHints(false);
          setIsWinModalOpen(false);
          setHoveredIdx(null);
          setLevelMenuOpen(false);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => { loadLevel(currentLevelId); }, [currentLevelId, loadLevel]);

  const currentLevel = levels.find(l => l.id === currentLevelId) ?? levels[0];

  const currentMoveCount = useMemo(() => {
    return code.split("\n").map(l => l.trim()).filter(l => {
      if (!l || l.startsWith("--")) return false;
      if (l.startsWith("macro ") || l.startsWith("local macro ")) return false;
      if (l === "finish") return false;
      return true;
    }).length;
  }, [code]);

  const displayedBoard: BoardSpec = useMemo(() => {
    if (!currentLevel) return { width: 3, height: 3, cells: [] };
    if (!result?.boardSnapshots?.length || activeStep === 0) return currentLevel.start;
    const snap = result.boardSnapshots[activeStep - 1];
    return snap?.board ?? currentLevel.start;
  }, [currentLevel, result, activeStep]);

  const diffCount = useMemo(() => {
    if (!currentLevel || !displayedBoard) return 0;
    let count = 0;
    for (let i = 0; i < displayedBoard.cells.length; i++) {
      if (displayedBoard.cells[i] !== currentLevel.target.cells[i]) count++;
    }
    return count;
  }, [displayedBoard, currentLevel]);

  const suggestedMove = useMemo(() => {
    if (!currentLevel) return { hint: "Try painting or swapping tiles", code: "finish" };
    switch (currentLevel.id) {
      case 1: return { hint: "Paint top-left tile 0 green, then finish", code: "paint 0 green" };
      case 2: return { hint: "Swap tiles 0 and 1, then finish", code: "swap 0 1" };
      case 3: return { hint: "Swap tiles 0 and 1 first, then paint tile 8 green", code: "swap 0 1" };
      case 4: return { hint: "Rotate top row 0 to the right", code: "rotate_row 0" };
      case 5: return { hint: "Fix illegal index: swap tile 0 with tile 2", code: "swap 0 2" };
      case 6: return { hint: "Rotate row 0, then rotate row 1", code: "rotate_row 0" };
      case 7: return { hint: "Call helper macro cross_swap", code: "cross_swap" };
      case 8: return { hint: "Rotate row 0 twice and row 2 twice", code: "rotate_row 0" };
      case 9: return { hint: "Invoke composite macro swap_all", code: "swap_all" };
      case 10: return { hint: "Rotate row 0, then swap tiles 5 and 6", code: "rotate_row 0" };
      default: return { hint: "Write a tactic move, then finish", code: "finish" };
    }
  }, [currentLevel]);

  const handleVerify = useCallback(async () => {
    if (!currentLevel || isVerifying) return;
    setIsVerifying(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId: currentLevel.id, code }),
      });
      const data: VerificationResult = await res.json();
      setResult(data);
      setActiveStep(data.boardSnapshots?.length ?? 0);

      if (data.success) {
        sound.playSuccess();
        const stars = !usedHints && data.isPar ? 3 : data.isPar || !usedHints ? 2 : 1;
        setStarsMap(prev => {
          const next = { ...prev, [currentLevel.id]: Math.max(prev[currentLevel.id] || 0, stars) };
          try { localStorage.setItem("pq_stars", JSON.stringify(next)); } catch {}
          return next;
        });
        setIsWinModalOpen(true);
      } else {
        sound.playError();
      }
    } catch (err: any) {
      sound.playError();
      setResult({
        success: false, status: "error",
        summary: `Connection error: ${err?.message || ""}`,
        diagnostics: [], boardSnapshots: [],
        matchesTarget: false, movesCount: 0, isPar: false,
        latencyMs: 0, rawOutput: String(err),
      });
    } finally {
      setIsVerifying(false);
    }
  }, [currentLevel, isVerifying, code, usedHints]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleVerify(); }
      if (e.key === "Escape") {
        setIsRawModalOpen(false);
        setIsConceptModalOpen(false);
        setIsManualModalOpen(false);
        setIsWinModalOpen(false);
        setLevelMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleVerify]);

  const handleInsert = (snippet: string) => {
    sound.playInsert?.();
    setCode(prev => {
      const t = prev.trimEnd();
      return t ? t + "\n" + snippet + "\n" : snippet + "\n";
    });
  };

  const handleReset = () => {
    if (currentLevel) {
      sound.playInsert?.();
      setCode(currentLevel.initialCode || "");
      setResult(null); setActiveStep(0); setUsedHints(false);
    }
  };

  const handleNextLevel = () => {
    setIsWinModalOpen(false);
    if (currentLevelId < levels.length) setCurrentLevelId(currentLevelId + 1);
  };

  if (!currentLevel) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
        <span style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 13 }}>Loading ProofQuest…</span>
      </div>
    );
  }

  const allColors = [...(currentLevel.start?.cells ?? []), ...(currentLevel.target?.cells ?? [])];
  const snapshots = result?.boardSnapshots ?? [];
  const totalSteps = snapshots.length;
  const atPar = currentMoveCount <= currentLevel.par;

  return (
    <div className="app-shell">
      {/* ── Navigation Bar ── */}
      <nav className="app-nav">
        {/* Brand */}
        <div className="nav-brand">
          <img src="/logo.png" alt="ProofQuest" className="nav-logo-img" />
          <span className="nav-name">ProofQuest</span>
        </div>

        {/* Center: Compact Level Selector Pill */}
        <div className="nav-center" ref={levelMenuRef} style={{ position: "relative" }}>
          <button
            className="nav-level-pill"
            onClick={() => setLevelMenuOpen(o => !o)}
            aria-label="Select level"
          >
            <span className="pill-level-id">Level {currentLevel.id}</span>
            <span className="pill-sep">·</span>
            <span className="pill-title">{currentLevel.title}</span>
            <span className="pill-count">{currentLevel.id}/{levels.length}</span>
            <ChevronDown size={13} color="var(--text-3)" />
          </button>

          {/* Level dropdown */}
          {levelMenuOpen && (
            <div className="level-list-dropdown">
              {levels.map(lvl => (
                <div
                  key={lvl.id}
                  className={`level-list-item ${lvl.id === currentLevel.id ? "active" : ""}`}
                  onClick={() => loadLevel(lvl.id)}
                >
                  <span className="ll-num">{lvl.id < 10 ? `0${lvl.id}` : lvl.id}</span>
                  <span className="ll-name">{lvl.title}</span>
                  <div className="ll-stars">
                    {starsMap[lvl.id] > 0 && [1,2,3].map(s => (
                      <Star key={s} size={10}
                        fill={s <= (starsMap[lvl.id] || 0) ? "#eab308" : "none"}
                        color={s <= (starsMap[lvl.id] || 0) ? "#eab308" : "#d1d5db"}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="nav-actions">
          <button className="btn btn-outline btn-icon" onClick={handleToggleAudio} title={audioEnabled ? "Mute audio" : "Unmute audio"}>
            {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button className="btn btn-outline" onClick={() => setIsManualModalOpen(true)}>
            <HelpCircle size={14} /> Manual
          </button>
          {currentLevel.conceptCard && (
            <button className="btn btn-outline" onClick={() => setIsConceptModalOpen(true)}>
              <BookOpen size={14} /> Concept
            </button>
          )}
          <button className="btn btn-outline" onClick={handleReset} title="Reset code to initial state">
            <RotateCcw size={13} /> Reset
          </button>
          <button
            className="btn btn-primary"
            onClick={handleVerify}
            disabled={isVerifying}
            title="Run proof verification (Ctrl+Enter)"
          >
            <Play size={14} /> {isVerifying ? "Checking…" : "Run proof"}
          </button>
        </div>
      </nav>

      {/* ── Main Two-Panel Layout ── */}
      <div className="app-content">

        {/* ── Left Card: Board State ── */}
        <div className="card board-card">
          <div className="card-header">
            <span className="card-title">Board state</span>
            <span className="card-meta">
              Step {activeStep} of {totalSteps}
            </span>
          </div>

          <div className="board-panel">
            {/* Boards side by side with increased gap */}
            <div className="boards-dual">
              <div className="board-section">
                <div className="board-section-title">
                  <span>Current board</span>
                </div>
                <BoardView
                  board={displayedBoard}
                  target={currentLevel.target}
                  hoveredIdx={hoveredIdx}
                  onHoverIdx={setHoveredIdx}
                  showDiff={showDiff}
                  showSymbols={showSymbols}
                  showCoords={showCoords}
                />
              </div>

              <div className="board-section board-reference-card">
                <div className="board-section-title">
                  <span>Target reference</span>
                </div>
                <BoardView
                  board={currentLevel.target}
                  isTarget
                  hoveredIdx={hoveredIdx}
                  onHoverIdx={setHoveredIdx}
                  showDiff={showDiff}
                  showSymbols={showSymbols}
                  showCoords={showCoords}
                />
              </div>
            </div>

            {/* Display options row */}
            <div className="board-options-row">
              <label className="option-check-label">
                <input type="checkbox" checked={showCoords} onChange={e => setShowCoords(e.target.checked)} />
                <span>Coordinates</span>
              </label>
              <label className="option-check-label">
                <input type="checkbox" checked={showSymbols} onChange={e => setShowSymbols(e.target.checked)} />
                <span>Symbols</span>
              </label>
              <label className="option-check-label">
                <input type="checkbox" checked={showDiff} onChange={e => setShowDiff(e.target.checked)} />
                <span>Difference marker</span>
              </label>
            </div>

            {/* Step Status & Tile Differences */}
            <div className="board-step-card">
              <div className="step-card-header">
                <span className="step-card-badge">
                  {activeStep === 0 ? "Initial Board" : `Step ${activeStep} of ${totalSteps}`}
                </span>
                <span className={`step-diff-badge ${diffCount === 0 ? "match" : ""}`}>
                  {diffCount === 0 ? "Matches target" : `${diffCount} differ`}
                </span>
              </div>
              <div className="step-card-desc">
                {activeStep === 0 ? (
                  <span>Initial state · {diffCount} {diffCount === 1 ? "tile differs" : "tiles differ"}</span>
                ) : (
                  <span>
                    After: <code>{snapshots[activeStep - 1] ? (code.split("\n")[snapshots[activeStep - 1].playerLine - 1]?.trim() || `Step ${activeStep}`) : `Step ${activeStep}`}</code>
                  </span>
                )}
              </div>
            </div>

            {/* History / Step scrubber with code line */}
            <StepTimeline
              snapshots={snapshots}
              activeStep={activeStep}
              onStepChange={setActiveStep}
              code={code}
            />

            {/* Tile legend */}
            <TileLegend colors={allColors} />
          </div>
        </div>

        {/* ── Right Card: Lean Workspace ── */}
        <div className="card editor-card">
          {/* Card header */}
          <div className="editor-card-header">
            <span className="editor-title">Lean workspace</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="lean-badge">
                <Cpu size={12} />
                Lean 4.16
              </div>
              <span className={`move-count-badge ${atPar ? "at-par" : "over-par"}`}>
                Moves: {currentMoveCount} / {currentLevel.par} par
              </span>
            </div>
          </div>

          {/* Tactic insert bar */}
          <div className="tactic-bar">
            <span className="tactic-bar-label">Insert:</span>
            {currentLevel.allowedMoves.includes("swap") && (
              <button className="tactic-chip" onClick={() => handleInsert("swap 0 1")}>swap i j</button>
            )}
            {currentLevel.allowedMoves.includes("paint") && (
              <button className="tactic-chip" onClick={() => handleInsert("paint 0 green")}>paint i color</button>
            )}
            {currentLevel.allowedMoves.includes("rotate_row") && (
              <button className="tactic-chip" onClick={() => handleInsert("rotate_row 0")}>rotate_row r</button>
            )}
            {currentLevel.allowedMoves.includes("finish") && (
              <button className="tactic-chip" onClick={() => handleInsert("finish")}>finish</button>
            )}
            {currentLevel.allowedMoves.includes("macro") && (
              <button
                className="tactic-chip tactic-chip-macro"
                onClick={() => handleInsert('macro "helper" : tactic => `(tactic| (swap 0 1 ; swap 1 2))')}
              >
                macro
              </button>
            )}

            {/* Hidable Hint Button */}
            <button
              type="button"
              className={`tactic-chip tactic-chip-hint ${showHint ? "active" : ""}`}
              onClick={() => setShowHint(s => !s)}
              title={showHint ? "Hide hint" : "Show hint"}
              style={{ marginLeft: "auto" }}
            >
              <HelpCircle size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
              {showHint ? "Hide hint" : "Hint"}
            </button>
          </div>

          {/* Hidable First-Use Suggestion Strip */}
          {showHint && (
            <div className="editor-suggest-bar">
              <span className="suggest-hint">{suggestedMove.hint}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  className="suggest-insert-btn"
                  onClick={() => handleInsert(suggestedMove.code)}
                  title={`Insert ${suggestedMove.code}`}
                >
                  Insert: <code>{suggestedMove.code}</code>
                </button>
                <button
                  type="button"
                  className="suggest-close-btn"
                  onClick={() => setShowHint(false)}
                  title="Hide hint"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Dark editor */}
          <div className="editor-area">
            <CodeEditor
              code={code}
              onChange={setCode}
              diagnostics={result?.diagnostics ?? []}
              boardSnapshots={snapshots}
              onVerify={handleVerify}
            />
          </div>

          {/* Status footer inside card */}
          <MessagePanel
            result={result}
            isVerifying={isVerifying}
            onOpenRawOutput={() => setIsRawModalOpen(true)}
            diffCount={diffCount}
          />

          {/* Collapsible Hints & Concepts tray */}
          {(currentLevel.hints || currentLevel.conceptCard) && (
            <div className={`editor-hints-tray ${hintsTrayOpen ? "open" : ""}`}>
              <button
                type="button"
                className="hints-tray-toggle"
                onClick={() => setHintsTrayOpen(o => !o)}
                title="Toggle hints and concept explanation"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <HelpCircle size={13} color="var(--accent)" />
                  <span>Hints &amp; Concept</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {hintsTrayOpen ? "Hide" : "Need help?"}
                  </span>
                  {hintsTrayOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </div>
              </button>
              {hintsTrayOpen && (
                <div className="hints-tray-content">
                  {currentLevel.concept && (
                    <div>
                      <div className="hints-section-title">Concept</div>
                      <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>{currentLevel.concept}</p>
                    </div>
                  )}
                  {currentLevel.hints && (
                    <div>
                      <div className="hints-section-title">Hints</div>
                      <HintsDrawer hints={currentLevel.hints} onUseHint={() => setUsedHints(true)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <ManualModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} />
      <RawOutputModal isOpen={isRawModalOpen} onClose={() => setIsRawModalOpen(false)} rawOutput={result?.rawOutput ?? ""} />
      {currentLevel.conceptCard && (
        <ConceptCardModal
          isOpen={isConceptModalOpen}
          onClose={() => setIsConceptModalOpen(false)}
          card={currentLevel.conceptCard}
          levelTitle={currentLevel.title}
        />
      )}
      {result && (
        <WinModal
          isOpen={isWinModalOpen}
          level={currentLevel}
          result={result}
          usedHints={usedHints}
          onNextLevel={handleNextLevel}
          onReplay={() => { setIsWinModalOpen(false); handleReset(); }}
          onClose={() => setIsWinModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
