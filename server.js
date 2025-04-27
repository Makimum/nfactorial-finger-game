const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// --- In-memory storage ---
let tasks = [
  { type: "truth", text: "What is your biggest fear?", difficulty: "easy" },
  { type: "action", text: "Do 5 jumping jacks!", difficulty: "easy" },
  { type: "truth", text: "Who is your hero?", difficulty: "medium" },
  {
    type: "action",
    text: "Make a funny face for 5 seconds!",
    difficulty: "hard",
  },
];
let games = {}; // { [gameId]: { players: [], eliminated: [], winner: null } }

// --- 1. Initialize a new game ---
app.post("/api/games", (req, res) => {
  const gameId = Math.random().toString(36).substr(2, 9);
  games[gameId] = {
    players: [],
    eliminated: [],
    winner: null,
  };
  res.json({ gameId, message: "Game created!" });
});

// --- 2. Receive a random assignment (task) ---
app.get("/api/games/:gameId/random-task", (req, res) => {
  const { gameId } = req.params;
  const difficulty = req.query.difficulty || "any";
  if (!games[gameId]) {
    return res.status(404).json({ error: "Game not found" });
  }
  let filteredTasks = tasks;
  if (difficulty !== "any") {
    filteredTasks = tasks.filter((t) => t.difficulty === difficulty);
  }
  if (filteredTasks.length === 0) {
    return res
      .status(404)
      .json({ error: "No tasks found for that difficulty" });
  }
  const task = filteredTasks[Math.floor(Math.random() * filteredTasks.length)];
  res.json(task);
});

// --- 3. Track player status (add, eliminate, get status) ---

// Add a player to a game
app.post("/api/games/:gameId/players", (req, res) => {
  const { gameId } = req.params;
  const { playerName } = req.body;
  if (!games[gameId]) {
    return res.status(404).json({ error: "Game not found" });
  }
  if (games[gameId].players.includes(playerName)) {
    return res.status(400).json({ error: "Player already exists" });
  }
  games[gameId].players.push(playerName);
  res.json({ message: "Player added", players: games[gameId].players });
});

// Eliminate a player
app.post("/api/games/:gameId/eliminate", (req, res) => {
  const { gameId } = req.params;
  const { playerName } = req.body;
  if (!games[gameId]) {
    return res.status(404).json({ error: "Game not found" });
  }
  if (!games[gameId].players.includes(playerName)) {
    return res.status(404).json({ error: "Player not found" });
  }
  games[gameId].eliminated.push(playerName);
  // Check if only 1 player left, declare winner
  const remaining = games[gameId].players.filter(
    (p) => !games[gameId].eliminated.includes(p)
  );
  if (remaining.length === 1) {
    games[gameId].winner = remaining[0];
  }
  res.json({
    message: "Player eliminated",
    eliminated: games[gameId].eliminated,
    winner: games[gameId].winner || null,
  });
});

// Get game/player status
app.get("/api/games/:gameId/status", (req, res) => {
  const { gameId } = req.params;
  if (!games[gameId]) {
    return res.status(404).json({ error: "Game not found" });
  }
  res.json({
    players: games[gameId].players,
    eliminated: games[gameId].eliminated,
    winner: games[gameId].winner,
  });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
