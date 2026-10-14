# ZentroSure Frontend

Automotive Workshop ERP — React + TypeScript + Vite frontend.

## Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **React Router v7** for routing
- **TanStack Query** for data fetching (ready for backend)
- **React Hook Form + Zod** for form validation
- **Recharts** for dashboard analytics
- **Radix UI** primitives for accessible components
- **Lucide React** for icons

## Getting Started (frontend-only on localhost)

No backend is required for day-to-day UI testing. The app runs in **local API mode**: login, dashboard, workshop flows, and CRUD-style actions use **browser `localStorage`** (`zs_local_db_v1`).

```bash
# Install dependencies
npm install

# Copy env (local mode is the default in .env.example)
copy .env.example .env

# Start development server → http://localhost:5173
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

| Variable | Purpose |
|----------|---------|
| `VITE_USE_LOCAL_API=true` | All API calls stay in the browser (default for testing) |
| `VITE_USE_LOCAL_API=false` | Use a real API at `VITE_API_BASE_URL` when the backend is ready |

To reset demo data: DevTools → Application → Local Storage → delete `zs_local_db_v1` and sign in again.

## Project Structure

```
src/
├── components/
│   ├── ui/              # Design system (Button, Input, Card, Badge, Logo)
│   ├── layout/          # AppShell, Sidebar, TopBar, PublicLayout
│   └── service-visit/   # Service Visit Workspace components
├── pages/
│   ├── public/          # Landing page
│   ├── auth/            # Login
│   └── app/             # Dashboard, modules, CRM, WIP
├── lib/                 # Utils, constants, mock data
├── types/               # TypeScript interfaces
└── routes/              # Route definitions
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Public landing page |
| `/login` | Authentication |
| `/app/dashboard` | Main dashboard |
| `/app/workshop/*` | Workshop modules |
| `/app/parts/*` | Parts & inventory |
| `/app/purchase/*` | Procurement |
| `/app/billing/*` | Sales & billing |
| `/app/crm/*` | Customer CRM |
| `/app/service-visits/:id/:stage` | Service Visit Workspace |

## Demo Login

- **Tenant Code:** DEMO-MOTORS
- **Email:** rajesh@demomotors.com
- **Password:** demo1234

## Design System

| Token | Value |
|-------|-------|
| Primary Yellow | `#FFC400` |
| Dark Charcoal | `#171717` |
| Background Grey | `#F6F7F9` |
| Text | `#202124` |
| Font | Poppins |

## Connect local Backend (your machine only)

Committed repos stay in **demo mode** by default. To use the real API locally:

```bash
cp .env.local.example .env.local
```

`.env.local` is **gitignored** — never pushed.

```env
VITE_USE_LOCAL_API=false
VITE_API_BASE_URL=/api/v1
```

Start [Backend](../Backend) (`docker compose up -d`, `npm run db:seed`, `npm run dev`), then `npm run dev` here.

See Backend [LOCAL_FULL_STACK.md](../Backend/docs/LOCAL_FULL_STACK.md).
