// ===== Backend base URL =====
const API = "https://nfactorial-backend.onrender.com";

// ===== Data pulled from the backend =====
let tasks = [];
let memes = [];
let badWords = [];

/* ---------- fetch helpers ---------- */
async function fetchTasks() {
  tasks = await (await fetch(`${API}/api/tasks`)).json();
}
async function fetchMemes() {
  memes = await (await fetch(`${API}/api/memes`)).json();
}
async function fetchBadWords() {
  badWords = await (await fetch(`${API}/api/bad-words`)).json();
}

/* ---------- profanity helper ---------- */
function containsBadWord(str) {
  const lower = str.toLowerCase();
  return badWords.some((w) => lower.includes(w));
}

/* ---------- Win-stats (persisted) ---------- */
let winStats = {};
if (localStorage.getItem("nfact-winStats")) {
  winStats = JSON.parse(localStorage.getItem("nfact-winStats"));
}

/* ---------- purge bad-word winners ---------- */
function purgeBadWinners() {
  let changed = false;
  for (const name of Object.keys(winStats)) {
    if (containsBadWord(name)) {
      delete winStats[name];
      changed = true;
    }
  }
  if (changed) {
    localStorage.setItem("nfact-winStats", JSON.stringify(winStats));
  }
}

// --- UI Constants ---
const playerColors = [
  "#f7b731",
  "#eb3b5a",
  "#20bf6b",
  "#3867d6",
  "#8854d0",
  "#fa8231",
  "#2d98da",
  "#fc5c65",
];

// --- Settings ---
let gameMode = "elimination"; // default: elimination
let taskDifficulty = "any"; // "easy", "medium", "hard", or "any"
let taskTime = 30; // seconds

