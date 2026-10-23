import React, { useState, useEffect, useCallback } from "react";
import { Play, RotateCcw, Lightbulb, BookOpen, Star, Sparkles, ChevronRight } from "lucide-react";
import { BoardView } from "./components/BoardView.js";
import { CodeEditor } from "./components/CodeEditor.js";
import { MessagePanel } from "./components/MessagePanel.js";
import { StepTimeline } from "./components/StepTimeline.js";
import { HintsDrawer } from "./components/HintsDrawer.js";
import { RawOutputModal } from "./components/RawOutputModal.js";
import { ConceptCardModal } from "./components/ConceptCardModal.js";
import { WinModal } from "./components/WinModal.js";
import { LevelData, VerificationResult, BoardSpec } from "./types.js";

export const App: React.FC = () => {
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [code, setCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [usedHints, setUsedHints] = useState<boolean>(false);

  // Modals state
  const [isRawModalOpen, setIsRawModalOpen] = useState<boolean>(false);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState<boolean>(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);

  // Completed levels & stars from localStorage
  const [starsMap, setStarsMap] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem("pq_stars");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Fetch all levels on mount
  useEffect(() => {
    fetch("/api/levels")
      .then(res => res.json())
      .then(data => {
        if (data.levels && Array.isArray(data.levels)) {
          setLevels(data.levels);
        }
      })
      .catch(err => console.error("Failed to load levels list:", err));
  }, []);

  // Fetch full details of the active level
  const loadLevel = useCallback((lvlId: number) => {
    fetch(`/api/levels/${lvlId}`)
      .then(res => res.json())
      .then(data => {
        if (data.level) {
          const lvl: LevelData = data.level;
          setCurrentLevelId(lvlId);
          setCode(lvl.initialCode || "");
          setResult(null);
          setActiveStep(0);
          setUsedHints(false);
          setIsWinModalOpen(false);
        }
      })
      .catch(err => console.error(`Failed to load level ${lvlId}:`, err));
  }, []);

  useEffect(() => {
    loadLevel(currentLevelId);
  }, [currentLevelId, loadLevel]);

  const currentLevel = levels.find(l => l.id === currentLevelId) || levels[0];

  // Execute Lean verification
  const handleVerify = async () => {
    if (!currentLevel || isVerifying) return;
    setIsVerifying(true);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: currentLevel.id,
          code
        })
      });

      const data: VerificationResult = await response.json();
      setResult(data);

      if (data.boardSnapshots && data.boardSnapshots.length > 0) {
        setActiveStep(data.boardSnapshots.length);
      } else {
        setActiveStep(0);
      }

      if (data.success) {
        const stars = !usedHints && data.isPar ? 3 : data.isPar || !usedHints ? 2 : 1;
        setStarsMap(prev => {
          const next = { ...prev, [currentLevel.id]: Math.max(prev[currentLevel.id] || 0, stars) };
          try {
            localStorage.setItem("pq_stars", JSON.stringify(next));
          } catch {}
          return next;
        });
        setIsWinModalOpen(true);
      }
    } catch (err: any) {
      setResult({
        success: false,
        status: "error",
        summary: `Connection error: ${err?.message || "Failed to contact Lean verification service"}`,
        diagnostics: [],
        boardSnapshots: [],
        matchesTarget: false,
        movesCount: 0,
        isPar: false,
        latencyMs: 0,
        rawOutput: String(err)
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Determine which board to display based on timeline scrubber
  const displayedBoard: BoardSpec = React.useMemo(() => {
    if (!currentLevel) {
      return { width: 3, height: 3, cells: [] };
    }
    if (!result || !result.boardSnapshots || result.boardSnapshots.length === 0 || activeStep === 0) {
      return currentLevel.start;
    }
    const snap = result.boardSnapshots[activeStep - 1];
    return snap ? snap.board : currentLevel.start;
  }, [currentLevel, result, activeStep]);

  // Insert tactic template from palette
  const handleInsertMove = (moveSnippet: string) => {
    setCode(prev => {
      const trimmed = prev.trimEnd();
      return trimmed === "" ? moveSnippet + "\n" : trimmed + "\n" + moveSnippet + "\n";
    });
  };

  const handleNextLevel = () => {
    setIsWinModalOpen(false);
    if (currentLevelId < levels.length) {
      setCurrentLevelId(currentLevelId + 1);
    }
  };

  const handleResetLevel = () => {
    if (currentLevel) {
      setCode(currentLevel.initialCode || "");
      setResult(null);
      setActiveStep(0);
      setUsedHints(false);
    }
  };

  if (!currentLevel) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>Loading ProofQuest...</p>
      </div>
    );
  }

  const currentLevelStars = starsMap[currentLevel.id] || 0;

  return (
    <div>
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <div className="brand-title">ProofQuest</div>
            <div className="brand-tagline">Every Move Must Be Proven</div>
          </div>
        </div>

        <div className="header-center">
          <div className="level-badge">
            <span>Level {currentLevel.id}: {currentLevel.title}</span>
            <div className="star-rating">
              {[1, 2, 3].map(s => (
                <Star
                  key={s}
                  size={15}
                  fill={s <= currentLevelStars ? "#fbbf24" : "none"}
                  color={s <= currentLevelStars ? "#fbbf24" : "#475569"}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setIsConceptModalOpen(true)}
            title="Read concept card for this level"
          >
            <BookOpen size={16} /> Concept
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleResetLevel}
            title="Reset code to initial state"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            className="btn btn-primary"
            onClick={handleVerify}
            disabled={isVerifying}
            title="Run proof in Lean 4 sandbox (Ctrl+Enter)"
          >
            <Play size={16} /> {isVerifying ? "Verifying..." : "Run Proof"}
          </button>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <main className="main-container">
        {/* Left Column: Boards, Scrubber, Palette */}
        <section className="panel-card" aria-label="Game Boards">
          <div className="panel-header">
            <div className="panel-title">
              <span>Visual Proof State</span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Par: {currentLevel.par} Moves
            </span>
          </div>

          <div className="boards-wrapper">
            <div className="boards-dual">
              <div className="board-container">
                <div className="board-label active">
                  Current Board {activeStep > 0 && `(Step ${activeStep})`}
                </div>
                <BoardView board={displayedBoard} target={currentLevel.target} />
              </div>

              <div className="board-container">
                <div className="board-label">
                  Target Board
                </div>
                <BoardView board={currentLevel.target} isTarget />
              </div>
            </div>

            {/* Intermediate Board Step Timeline */}
            <StepTimeline
              snapshots={result?.boardSnapshots || []}
              activeStep={activeStep}
              onStepChange={step => setActiveStep(step)}
            />

            {/* Move Snippet Palette */}
            <div className="palette-section">
              <div className="palette-title">Available Tactics for this Level</div>
              <div className="palette-chips">
                {currentLevel.allowedMoves.includes("swap") && (
                  <button className="palette-chip" onClick={() => handleInsertMove("swap 0 1")}>
                    + swap i j
                  </button>
                )}
                {currentLevel.allowedMoves.includes("paint") && (
                  <button className="palette-chip" onClick={() => handleInsertMove("paint 0 green")}>
                    + paint idx color
                  </button>
                )}
                {currentLevel.allowedMoves.includes("rotate_row") && (
                  <button className="palette-chip" onClick={() => handleInsertMove("rotate_row 0")}>
                    + rotate_row r
                  </button>
                )}
                {currentLevel.allowedMoves.includes("finish") && (
                  <button className="palette-chip" onClick={() => handleInsertMove("finish")}>
                    + finish
                  </button>
                )}
                {currentLevel.allowedMoves.includes("macro") && (
                  <button
                    className="palette-chip"
                    onClick={() => handleInsertMove('macro "my_helper" : tactic => `(tactic| (swap 0 1 ; swap 1 2))')}
                    style={{ color: "#a855f7", borderColor: "rgba(168, 85, 247, 0.4)" }}
                  >
                    + macro helper
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Center Column: Proof Code Editor & Feedback */}
        <section className="panel-card" aria-label="Proof Code Editor">
          <div className="editor-wrapper">
            <div className="editor-header-bar">
              <div className="theorem-sig">
                <span>theorem level_{currentLevel.id} : Reaches start target := by</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Press Ctrl+Enter to Verify
              </span>
            </div>

            <CodeEditor
              code={code}
              onChange={setCode}
              diagnostics={result?.diagnostics || []}
              boardSnapshots={result?.boardSnapshots || []}
              onVerify={handleVerify}
            />

            <MessagePanel
              result={result}
              isVerifying={isVerifying}
              onOpenRawOutput={() => setIsRawModalOpen(true)}
            />
          </div>
        </section>

        {/* Right Column: Level Select, Concept Card, Hints */}
        <aside className="sidebar-right" aria-label="Level Progression and Hints">
          {/* Level Progression */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">Levels (1 to 10)</div>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                {Object.keys(starsMap).length} / {levels.length} Solved
              </span>
            </div>
            <div className="level-list">
              {levels.map(lvl => {
                const isSelected = lvl.id === currentLevel.id;
                const stars = starsMap[lvl.id] || 0;

                return (
                  <div
                    key={lvl.id}
                    className={`level-item ${isSelected ? "active" : ""}`}
                    onClick={() => loadLevel(lvl.id)}
                  >
                    <div className="level-item-left">
                      <span className="level-num">{lvl.id < 10 ? `0${lvl.id}` : lvl.id}</span>
                      <span className="level-title">{lvl.title}</span>
                    </div>
                    <div className="level-item-status">
                      {stars > 0 ? (
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1, 2, 3].map(s => (
                            <Star
                              key={s}
                              size={12}
                              fill={s <= stars ? "#fbbf24" : "none"}
                              color={s <= stars ? "#fbbf24" : "#475569"}
                            />
                          ))}
                        </div>
                      ) : (
                        <ChevronRight size={14} color="var(--text-dim)" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Concept Summary */}
          {currentLevel.conceptCard && (
            <div className="concept-card">
              <div className="concept-title">
                <BookOpen size={15} />
                {currentLevel.conceptCard.title}
              </div>
              <div className="concept-desc">
                {currentLevel.concept}
              </div>
            </div>
          )}

          {/* Tiered Hints */}
          {currentLevel.hints && (
            <div className="panel-card">
              <div className="panel-header">
                <div className="panel-title">
                  <Lightbulb size={16} color="#fbbf24" />
                  Hints (3 Tiers)
                </div>
              </div>
              <HintsDrawer
                hints={currentLevel.hints}
                onUseHint={() => setUsedHints(true)}
              />
            </div>
          )}
        </aside>
      </main>

      {/* Modals */}
      <RawOutputModal
        isOpen={isRawModalOpen}
        onClose={() => setIsRawModalOpen(false)}
        rawOutput={result?.rawOutput || ""}
      />

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
          onReplay={() => {
            setIsWinModalOpen(false);
            handleResetLevel();
          }}
          onClose={() => setIsWinModalOpen(false)}
        />
      )}
    </div>
  );
};
export default App;
