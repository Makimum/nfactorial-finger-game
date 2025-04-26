const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;

// In-memory data for demo (replace with file/DB for Level 3+)
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
// You can add memes, games, user status etc. as arrays here!

app.use(cors());
app.use(express.json());

// GET all tasks or by difficulty
app.get("/api/tasks", (req, res) => {
  const difficulty = req.query.difficulty;
  if (difficulty && difficulty !== "any") {
    return res.json(tasks.filter((t) => t.difficulty === difficulty));
  }
  res.json(tasks);
});

// POST a new game (returns a simple game id for now)
app.post("/api/games", (req, res) => {
  // In demo, just return random id
  const gameId = Math.random().toString(36).substr(2, 9);
  res.json({ gameId, message: "Game created!" });
});

// GET status (demo, returns OK)
app.get("/api/status", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