// --- UI state ---
const app = document.getElementById("app");
let step = 0;
let numPlayers = 2;
let nicknames = [];
let holdingTimeouts = {};
let currentTask = null;
function backOneStep() {
  if (step > 0) {
    step -= 1;
    render();
  }
}
/* ---------- Main Render Function ---------- */
function render() {
  /* reusable back link (only if we’re past step 0) */
  const backLink =
    step > 0
      ? `<a href="#" id="back-link"
             style="text-decoration:none;font-size:.9em;display:inline-block;margin-bottom:6px">
           ← Back
         </a>`
      : "";

  /* ----------------------------------------------------------------
   STEP 0  :  Game Settings
---------------------------------------------------------------- */
if (step === 0) {
  app.innerHTML = `
    ${backLink}
    <h2>Game Settings</h2>
    <form id="settings-form">

      <!-- ───── Mode ───── -->
      <label>Mode:
        <select id="mode-select">
          <option value="simple">Simple (random winner)</option>
          <option value="tasks">Tasks (no elimination)</option>
          <option value="elimination" selected>Elimination (last player wins)</option>
        </select>
      </label><br/><br/>

      <!-- ───── Difficulty ───── -->
      <label>Task Difficulty:
        <select id="difficulty-select">
          <option value="any" selected>Any</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label><br/><br/>

      <!-- ───── Time picker (dropdown + custom) ───── -->
      <label>Task Time:
        <select id="time-select">
          ${[5,10,20,30,40,50,60]
            .map(v => `<option value="${v}" ${v===30?"selected":""}>${v}s</option>`).join("")}
          <option value="custom">Custom …</option>
        </select>

        <input id="time-input"
               type="number" min="5" max="180" value="30"
               style="display:none;width:80px;margin-left:6px"/>
      </label><br/><br/>

      <button class="big-btn call-to-action" type="submit">Next</button>
    </form>
  `;

  /* ⇦ Back */
  const back = document.getElementById("back-link");
  if (back) back.onclick = (e) => { e.preventDefault(); backOneStep(); };

  /* dropdown ↔ custom input toggle */
  const timeSel = document.getElementById("time-select");
  const timeInp = document.getElementById("time-input");
  timeSel.onchange = () => {
    if (timeSel.value === "custom") {
      timeInp.style.display = "inline-block";
      timeInp.focus();
    } else {
      timeInp.style.display = "none";
      timeInp.value = timeSel.value;
    }
  };

  /* form submit */
  document.getElementById("settings-form").onsubmit = (e) => {
    e.preventDefault();

    gameMode       = document.getElementById("mode-select").value;
    taskDifficulty = document.getElementById("difficulty-select").value;

    /* read time, validate 5-180 s */
    taskTime = Number(
      timeSel.value === "custom" ? timeInp.value : timeSel.value
    );
    if (!taskTime || taskTime < 5 || taskTime > 180) {
      alert("Task time must be 5…180 seconds");
      return;
    }

    step = 1;
    render();
  };


  /* --------------------------------------------------------
   STEP 1  :  Number of players
---------------------------------------------------------*/
} else if (step === 1) {

  app.innerHTML = `
    ${backLink}
    <h2>How many players?</h2>

    <!-- dropdown + optional custom input -->
    <select id="num-select">
      ${[1,2,3,4,5,6,7,8,9,10]
        .map(v => `<option value="${v}" ${v===2?"selected":""}>${v}</option>`)
        .join("")}
      <option value="custom">Custom …</option>
    </select>

    <input id="num-input"
           type="number" min="1" max="30" value="2"
           style="display:none;width:70px;margin-left:6px"/>

    <button class="big-btn call-to-action" id="next-btn">Next</button>
  `;

  /* ⇦ Back */
  const back = document.getElementById("back-link");
  if (back) back.onclick = (e) => { e.preventDefault(); backOneStep(); };

  /* toggle between dropdown and custom number */
  const numSel = document.getElementById("num-select");
  const numInp = document.getElementById("num-input");
  numSel.onchange = () => {
    if (numSel.value === "custom") {
      numInp.style.display = "inline-block";
      numInp.focus();
    } else {
      numInp.style.display = "none";
      numInp.value = numSel.value;
    }
  };

  /* Next → validate & continue */
  document.getElementById("next-btn").onclick = () => {
    numPlayers = Number(
      numSel.value === "custom" ? numInp.value : numSel.value
    );

    if (!numPlayers || numPlayers < 1 || numPlayers > 30) {
      alert("Players must be between 1 and 30");
      return;
    }

    nicknames               = Array(numPlayers).fill("");
    window.roundStatus      = undefined;
    window.remainingPlayers = undefined;
    currentTask             = null;
    step = 2;
    render();
  };


  /* --------------------------------------------------------
     STEP 2  :  Nicknames & validation
  ---------------------------------------------------------*/
  } else if (step === 2) {

    /* build error box only if we stored a message */
    const errorBlock = window.nicknameError
      ? `<div class="error-message" style="margin-top:12px">
           ${window.nicknameError}
         </div>`
      : "";

    app.innerHTML = `
      ${backLink}
      <h2>Enter Player Nicknames</h2>
      <form id="name-form">
        ${nicknames.map((_, i) => `
          <input  type="text"
                  placeholder="Player ${i + 1} name"
                  id="name-${i}"
                  class="player-input"
                  required
                  style="background:${playerColors[i % playerColors.length]};
                         color:white;font-weight:bold;
                         border:none;border-radius:8px;
                         padding:8px 14px;margin-bottom:10px;" /><br/>`
        ).join("")}
        <button class="big-btn call-to-action" type="submit" id="start-btn">
          Start Game
        </button>
      </form>
      ${errorBlock}
    `;
    const back = document.getElementById("back-link");
    if (back) back.onclick = (e) => { e.preventDefault(); backOneStep(); };

    document.getElementById("name-form").onsubmit = (e) => {
      e.preventDefault();
      nicknames = nicknames.map((_, i) => {
        const val = document.getElementById(`name-${i}`).value.trim();
        return val || `Player ${i + 1}`;
      });

      /* --- validation --- */
      let errorMsg = "";
      if (nicknames.some(containsBadWord)) {
        errorMsg = "One or more nicknames contain inappropriate language.";
      } else if (new Set(nicknames).size < nicknames.length) {
        errorMsg = "Duplicate nicknames are not allowed.";
      }

      if (errorMsg) {
        window.nicknameError = errorMsg;   // store and re-render to show
        render();
        return;
      }
      window.nicknameError = "";           // clear old message

      /* --- continue --- */
      step = 3;
      window.roundStatus      = Array(numPlayers).fill(false);
      window.remainingPlayers = [...nicknames];
      currentTask = null;
      render();
    };

  /* --------------------------------------------------------
     STEP 3  :  Actual game
  ---------------------------------------------------------*/
  } else if (step === 3) {
    if (gameMode === "elimination")      renderHoldToReady();
    else if (gameMode === "tasks")       renderTasksMode();
    else if (gameMode === "simple")      renderSimpleWinner();

  /* --------------------------------------------------------
     STEP 4  :  Winner screen
  ---------------------------------------------------------*/
  } else if (step === 4) {
    renderWinnerScreen();
  }
}

/* ---------- Hold-to-Ready (Elimination mode) ---------- */
function renderHoldToReady() {
  /* ← Back link (always visible on this screen) */
  const backLink = `
    <a href="#" id="back-link"
       style="text-decoration:none;
              font-size:.9em;
              display:inline-block;
              margin-bottom:6px">
      ← Back
    </a>`;

  /* is EVERYONE ready? */
  const allReady = window.roundStatus.every(Boolean);

  /* ---------- main markup ---------- */
  app.innerHTML = `
    ${backLink}
    <h2>Players – Hold Down Your Finger!</h2>

    <ul style="padding-left:0;">
      ${nicknames
        .map(
          (name, i) => `
            <li style="
                 background:${playerColors[i % playerColors.length]};
                 color:white;padding:8px 14px;border-radius:12px;
                 margin-bottom:8px;font-weight:bold;display:flex;align-items:center;">
              <span style="flex:1;">${name}</span>
              <button class="big-btn"
                      id="ready-btn-${i}"
                      style="margin-left:12px;">
                ${window.roundStatus[i] ? "Ready!" : "Hold to Ready"}
              </button>
            </li>`
        )
        .join("")}
    </ul>

    <p style="font-size:.95em;color:#555;margin-top:-8px">
      (Players must hold their button for 1&nbsp;second)
    </p>

    ${
      allReady
        ? `<button class="big-btn call-to-action" id="start-btn">
             Start Elimination
           </button>`
        : ""   /* hidden until everyone is ready */
    }
  `;

  /* ---- “← Back” handler ---- */
  const back = document.getElementById("back-link");
  if (back) {
    back.onclick = (e) => {
      e.preventDefault();
      backOneStep();          // go to previous wizard step
    };
  }

  /* -------- per-player hold-to-ready handlers -------- */
  nicknames.forEach((_, i) => {
    const btn = document.getElementById(`ready-btn-${i}`);

    /* If already ready, a long-press cancels */
    if (window.roundStatus[i]) {
      btn.onmousedown = btn.ontouchstart = (e) => {
        e.preventDefault();
        window.roundStatus[i] = false;      // un-ready this player
        renderHoldToReady();                // re-render (hides start-btn)
      };
      return;                               // skip hold logic below
    }

    /* Not ready yet → set up 1-second hold */
    btn.onmousedown = btn.ontouchstart = () => {
      holdingTimeouts[i] = setTimeout(() => {
        window.roundStatus[i] = true;       // mark ready
        renderHoldToReady();                // re-render (may show start-btn)
      }, 1000);
      btn.innerText = "Holding…";
      btn.style.background = "#20bf6b";
    };
    btn.onmouseup = btn.ontouchend = () => {
      clearTimeout(holdingTimeouts[i]);     // released too early → cancel
      btn.innerText = "Hold to Ready";
      btn.style.background = "";
    };
  });

  /* ---- Start when ALL ready ---- */
  const startBtn = document.getElementById("start-btn");
  if (startBtn) {
    startBtn.onclick = () => {
      step = 5;                 // proceed to elimination animation
      renderElimination();
    };
  }
}

// --- Elimination Animation and Logic ---
function renderElimination() {
  if (!window.remainingPlayers) window.remainingPlayers = [...nicknames];

  let highlightIdx = 0;
  app.innerHTML = `
    <h2>Eliminating...</h2>
    <ul>
      ${window.remainingPlayers
        .map(
          (name, i) => `
        <li style="background:${
          playerColors[i % playerColors.length]
        }; color:white; padding:16px; border-radius:14px; margin-bottom:8px; font-weight:bold;">
          ${name}
        </li>
      `
        )
        .join("")}
    </ul>
    <p style="color:#888;">Suspense...</p>
  `;

  const highlightInterval = setInterval(() => {
    app.innerHTML = `
      <h2>Eliminating...</h2>
      <ul>
        ${window.remainingPlayers
          .map(
            (name, i) => `
          <li style="background:${
            i === highlightIdx
              ? "#eb3b5a"
              : playerColors[i % playerColors.length]
          }; color:white; padding:16px; border-radius:14px; margin-bottom:8px; font-weight:bold; transition:background 0.3s;">
            ${name}
          </li>
        `
          )
          .join("")}
      </ul>
      <p style="color:#888;">Suspense...</p>
    `;
    highlightIdx = (highlightIdx + 1) % window.remainingPlayers.length;
  }, 110);

  setTimeout(() => {
    clearInterval(highlightInterval);
    const eliminatedIdx = Math.floor(
      Math.random() * window.remainingPlayers.length
    );
    const eliminatedName = window.remainingPlayers[eliminatedIdx];
    if (window.navigator && window.navigator.vibrate)
      window.navigator.vibrate(250);

    const filteredTasks =
      taskDifficulty === "any"
        ? tasks
        : tasks.filter((t) => t.difficulty === taskDifficulty);
    const task =
      filteredTasks[Math.floor(Math.random() * filteredTasks.length)];
    const memeImg = memes[Math.floor(Math.random() * memes.length)];

    app.innerHTML = `
      <div style="background:${
        playerColors[eliminatedIdx % playerColors.length]
      }; color:white; padding:20px; border-radius:16px; margin-bottom:18px; text-align:center; animation:flash 0.8s;">
        <h2>Eliminated Player: ${eliminatedName}</h2>
      </div>
      <h3>Task: (${task.type.toUpperCase()}) <span style="color:#555;font-size:0.85em;">[${taskDifficulty}, ${taskTime}s]</span></h3>
      <p>${task.text}</p>
      <img src="${memeImg}" alt="meme" style="max-width:220px; margin:18px auto; display:block; border-radius:12px;" onerror="this.style.display='none';" />
      ${
        window.remainingPlayers.length > 2
          ? `<button class="big-btn" id="eliminate-btn">Eliminate & Next Round</button>`
          : `<button class="big-btn" id="final-btn">Show Winner</button>`
      }
    `;

    if (window.remainingPlayers.length > 2) {
      document.getElementById("eliminate-btn").onclick = () => {
        window.remainingPlayers.splice(eliminatedIdx, 1);
        window.roundStatus = Array(window.remainingPlayers.length).fill(false);
        nicknames = [...window.remainingPlayers];
        numPlayers = window.remainingPlayers.length;
        step = 3;
        render();
      };
    } else {
      document.getElementById("final-btn").onclick = () => {
        step = 4;
        render();
      };
    }
  }, 1600);
}

// --- Simple Winner Mode ---
function renderSimpleWinner() {
  window.remainingPlayers = [...nicknames];

  let highlightIdx = 0;
  app.innerHTML = `
    <h2>Choosing Winner...</h2>
    <ul>
      ${nicknames
        .map(
          (n, i) => `
        <li style="background:${
          playerColors[i % playerColors.length]
        }; color:white; padding:16px; border-radius:14px; margin-bottom:8px; font-weight:bold;">
          ${n}
        </li>
      `
        )
        .join("")}
    </ul>
    <p style="color:#888;">Spinning...</p>
  `;

  const interval = setInterval(() => {
    app.innerHTML = `
      <h2>Choosing Winner...</h2>
      <ul>
        ${nicknames
          .map(
            (n, i) => `
          <li style="background:${
            i === highlightIdx
              ? "#20bf6b"
              : playerColors[i % playerColors.length]
          }; color:white; padding:16px; border-radius:14px; margin-bottom:8px; font-weight:bold; transition:background 0.3s;">
            ${n}
          </li>
        `
          )
          .join("")}
      </ul>
      <p style="color:#888;">Spinning...</p>
    `;
    highlightIdx = (highlightIdx + 1) % nicknames.length;
  }, 120);

  setTimeout(() => {
    clearInterval(interval);
    const winnerIdx = Math.floor(Math.random() * nicknames.length);
    const winner = nicknames[winnerIdx];

    if (typeof confetti === "function") {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.7 },
        colors: playerColors,
      });
    }
    if (window.navigator && window.navigator.vibrate)
      window.navigator.vibrate([200, 100, 200]);

    app.innerHTML = `
      <div class="confetti">🎉</div>
      <h2 class="winner-pop">Winner: ${winner} 🎉</h2>
      <button class="big-btn" id="restart-btn">Restart Game</button>
    `;
    document.getElementById("restart-btn").onclick = () => {
      window.remainingPlayers = null;
      window.roundStatus = null;
      nicknames = [];
      currentTask = null;
      step = 0;
      render();
    };
  }, 1800);
}

// --- Tasks Mode (everyone gets a random task, no elimination) ---
function renderTasksMode() {
  const filteredTasks =
    taskDifficulty === "any"
      ? tasks
      : tasks.filter((t) => t.difficulty === taskDifficulty);

  if (!currentTask) {
    currentTask = nicknames.map(
      () => filteredTasks[Math.floor(Math.random() * filteredTasks.length)]
    );
  }

  app.innerHTML = `
    <h2>Random Tasks for Everyone!</h2>
    <ul>
      ${nicknames
        .map(
          (n, i) => `
        <li class="task-card" style="background:${
          playerColors[i % playerColors.length]
        }; color:white; padding:14px; border-radius:10px; margin-bottom:10px;">
          <strong>${n}</strong>:<br/>
          <em>${currentTask[
            i
          ].type.toUpperCase()} (${taskDifficulty}, ${taskTime}s)</em><br/>
          ${currentTask[i].text}
        </li>
      `
        )
        .join("")}
    </ul>
    <button class="big-btn" id="restart-btn">Restart Game</button>
  `;
  document.getElementById("restart-btn").onclick = () => {
    currentTask = null;
    window.remainingPlayers = null;
    window.roundStatus = null;
    nicknames = [];
    step = 0;
    render();
  };
}

// --- Winner Screen (for Elimination Mode) ---
function renderWinnerScreen() {
  const winner = window.remainingPlayers[0];
  winStats[winner] = (winStats[winner] || 0) + 1;
  localStorage.setItem("nfact-winStats", JSON.stringify(winStats));

  const leaderboardHTML = `
    <h3>Leaderboard</h3>
    <ol>
      ${Object.entries(winStats)
        .sort((a, b) => b[1] - a[1])
        .map(([name, wins]) => `<li>${name}: ${wins} wins</li>`)
        .join("")}
    </ol>
  `;

  if (typeof confetti === "function") {
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.7 },
      colors: playerColors,
    });
  }
  if (navigator.vibrate) navigator.vibrate([100, 200, 300]);

  app.innerHTML = `
    <div class="confetti">🎉</div>
    <h2 class="winner-pop">Winner: ${winner} 🎉</h2>
    ${leaderboardHTML}
    <button class="big-btn" id="restart-btn">Restart Game</button>
  `;

  /* -------- share button (only if supported) -------- */
  if (navigator.share) {
    app.insertAdjacentHTML(
      "beforeend",
      `<button class="big-btn" id="share-btn">Share Game 🔗</button>`
    );
    document.getElementById("share-btn").onclick = () => {
      navigator.share({
        title: "Finger Game",
        url: window.location.href,
      });
    };
  }
  /* -------------------------------------------------- */

  document.getElementById("restart-btn").onclick = () => {
    window.remainingPlayers = null;
    window.roundStatus = null;
    nicknames = [];
    currentTask = null;
    step = 0;
    render();
  };
}

// --- Start the game (wait for all 3 datasets) ---
Promise.all([fetchTasks(), fetchMemes(), fetchBadWords()])
  .then(() => {
    purgeBadWinners(); // remove stored offensive names
    render(); // show UI
  })
  .catch((err) => {
    console.error(err);
    app.innerHTML = `<p style="color:red;padding:20px">Failed to load data:<br>${err}</p>`;
  });
