// server.js
/* ───────────────────── dependencies ───────────────────── */
const express  = require("express");
const cors     = require("cors");
const fs       = require("fs");
const Airtable = require("airtable");          //  npm i airtable

/* ───────────────────── Airtable init ───────────────────── */
const {
  AIRTABLE_TOKEN,   // personal access token
  AIRTABLE_BASE,    // base ID  (starts with “app”)
  AIRTABLE_TABLE    // table name  (e.g. “Leaderboard”)
} = process.env;

const base  = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE);
const table = () => base(AIRTABLE_TABLE);

/* ───────────────────── Express app ───────────────────── */
const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());              // OK for demo – restrict before prod
app.use(express.json());      // body-parser

/* ───────────────────── helper: load local JSON ───────────────────── */
function loadJson(filename) {
  try {
    return JSON.parse(fs.readFileSync(filename, "utf8"));
  } catch (e) {
    console.error(`❌  Could not load ${filename}:`, e);
    return [];
  }
}

/* ───────────────────── datasets (local) ───────────────────── */
const tasks    = loadJson("tasks.json");
const memes    = loadJson("memes.json");
const badWords = loadJson("badwords.json");

console.log(`Loaded ${tasks.length} tasks, ${memes.length} memes, ${badWords.length} bad-words.`);

/* ───────────────────── in-memory game store ───────────────────── */
let games = {};   // { [gameId]: { players:[], eliminated:[], winner:null } }

/* ───────────────────── PUBLIC API ───────────────────── */

/* 1) static datasets */
app.get("/api/tasks",      (_,res)=>res.json(tasks));
app.get("/api/memes",      (_,res)=>res.json(memes));
app.get("/api/bad-words",  (_,res)=>res.json(badWords));

/* 2) create game */
app.post("/api/games", (_,res)=>{
  const id = Math.random().toString(36).substr(2,9);
  games[id] = { players:[], eliminated:[], winner:null };
  res.json({ gameId:id, message:"Game created!" });
});

/* 3) random task */
app.get("/api/games/:id/random-task",(req,res)=>{
  const { id } = req.params;
  const diff   = req.query.difficulty || "any";
  if(!games[id]) return res.status(404).json({error:"Game not found"});

  const pool = diff==="any" ? tasks : tasks.filter(t=>t.difficulty===diff);
  if(!pool.length) return res.status(404).json({error:"No tasks for that difficulty"});

  res.json(pool[Math.floor(Math.random()*pool.length)]);
});

/* 4) add player */
app.post("/api/games/:id/players",(req,res)=>{
  const { id } = req.params;
  const { playerName } = req.body || {};
  if(!playerName?.trim())         return res.status(400).json({error:"Invalid name"});
  if(!games[id])                  return res.status(404).json({error:"Game not found"});
  if(games[id].players.includes(playerName))
    return res.status(400).json({error:"Player exists"});

  games[id].players.push(playerName);
  res.json({ message:"Player added", players:games[id].players });
});

/* 5) eliminate player */
app.post("/api/games/:id/eliminate",(req,res)=>{
  const { id } = req.params;
  const { playerName } = req.body || {};
  if(!games[id]) return res.status(404).json({error:"Game not found"});
  if(!games[id].players.includes(playerName))
    return res.status(404).json({error:"Player not found"});

  if(!games[id].eliminated.includes(playerName))
    games[id].eliminated.push(playerName);

  const remaining = games[id].players.filter(p=>!games[id].eliminated.includes(p));
  if(remaining.length===1) games[id].winner = remaining[0];

  res.json({ message:"Player eliminated",
             eliminated:games[id].eliminated, winner:games[id].winner||null });
});

/* 6) game status */
app.get("/api/games/:id/status",(req,res)=>{
  const g = games[req.params.id];
  if(!g) return res.status(404).json({error:"Game not found"});
  res.json(g);
});

/* ───────────────────── Airtable endpoints ───────────────────── */

/* POST  /api/game-result   → one row */
app.post("/api/game-result", async (req,res)=>{
  try {
    const rec = await table().create([{ fields:req.body }]);
    res.json({ success:true, id:rec[0].getId() });
  } catch (err) {
    console.error("Airtable write error:", err);
    res.status(500).json({ error:"Failed to write to Airtable" });
  }
});

/* GET  /api/leaderboard    → { nick: wins } */
app.get("/api/leaderboard", async (_,res)=>{
  try {
    const counts = {};
    await table().select({
      filterByFormula: "{Result}=1",
      fields:["Name"]
    }).eachPage((recs,next)=>{
      recs.forEach(r=>{
        const n = r.get("Name") || "Anonymous";
        counts[n] = (counts[n]||0)+1;
      });
      next();
    });
    res.json(counts);
  } catch (err) {
    console.error("Airtable read error:", err);
    res.status(500).json({ error:"Could not fetch leaderboard" });
  }
});

/* ───────────────────── listen ───────────────────── */
app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
