# 🎮 Game Zone (StudyPulse & Secret Vault)

An interactive HTML5 Arcade Game Zone & Real-Time Encrypted Vault Chat application built with **Next.js 16**, **Socket.IO**, **TailwindCSS**, and **Supabase**.

🌐 **Live Demo:** [https://game-zone-rb8y.onrender.com/](https://game-zone-rb8y.onrender.com/)

---

## ✨ Features

- 👾 **Classic HTML5 Arcade Collection:**
  - **Space Invaders:** Defend Earth from marching alien grids with synthesized audio & bunker shields.
  - **Classic Tetris:** 10x20 grid with smooth rotation, drop, line clearing & score tracking.
  - **Snake:** Retro arcade classic with high-score storage and D-pad touch controls.
  - **Pacman:** Grid-based arcade maze action.
  - **Asteroids:** Vector space shooter with propulsion physics & particle effects.
  - **2048, Hextris, Breakout, Tower, Sinuous, Clumsy Bird.**
- 🔐 **Real-Time Encrypted Secret Vault Chat:**
  - End-to-end encrypted messaging via WebSocket (`<5ms` latency) powered by Socket.IO.
  - Presence indicators, typing indicators, read receipts, and audio notes.
  - Persistent message history backed by Supabase REST API.
- 📱 **Responsive & Touch-Friendly:** Custom D-pads and action buttons designed for desktop and mobile web browsers.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Real-time Server:** Node.js HTTP Server + [Socket.IO 4](https://socket.io/) (`server.mjs`)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL REST API)
- **Styling:** Vanilla CSS & TailwindCSS v4
- **Testing:** Vitest

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 20 or higher
- `pnpm` (or `npm`)

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
SUPABASE_URL=https://ckmtgahxxtlwhxnifnym.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_VALID_PASSCODES=9877,7788
NEXT_PUBLIC_SECRET_MASTER_KEY=e4d29f81a73b0c5e62f941088d37c5a2e9140b68d712f5a34e89201bc6f4831a
NODE_ENV=development
```

### 3. Run Development Server
```bash
# Install dependencies
pnpm install

# Start local server with Socket.IO support
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run test suite via Vitest:

```bash
pnpm test
```

---

## ☁️ Deployment

Deployed on **Render.com** as a Node.js Web Service running `node server.mjs`.

- **Build Command:** `pnpm install --frozen-lockfile; pnpm run build`
- **Start Command:** `node server.mjs`
