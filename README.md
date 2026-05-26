# VedaAI — AI Assessment Creator

A full-stack AI-powered assessment creation system for teachers. Generate structured, curriculum-appropriate question papers using Claude AI — with real-time background processing, WebSocket updates, and PDF export.

---

## 🏗 Architecture Overview

```
┌────────────────┐     HTTP/REST      ┌──────────────────────────────────────┐
│  Next.js 14    │ ─────────────────► │  Express + TypeScript (Node.js)      │
│  (Frontend)    │                    │                                      │
│                │ ◄──────────────── │  Routes → Controllers → Services     │
│  Redux Toolkit │   WebSocket (WS)   │                                      │
│  + React 18    │                    │  ┌──────────┐  ┌──────────────────┐  │
└────────────────┘                    │  │ MongoDB  │  │ Redis (cache +   │  │
                                      │  │ (data)   │  │  BullMQ jobs)    │  │
                                      │  └──────────┘  └──────────────────┘  │
                                      │                                      │
                                      │  BullMQ Worker ──► Anthropic Claude  │
                                      └──────────────────────────────────────┘
```

### Request Flow
1. Teacher fills form → Frontend dispatches Redux action
2. POST `/api/assignments` → Express validates → saves to MongoDB
3. Job added to **BullMQ** queue (backed by Redis)
4. **BullMQ Worker** picks up job → calls **Anthropic Claude API** (streaming)
5. Progress broadcast via **WebSocket** in real time
6. Completed paper saved to MongoDB
7. Frontend navigates to output page via WS event or polling fallback

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| State | Redux Toolkit |
| Realtime | WebSocket (ws) |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Cache/Queue | Redis + BullMQ |
| AI | Anthropic Claude (claude-sonnet-4) |
| PDF | PDFKit |
| Containers | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Anthropic API key → https://console.anthropic.com

---

### Option A: Local Development (No Docker)

**1. Clone & install**
```bash
git clone <repo>
cd vedaai
npm run install:all
```

**2. Configure backend**
```bash
cd backend
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

**3. Configure frontend**
```bash
cd frontend
cp .env.local.example .env.local
# Defaults point to localhost:4000 — no changes needed for local dev
```

**4. Start MongoDB and Redis** (if not running)
```bash
# MongoDB
mongod --dbpath /usr/local/var/mongodb

# Redis
redis-server
```

**5. Run backend**
```bash
cd backend
npm run dev
# API:       http://localhost:4000
# WebSocket: ws://localhost:4001
```

**6. Run frontend** (new terminal)
```bash
cd frontend
npm run dev
# App: http://localhost:3000
```

---

### Option B: Docker Compose (Recommended)

```bash
# 1. Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# 2. Start everything
docker-compose up -d

# 3. Open http://localhost:3000
```

All services start automatically: MongoDB, Redis, Backend (API + Worker), Frontend.

---

## 📁 Project Structure

```
vedaai/
├── backend/
│   └── src/
│       ├── controllers/     # Request handlers
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Express routers
│       ├── services/
│       │   ├── aiService.ts      # Anthropic API + prompt builder
│       │   ├── queueService.ts   # BullMQ queue + worker
│       │   └── pdfService.ts     # PDFKit generation
│       ├── middleware/      # Validation
│       ├── utils/
│       │   ├── redis.ts         # Redis client + cache helpers
│       │   └── websocket.ts     # WS server + broadcast
│       └── index.ts         # App entry point
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── assignments/
│       │   │   ├── page.tsx          # Assignment list
│       │   │   ├── create/page.tsx   # Creation wizard
│       │   │   ├── generating/[id]/  # Live progress page
│       │   │   └── [id]/page.tsx     # Output / paper view
│       │   └── layout.tsx
│       ├── components/layout/  # Sidebar, Topbar
│       ├── hooks/
│       │   ├── useWebSocket.ts  # WS connection + Redux sync
│       │   └── useTypedSelector.ts
│       ├── store/
│       │   └── slices/assignmentsSlice.ts
│       ├── types/           # Shared TypeScript interfaces
│       └── utils/api.ts     # Axios client
│
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assignments` | List all assignments |
| POST | `/api/assignments` | Create + queue generation |
| GET | `/api/assignments/:id` | Get assignment + paper |
| GET | `/api/assignments/:id/status` | Poll job status |
| DELETE | `/api/assignments/:id` | Delete assignment |
| GET | `/api/assignments/:id/pdf` | Download PDF |
| GET | `/api/health` | Health check |

**WebSocket** — connect to `ws://localhost:4001?assignmentId=<id>`

Messages: `CONNECTED`, `JOB_PROGRESS`, `JOB_COMPLETE`, `JOB_ERROR`

---

## ✨ Features

- **Multi-step creation wizard** — file upload, question types, marks, instructions
- **Real-time generation** — WebSocket progress with step-by-step updates + polling fallback
- **Structured AI output** — sections A/B/C, difficulty badges (Easy/Medium/Hard), marks
- **Background jobs** — BullMQ with Redis, retry on failure, concurrency control
- **Redis caching** — assignment list and individual papers cached for 5 minutes
- **PDF download** — server-side PDFKit generation with proper formatting
- **Redux state** — all assignment state in Redux, WebSocket events sync to store
- **Validation** — Express-validator on backend, form validation on frontend
- **Docker ready** — single `docker-compose up` starts everything

---

## 🎨 Design

Faithful implementation of the Figma designs:
- Dark sidebar (`#1A1A1A`) with orange (`#E8510A`) accent
- DM Sans + DM Serif Display typography
- Card-based layout with subtle shadows
- Responsive grid (2-col desktop → 1-col mobile)

---

## 📝 Environment Variables

### Backend (`.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP server port |
| `WS_PORT` | `4001` | WebSocket port |
| `MONGODB_URI` | `mongodb://localhost:27017/vedaai` | MongoDB connection |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `ANTHROPIC_API_KEY` | — | **Required** — your API key |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |

### Frontend (`.env.local`)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:4001` | WebSocket URL |

---

## 🔒 Notes

- File uploads stored in `backend/uploads/` (max 5MB, PDF/image only)
- Rate limited: 100 requests per 15 minutes per IP on `/api/*`
- BullMQ worker runs in-process (same Node.js instance) — for production, run as a separate process with `npm run worker`
- Redis is optional — if unavailable, caching is silently disabled; BullMQ requires Redis
