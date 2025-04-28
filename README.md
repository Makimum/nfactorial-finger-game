# ✨ Finger Game (ɴ-factorial bootcamp)

Playful “last-finger-standing” web-app for quick ice-breaker rounds with friends.

[Live demo on Vercel](https://nfactorialfingerfrontend.vercel.app/) • [REST API on Render](https://nfactorial-backend.onrender.com)

---

## 📷 Quick Glimpse

| Mobile | Desktop |
|--------|---------|
| ![screenshot-mobile](./shots/mobile.png) | ![screenshot-desktop](./shots/desktop.png) |

---

## 🎮 Gameplay Flow

1. **Game settings** – pick mode, task difficulty & time.  
2. **Players** – choose number of people (dropdown + custom).  
3. **Nicknames** – rude words auto-blocked.  
4. **Hold-to-Ready** – long-press 1s → “Ready!”.  
5. **Elimination spin** → random player out + task + meme.  
6. Last player = **Winner** → global leaderboard (Airtable).  
7. Share sheet (mobile) + Restart.

---

## ✨ Features

- **3 modes** – Simple / Tasks / Elimination.  
- **Task / Meme / Profanity** data served from backend.  
- **Hold-to-Ready UX** with “hold to cancel”.  
- Responsive card (90vw max-480).  
- **Global leaderboard** – Airtable API (no auth UI required).  
- PWA-ready meta tags & `navigator.share()` for 1-tap invites.

---

## 🛠️ Tech Stack

| Layer          | What & Why                           |
|----------------|--------------------------------------|
| Frontend       | Vanilla JS (single `index.mjs`) + CSS |
| Backend (API)  | Node + Express 4                     |
| Database       | **Airtable** REST (personal token)   |
| Dev/Deploy     | GitHub → Render (API) + Vercel (UI)  |

---

## 🚀 Running Locally

```bash
# 1 . clone
git clone https://github.com/✏️yourname/nfactorial-finger-game
cd nfactorial-finger-game

# 2 . backend
cd backend
npm i
# copy .env.example → .env and add Airtable creds
npm start          # http://localhost:4000

# 3 . frontend (in another terminal)
cd ../frontend
npx serve .        # http://localhost:3000 (or any static server)
Airtable Usage
Airtable acts as a global leaderboard database, tracking player wins, game results, and activity statistics.
Every finished game submits player data — including nickname, time spent, result, restart count, and shared results — to Airtable via a secure backend API.
Using Airtable allowed for quick setup without heavy database management like PostgreSQL, making development faster and more flexible during the limited project time.
Airtable's web interface enables easy manual sorting, filtering, and reviewing of game data, helping to analyze player behavior and engagement trends efficiently.
Future improvements could include live leaderboard updates in the frontend directly by fetching from Airtable.

⚖️ Tradeoffs Made
LocalStorage First, Then Airtable:
Initial leaderboard stats were stored in LocalStorage for simplicity. Later, global tracking was added via Airtable API without introducing complex database management.

Airtable Instead of Full Database (e.g., PostgreSQL):
Airtable provided a quick, flexible way to store and view player data during development without needing to design or host a full relational database.

No Full Authentication:
Players only submit nicknames. Skipping user account creation kept the app fast to use and reduced development time.

Focus on Core Gameplay Over Advanced Features:
The priority was delivering smooth gameplay (Hold-to-Ready, elimination animations, win detection) rather than building AI-generated tasks or advanced analytics during the limited time frame.

🐛 Current Limitations
Multiple Submission Bug:
When clicking the "Show Winner" button multiple times, multiple Airtable requests are sent. This can cause incorrect statistics.

Basic Profanity Filtering:
The current bad words list is static. More sophisticated filtering using AI or dynamic lists would better prevent inappropriate nicknames.

Limited Meme Collection:
Only a few memes are currently used. No automatic generation or uploading of new memes from sources like Imgur has been implemented yet.

Basic Visual Design:
Some elements (such as Call-to-Action buttons) could be styled better to enhance clarity and user experience.

Analytics Not Fully Implemented:
Although Airtable records gameplay data, integration with Google Analytics for deeper tracking (session time, button clicks, engagement) was planned but not completed.

🌟 Future Vision and Expansion Ideas
Profile System:
Add personal accounts with avatars/icons. Players would have their own profiles with history, badges, and achievements.

Competitive Weekly Leaderboards:
Create weekly resettable leaderboards with prizes for top players (based on time spent, wins, etc.). Award special badges to "Top 1" or "Top 10" players.

Truth or Dare / Category Modes:
Introduce multiple game modes with different rules, including level-based "pass and win" systems.

In-Game Economy:
Introduce points, coins, or skins (similar to Roblox). Allow players to win or purchase profile customizations and cosmetic upgrades.

Weighted Probability Betting System:
Implement a strategic betting mechanism inside the game, where players can "bet" in-game currency to slightly increase their chances (without ever guaranteeing a win).

Prediction Games with Crypto Rates:
Build alternative prediction games based on Solana or Bitcoin price movements ("long" or "short" bets with virtual rewards).

Referral and Social Systems:
Integrate social features like referral bonuses, ingame promotions, and leaderboard rankings for most active players.

🏆 Personal Reflection
Due to a tight timeline (CEESA Math Competition trip and incubator challenge overlap), the project was built within approximately 2 full working days.
Despite this, the app progressed from a simple concept to a working web product with backend, database integration, and live deployment — a major accomplishment given the constraints.
The brainstorming and planning work done during the process lays a solid foundation for future development beyond this challenge.
## Demo Video

Watch the demo here: [Loom Video](https://www.loom.com/share/2fd8fa40be58431fb3f2ddd7336a0416?sid=5555c24c-46c4-4707-9937-e13ddbee0699)
