# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"ClasesYa" — a marketplace for private tutoring (Next.js 14 App Router + PostgreSQL via Prisma). All domain naming, UI text, comments, and API responses are in **Spanish**; keep new code consistent with that.

## Commands

```bash
npm run dev          # dev server on http://localhost:3000
npm run build        # production build (output: standalone)
npm run lint         # ESLint (next lint)

npx prisma db push   # sync schema to the database (no migration files are used)
npx prisma db seed   # seed test data (runs prisma/seed.js; wipes existing rows first)
npx prisma generate  # regenerate client after schema changes

docker compose up --build   # full stack: Next.js + PostgreSQL (prod-style)
```

There is no test framework configured.

Local dev requires a `.env` with `DATABASE_URL` (PostgreSQL) and `JWT_SECRET` (see `.env.example` — its `DATABASE_URL` host `postgres` is for Docker; use `localhost` when running outside Docker). Seeded users all have password `123456` (e.g. `maria@ejemplo.com` PROFESOR).

## Architecture

**Client pages → API routes → Prisma.** Pages under `src/app/` are almost all `"use client"` components that fetch JSON from the API routes under `src/app/api/`. There is no server-component data fetching; new features should follow this pattern.

**Auth** (`src/lib/auth.ts`): stateless JWT (jose, HS256, 7-day expiry) stored in an httpOnly cookie named `token`. There is no middleware — every API route enforces auth itself by calling `obtenerUsuarioActual()` (which also re-checks `usuario.activo` in the DB) and then checks `payload.rol` (`PROFESOR` | `ESTUDIANTE` | `ADMIN`) for role-gated actions. Client pages redirect based on `/api/auth/me`.

**Validation** (`src/lib/validations.ts`): all Zod schemas live here and are shared by API routes (via `schema.safeParse(body)` → 400 with `detalles: error.flatten().fieldErrors`) and forms. Add new schemas here rather than inline.

**Database** (`prisma/schema.prisma`): models use camelCase fields mapped to snake_case columns (`@map`) and Spanish table names (`@@map`). Key domain rules encoded in the schema and API layer:
- `Usuario` plays both roles: as profesor it owns `Servicio` + `Disponibilidad`; as estudiante it owns `Reserva`.
- `Reserva` links a `Servicio` to an estudiante; state machine PENDIENTE → CONFIRMADA → COMPLETADA (or CANCELADA). One optional `Resena` and `Pago` per reserva.
- Times are stored as `"HH:mm"` strings; `Disponibilidad.diaSemana` uses **0=Lunes … 6=Domingo** (convert from JS `getDay()` with `(d + 6) % 7`). Reservation creation in `src/app/api/reservas/route.ts` validates availability and overlap for both parties — mirror those checks when touching scheduling logic.
- Schema changes are applied with `prisma db push` (also run automatically by `entrypoint.sh` on Docker startup) — do not create migration files.

**API conventions**: routes return `NextResponse.json` with Spanish `error`/`mensaje` keys and explicit status codes (401 no auth, 403 wrong rol, 400 validation, 409 conflict). List endpoints paginate via `?pagina=&porPagina=` and return a `paginacion` object. Prisma queries use narrow `select`s (never return `password`).

**UI**: shared primitives in `src/components/ui/` (Button, Card, Modal, StarRating), domain components grouped by feature (`clases/`, `profesores/`, `reservas/`, `layout/`). Styling is Tailwind CSS.
