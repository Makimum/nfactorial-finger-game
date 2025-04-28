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
4. **Hold-to-Ready** – long-press 1 s → “Ready!”.  
5. **Elimination spin** → random player out + task + meme.  
6. Last player = **Winner** → global leaderboard (Airtable).  
7. Share sheet (mobile) + Restart.

---

## ✨ Features

- **3 modes** – Simple / Tasks / Elimination.  
- **Task / Meme / Profanity** data served from backend.  
- **Hold-to-Ready UX** with “hold to cancel”.  
- Responsive card (90 vw max-480).  
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
