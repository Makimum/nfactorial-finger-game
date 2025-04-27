// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;

/* ---------- middleware ---------- */
app.use(cors()); // in demo mode this is fine; lock down origin before deploy
app.use(express.json());

/* ---------- helper to sync-load local json files ---------- */
function loadJson(filename) {
  try {
    return JSON.parse(fs.readFileSync(filename, "utf8"));
  } catch (e) {
    console.error(`❌  Could not load ${filename}:`, e);
    return []; // fail-soft: return empty list
  }
}

/* ---------- load datasets ---------- */
const tasks = loadJson("tasks.json");
const memes = loadJson("memes.json");
const badWords = loadJson("badwords.json");

console.log(
  `Loaded ${tasks.length} tasks, ${memes.length} memes, ${badWords.length} bad-words.`
);

/* ---------- simple in-memory game store ---------- */
let games = {}; // { [gameId]: { players: [], eliminated: [], winner: null } }

/* ---------- public API ---------- */

// 1) tasks / memes / bad-words
app.get("/api/tasks", (_, res) => res.json(tasks));
app.get("/api/memes", (_, res) => res.json(memes));
app.get("/api/bad-words", (_, res) => res.json(badWords));

// 2) create a new game
app.post("/api/games", (req, res) => {
  const gameId = Math.random().toString(36).substr(2, 9);
  games[gameId] = { players: [], eliminated: [], winner: null };
  res.json({ gameId, message: "Game created!" });
});

// 3) random task for a game (optional difficulty filter)
app.get("/api/games/:gameId/random-task", (req, res) => {
  const { gameId } = req.params;
  const difficulty = req.query.difficulty || "any";

  if (!games[gameId]) return res.status(404).json({ error: "Game not found" });

  const pool =
    difficulty === "any"
      ? tasks
      : tasks.filter((t) => t.difficulty === difficulty);

  if (!pool.length)
    return res.status(404).json({ error: "No tasks for that difficulty" });

  const task = pool[Math.floor(Math.random() * pool.length)];
  res.json(task);
});

// 4) add player
app.post("/api/games/:gameId/players", (req, res) => {
  const { gameId } = req.params;
  const { playerName } = req.body || {};

  if (!playerName || typeof playerName !== "string" || !playerName.trim())
    return res.status(400).json({ error: "Invalid player name" });
  if (!games[gameId]) return res.status(404).json({ error: "Game not found" });
  if (games[gameId].players.includes(playerName))
    return res.status(400).json({ error: "Player already exists" });

  games[gameId].players.push(playerName);
  res.json({ message: "Player added", players: games[gameId].players });
});

// 5) eliminate player
app.post("/api/games/:gameId/eliminate", (req, res) => {
  const { gameId } = req.params;
  const { playerName } = req.body || {};

  if (!games[gameId]) return res.status(404).json({ error: "Game not found" });
  if (!games[gameId].players.includes(playerName))
    return res.status(404).json({ error: "Player not found" });

  if (!games[gameId].eliminated.includes(playerName))
    games[gameId].eliminated.push(playerName);

  const remaining = games[gameId].players.filter(
    (p) => !games[gameId].eliminated.includes(p)
  );
  if (remaining.length === 1) games[gameId].winner = remaining[0];

  res.json({
    message: "Player eliminated",
    eliminated: games[gameId].eliminated,
    winner: games[gameId].winner || null,
  });
});

// 6) game status
app.get("/api/games/:gameId/status", (req, res) => {
  const { gameId } = req.params;
  if (!games[gameId]) return res.status(404).json({ error: "Game not found" });
  res.json(games[gameId]);
});

/* ---------- server ---------- */
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
