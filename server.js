const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 4000;

const tasksFilePath = path.join(__dirname, "tasks.json");
let tasks = [];

function loadTasks() {
  try {
    const data = fs.readFileSync(tasksFilePath, "utf8");
    tasks = JSON.parse(data);
  } catch (err) {
    tasks = [];
    console.error("Could not load tasks:", err);
  }
}

loadTasks();

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
