# ⚡ Velocity Global Solutions
### Real-Time Client Project Dashboard — Role-Based Agency Operations Engine

> A production-grade full-stack application built for a small agency to manage client projects, track task progress in real-time, and monitor team activity through WebSocket live feeds — with strict role-based access control enforced at every layer.

---

## 📸 Overview

**Velocity Global Solutions** is an internal agency operations dashboard with three distinct role-isolated workstations. Each role sees a completely different interface, enforced both at the API middleware level and the React routing level.

| Role | What they see |
|------|--------------|
| **Admin** | Global agency overview — all clients, all projects, all users, live presence, full activity feed |
| **Project Manager** | Only their managed projects and assigned team tasks — scoped activity feed |
| **Developer** | Only their personally assigned tasks — zero cross-developer visibility |

---

## 🚀 Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express.js + TypeScript |
| Database ORM | Prisma (PostgreSQL) |
| Authentication | JWT (Access Token 15min + Refresh Token 7d HttpOnly Cookie) |
| Real-Time | Socket.io (WebSocket with polling fallback) |
| Background Jobs | node-cron (overdue task scanner, runs every minute) |
| Validation | Zod schema validators |
| Password Hashing | bcryptjs |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Routing | React Router v6 |
| HTTP Client | Axios (with JWT refresh interceptor) |
| Real-Time | Socket.io-client |
| State | React Context (Auth, Socket, Notifications) |
| Styling | Vanilla CSS with custom design system (no Tailwind) |
| Icons | Lucide React |

### Infrastructure
| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL |
| Container | Docker Compose (database only) |
| Dev Proxy | Vite proxy (`/api` → `localhost:5000`) |

---

## 🏗️ Architecture

```
velocity-global-solutions/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema & indexes
│   │   └── seed.ts              # Demo data seeder
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts           # Typed environment variables
│   │   ├── controllers/         # Route handlers (auth, users, projects, tasks, clients, dashboard, activities)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT verification
│   │   │   └── role.middleware.ts    # RBAC enforcement
│   │   ├── routes/              # Express routers
│   │   ├── services/
│   │   │   ├── socket.service.ts    # Socket.io connection manager & event emitter
│   │   │   └── cron.service.ts      # Overdue task background scanner
│   │   ├── validators/          # Zod validation schemas
│   │   └── index.ts             # Express + Socket.io server entry
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI: Sidebar, Navbar, StatCard, ActivityFeed, Badges, Modals, FilterBar
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # JWT auth state + silent refresh
│   │   │   ├── SocketContext.tsx    # Socket.io connection + real-time event listeners
│   │   │   └── NotificationContext.tsx  # In-app notification state
│   │   ├── pages/               # AdminDashboard, PMDashboard, DeveloperDashboard, ProjectsList, ProjectDetails, TasksPage, ClientsPage, Login
│   │   ├── services/
│   │   │   └── api.ts           # Axios instance with 401 refresh interceptor
│   │   ├── types/               # Shared TypeScript interfaces
│   │   └── index.css            # Full CSS design system (variables, layout, components)
├── docker-compose.yml
└── README.md
```

---

## 🔐 Authentication System

### Flow
```
Login → POST /api/auth/login
     → Server returns: accessToken (JSON body) + refreshToken (HttpOnly cookie)
     → Frontend stores accessToken in memory (AuthContext state)
     → On 401: Axios interceptor auto-calls POST /api/auth/refresh
              → Server validates HttpOnly cookie → returns new accessToken
     → Logout: POST /api/auth/logout → clears HttpOnly cookie server-side
```

### Security Design Choices
- **Access token in memory** — not localStorage, prevents XSS theft
- **Refresh token in `HttpOnly` + `SameSite=Lax` cookie** — JavaScript cannot access it
- **Role middleware on every protected route** — `requireRole('ADMIN')` enforced at API level, not just UI

---

## 🔑 Login Credentials

All seeded accounts use the password: **`Password123!`**

