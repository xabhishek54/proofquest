import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { LEVELS } from "./levels.js";
import { verifyProof } from "./verifier.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const LEAN_DIR = process.env.LEAN_DIR || path.resolve(__dirname, "../../lean");
const ELAN_BIN_DIR = process.env.ELAN_BIN_DIR || path.join(process.env.HOME || "", ".elan/bin");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Pre-flight / Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    engine: "Lean 4.16.0",
    levelsCount: LEVELS.length,
    timestamp: new Date().toISOString()
  });
});

// List all levels
app.get("/api/levels", (_req, res) => {
  const safeLevels = LEVELS.map(lvl => ({
    id: lvl.id,
    title: lvl.title,
    tagline: lvl.tagline,
    concept: lvl.concept,
    allowedMoves: lvl.allowedMoves,
    par: lvl.par,
    start: lvl.start,
    target: lvl.target,
    hasHelpers: lvl.hasHelpers ?? false
  }));
  res.json({ levels: safeLevels });
});

// Get single level details
app.get("/api/levels/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const lvl = LEVELS.find(l => l.id === id);
  if (!lvl) {
    res.status(404).json({ error: `Level ${id} not found` });
    return;
  }

  // Return level without leaking reference solution
  const { referenceSolution, ...safeLevel } = lvl;
  res.json({ level: safeLevel });
});

// Verify proof submission
app.post("/api/verify", async (req, res) => {
  const { levelId, code } = req.body;

  if (typeof levelId !== "number" || typeof code !== "string") {
    res.status(400).json({ error: "Invalid request payload. Expected { levelId: number, code: string }" });
    return;
  }

  const level = LEVELS.find(l => l.id === levelId);
  if (!level) {
    res.status(404).json({ error: `Level ${levelId} not found` });
    return;
  }

  try {
    const result = await verifyProof(level, code, LEAN_DIR, ELAN_BIN_DIR);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: "Internal verification error",
      details: err?.message || String(err)
    });
  }
});

// Serve frontend static build if exists
const clientDistPath = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

app.get("*", (_req, res, next) => {
  const indexPath = path.join(clientDistPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

app.listen(PORT, async () => {
  console.log(`[ProofQuest Server] Running on http://localhost:${PORT}`);
  console.log(`[ProofQuest Server] Lean library path: ${LEAN_DIR}`);
  console.log(`[ProofQuest Server] Elan binaries path: ${ELAN_BIN_DIR}`);

  // Pre-warm Lean cache with Level 1 reference solution
  try {
    const l1 = LEVELS[0];
    await verifyProof(l1, l1.referenceSolution, LEAN_DIR, ELAN_BIN_DIR);
    console.log("[ProofQuest Server] Lean engine pre-warmed and cached successfully.");
  } catch (err) {
    console.warn("[ProofQuest Server] Pre-warm notice:", err);
  }
});
