# Core Service

System of record for the AI aircraft-recommendation platform. Owns all reading,
writing, and updating of data in the system DB and exposes a **REST API**
(documented with **Swagger**) to receive requests.

> Note: the architecture is **REST + Swagger** — there is **no Kafka** integration.
> See [`doc/M0_FOUNDATION.md`](doc/M0_FOUNDATION.md) for the decision log.

## Stack

Express 5 · TypeScript (strict, no `any`) · Prisma 7 · zod · pino · Swagger UI · Vitest.

## Getting started

```bash
cp .env.example .env      # then fill in values
npm install
npm run dev               # boots on http://localhost:3000
```

- Health probe: `GET /health`
- API docs (Swagger UI): `/docs`
- OpenAPI spec: `/openapi.json`

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Watch-mode dev server (tsx) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run start` | Run the compiled server |
| `npm run lint` | ESLint (enforces no-`any`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest |
| `npm run prisma:*` | Prisma generate / migrate / seed / studio (from M2) |

## Docs

- [`doc/CORE_SERVICE_GUIDE.md`](doc/CORE_SERVICE_GUIDE.md) — build guide & milestone roadmap
- [`doc/M0_FOUNDATION.md`](doc/M0_FOUNDATION.md) — shared understanding & decision log
- [`doc/erd.txt`](doc/erd.txt) — data model ([dbdiagram.io](https://dbdiagram.io/d/AI-rcarft-6a1ad3ea2eeb2f46cd20d72c))

## Milestones

- **M0** — Foundation & shared understanding ✅
- **M1** — Workspace & tooling (strict Express skeleton, `/health`, Swagger) ✅
- **M2** — Prisma schema & migrations
- **M3** — DB access (CRUD) + Auth (Basic + RBAC)
- ~~M4 — Kafka & S3~~ → S3 picture upload only (Kafka dropped)