| Role | Email | Name |
|------|-------|------|
| Admin | `admin@agency.com` | Alex Vance |
| Project Manager | `sarah.pm@agency.com` | Sarah Connor |
| Project Manager | `mike.pm@agency.com` | Mike Ross |
| Developer | `ravi.dev@agency.com` | Ravi Sharma |
| Developer | `priya.dev@agency.com` | Priya Patel |
| Developer | `david.dev@agency.com` | David Kim |
| Developer | `elena.dev@agency.com` | Elena Rostova |

---

## ⚡ Real-Time WebSocket Events

The backend emits Socket.io events to specific rooms based on role scope:

| Event | Room(s) | Triggered When |
|-------|---------|---------------|
| `activity:new` | `role:admin`, `project:<id>`, `user:<id>` | Any task/project action |
| `task:updated` | `project:<id>`, `user:<id>` | Task status changed |
| `task:overdue` | `role:admin`, `role:pm`, `user:<assigneeId>` | Cron detects overdue task |
| `notification:new` | `user:<id>` | Assignment, review, overdue alert |
| `presence:update` | `role:admin` | User connects / disconnects |

Each user joins rooms based on their role on WebSocket connect:
- **Admin** → `role:admin` + all project rooms
- **PM** → `role:pm` + their project rooms
- **Developer** → their `user:<id>` room only

---

## 📊 Database Schema

```
User ──────────────────────────────────────────────────┐
 ├── role: ADMIN | PROJECT_MANAGER | DEVELOPER          │
 ├── manages ──────────────► Project                    │
 ├── assignedTasks ─────────► Task                      │
 ├── createdTasks ──────────► Task                      │
 ├── activityLogs ─────────► ActivityLog                │
 ├── notifications ────────► Notification               │
 └── refreshTokens ────────► RefreshToken               │
                                                        │
Client ──────────────────────────────────────────────── │
 └── projects ──────────────► Project                   │
                               ├── tasks ──► Task        │
                               └── activityLogs ─► ActivityLog
```

### Indexing Strategy
- `Task`: indexed on `projectId`, `assigneeId`, `status`, `priority`, `dueDate`, `isOverdue`
- `ActivityLog`: indexed on `projectId`, `taskId`, `createdAt`
- `Notification`: indexed on `userId + isRead` (composite, for unread count queries)

---

## 🛠️ Local Setup

### Prerequisites
- **Node.js v18+**
- **npm 10+**
- **PostgreSQL** running locally OR **Docker Desktop**

---

### Step 1 — Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd velocity-global-solutions
```

---

### Step 2 — Environment Variables

**Backend** — create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/velocity_db"
JWT_ACCESS_SECRET="your-super-secret-access-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

---

### Step 3 — Start PostgreSQL

**Option A — Docker (recommended):**
```bash
# From project root
docker-compose up -d
```

**Option B — Local PostgreSQL:**
Create a database named `velocity_db` and update `DATABASE_URL` in `backend/.env`.

---

### Step 4 — Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Push schema to database
npx prisma db push

# Seed demo data (users, clients, projects, tasks, activities)
npx tsx prisma/seed.ts

# Start development server (port 5000)
npm run dev
```

---

### Step 5 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (port 5173)
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login, returns access token + sets refresh cookie |
| POST | `/api/auth/refresh` | Public | Silently refresh access token via HttpOnly cookie |
| POST | `/api/auth/logout` | Auth | Clear refresh token cookie |
| GET | `/api/auth/me` | Auth | Get current authenticated user |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Auth | List projects (scoped by role) |
| POST | `/api/projects` | Admin, PM | Create new project |
| GET | `/api/projects/:id` | Auth | Get project with tasks |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Auth | List tasks with URL-based filters |
| POST | `/api/tasks` | Admin, PM | Create new task |
| PATCH | `/api/tasks/:id/status` | Auth | Update task status |
| PUT | `/api/tasks/:id` | Admin, PM | Full task update |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard/admin` | Admin | Global stats, task breakdown |
| GET | `/api/dashboard/pm` | PM | Managed projects, overdue, upcoming |
| GET | `/api/dashboard/developer` | Developer | Assigned tasks, stats |

### Other
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/clients` | Admin, PM | List all clients |
| POST | `/api/clients` | Admin, PM | Create new client |
| GET | `/api/activities` | Auth | Paginated activity log (scoped) |
| GET | `/api/notifications` | Auth | User notifications |
| GET | `/api/users` | Admin, PM | List users (filter by role) |

