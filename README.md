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

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

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

## Backend Integration

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` when the Node.js backend is ready.

Mock data in `src/lib/mock-data.ts` will be replaced with TanStack Query hooks calling the REST API.
