# AGENTS.md - StayHub Frontend

## Stack
Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui

## Structure
```
app/           → Pages (file-based routing)
  login/       → Auth page
components/    → React components
  ui/          → shadcn primitives (don't edit)
  auth-form.tsx→ Login/signup form
hooks/         → Custom React hooks
  use-auth.ts  → Auth state & API calls
lib/           → Utilities & services
  api/         → API layer
    client.ts  → HTTP client (uses NEXT_PUBLIC_API_URL)
    auth.ts    → Auth endpoints (login, signup)
  utils.ts     → Helpers (cn for classnames)
styles/        → Global CSS
public/        → Static assets
openapi.yaml   → API contract (source of truth)
```

## Conventions
- `"use client"` for interactive components
- useCallback for handlers passed as props
- Types in same file or colocated `.types.ts`
- API: all calls through `lib/api/client.ts`
- Env: `NEXT_PUBLIC_*` for client-side vars

## Commands
```bash
bun dev      # Dev server :3000
bun build    # Production build
bun lint     # ESLint
```

## API
Base URL: `NEXT_PUBLIC_API_URL` (see `.env.example`)
Contract: `openapi.yaml`