---

## 🎨 UI Features

- **Dark design system** — custom CSS variables, zero Tailwind dependencies
- **Role-isolated dashboards** — completely different UI per role
- **Priority-bordered task cards** — red (Critical), amber (High), indigo (Medium), green (Low)
- **Segmented status controls** — one-click task status updates (To Do → In Progress → In Review → Done)
- **URL-synced filters** — shareable filtered task URLs with `?status=IN_PROGRESS&priority=HIGH`
- **Live activity feed** — real-time WebSocket events with user avatars, time-ago timestamps
- **Sticky activity sidebar** — always visible while scrolling task queue
- **Overdue indicators** — pulsing red badge on overdue tasks, detected by background cron

---

## ⚙️ Background Cron Job

A `node-cron` job runs every minute on the backend:

```
Every 1 minute:
  1. Find all tasks WHERE dueDate < NOW() AND isOverdue = false
  2. Batch UPDATE isOverdue = true
  3. Create Notification records for each assignee
  4. Emit socket.io event task:overdue to admin, PM, and assignee rooms
```

This keeps overdue state eventually consistent without requiring frontend polling.

---

## 🏛️ Key Engineering Decisions

### 1. Socket.io Rooms for Role Isolation
Instead of broadcasting all events to all connected users, each user joins scoped rooms:
```
Admin   → "role:admin" + all project rooms
PM      → "role:pm" + their project rooms only
Dev     → "user:<userId>" room only
```
This ensures developers **never** receive task events from other projects.

### 2. HttpOnly Cookie for Refresh Token
The long-lived refresh token (7 days) is stored in an `HttpOnly` cookie, making it **inaccessible to JavaScript**. This prevents XSS attacks from stealing the token. The short-lived access token (15 min) lives only in memory (React state).

### 3. Axios 401 Interceptor for Silent Refresh
The `api.ts` service has a response interceptor that catches `401 Unauthorized` errors, calls `/api/auth/refresh`, and retries the original request — giving users a seamless experience without being logged out mid-session.

### 4. node-cron Over BullMQ
For periodic time-window scans (overdue checking), `node-cron` is optimal — zero external dependencies, runs in-process. BullMQ/Redis would be overkill and add infrastructure requirements for what is essentially a scheduled `UPDATE` query.

---

## ⚠️ Known Limitations

1. **In-memory socket state**: Socket presence is stored per-process. For horizontal scaling across multiple Node instances, `@socket.io/redis-adapter` would be required.
2. **1-minute overdue resolution**: The cron runs every 60 seconds, so a task becomes "overdue" up to 60 seconds after its due time — acceptable for project management context.
3. **No file uploads**: Task attachments/screenshots are out of scope for this version.
4. **No email notifications**: Notifications are in-app only via Socket.io; email delivery (Nodemailer/SendGrid) would be a production add-on.

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Full database schema with indexes |
| `backend/prisma/seed.ts` | Seeds all demo users, clients, projects, tasks |
| `backend/src/services/socket.service.ts` | Socket.io room management & event emission |
| `backend/src/services/cron.service.ts` | Background overdue scanner |
| `backend/src/middleware/role.middleware.ts` | RBAC enforcement middleware |
| `frontend/src/context/AuthContext.tsx` | JWT state + silent token refresh |
| `frontend/src/context/SocketContext.tsx` | Socket.io client connection + real-time listeners |
| `frontend/src/services/api.ts` | Axios client with 401 interceptor |
| `frontend/src/index.css` | Full dark CSS design system |

---

## 👤 Author

Built as part of the **Internshala Full-Stack Development Assignment** — demonstrating production-level engineering judgment in authentication security, real-time architecture, role-scoped data access, and modern UI design systems.
