# Skill Registry — stay-hub-front

## Project Standards (Compact Rules)

### Stack
- Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + shadcn/ui
- All API calls through `lib/api/client.ts` (apiClient)
- `"use client"` on all interactive components
- Types colocated in same file; no separate .types.ts unless shared
- No test runner — skip test generation

### Code Conventions
- shadcn/ui components in `components/ui/` are READ ONLY
- New feature components go in `components/dashboard/` or `components/`
- New API functions go in `lib/api/{domain}.ts`
- New hooks go in `hooks/use-{name}.ts`
- Auth session via `useSession()` hook — never access localStorage directly
- API contract source of truth: `openapi.yaml`

### Quality
- Run `npx tsc --noEmit` after changes to verify no type errors
- No mock data in production code (lib/dashboard/mock-data.ts has types only)
- No developer-speak visible to users (no JWT, OpenAPI, endpoint references in UI text)

## Convention Files
- AGENTS.md — project conventions index
- openapi.yaml — API contract

## User Skills
No user-level skills detected.
