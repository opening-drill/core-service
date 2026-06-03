# Core Service — Build Guide & Milestone Roadmap

> The **core service** is the system of record for the AI aircraft‑recommendation platform.
> It owns **all** reading, writing, and updating of data in the system DB, and bridges the
> database with the AI pipeline through **Kafka** and **S3/MinIO**.

---

## 0. System Understanding

### 0.1 End‑to‑end flow (from the Kafka Architecture Blueprint)

```
1. Event occurs
2. Core service writes the event + assembles context
        → publishes to Kafka topic  event.aircraft.context
        → event picture (PNG) stored in S3/MinIO
3. AI VLM analyzes the image           → number_of_people, building_type
4. AI LLM recommends the best aircraft → aircraft_id, urgency_level
5. Result published to Kafka topic  ai.recommendation
6. Core service persists the recommendation to the DB sink, linked by event_id
```

```
[DB] ──(core service)──▶ Kafka: event.aircraft.context ──▶ [AI: VLM → LLM]
  ▲                                                              │
  └────────── Kafka: ai.recommendation ◀─────────────────────────┘
            (core service consumes & writes back, linked by event_id)
```

### 0.2 Core‑service responsibilities

- **CRUD + lifecycle** for every entity in the ERD.
- **Upload** event pictures (PNG) to S3/MinIO and persist `picture` rows.
- **Produce** `event.aircraft.context` when an event is created.
- **Consume** `ai.recommendation`, persist `ai_recommendation`, and link it back to the
  event (`event.ai_recommendation_id`, `event.aircraft_id`).

### 0.3 Data model (from `doc/erd.txt`)

| Domain | Tables |
|---|---|
| Identity / RBAC | `user`, `role`, `permission`, `user_role`, `role_permission` |
| Geospatial | `polygon` (danger zones), `target` |
| Core workflow | `event`, `picture`, `ai_recommendation` |
| Fleet | `aircraft`, `aircraft_type`, `aircraft_path_history` |

Conventions observed in the ERD:
- UUID primary keys (except `user.id` varchar, and auto‑increment ints on
  `user_role`, `role_permission`, `aircraft_path_history`).
- **Soft delete** via `delete_date` on most entities.
- **Geospatial as GeoJSON**: the ERD's `GEOGRAPHY(...)` columns are stored as **GeoJSON in
  JSON(B) columns** — `target.location` and `aircraft_path_history.location` as GeoJSON
  `Point`, `polygon.area` as GeoJSON `Polygon` (all WGS84 / EPSG:4326).
- Enums: `permission.permission`, `polygon.zone`, `target.status`, `aircraft.status`.

### 0.4 Kafka message contracts

**Topic `event.aircraft.context`** (produced by core service):
```jsonc
{
  "event_context": {
    "event_id": "uuid",
    "picture_id": "uuid",
    "target_location": { "lat": 0.0, "lng": 0.0 },
    "image_path": "string"           // S3 object key / path
  },
  "aircraft_context": {
    "aircrafts": [
      {
        "aircraft_id": "uuid",
        "aircraft_type": "enum",
        "path_history": [ { "timestamp": "ISO-8601", "location": { "lat": 0.0, "lng": 0.0 } } ]
      }
    ]
  }
}
```

**Topic `ai.recommendation`** (consumed by core service):
```jsonc
{ "event_id": "uuid", "aircraft_id": "uuid", "urgency_level": "enum|float" }
```

### 0.5 Confirmed design decisions

| Area | Decision |
|---|---|
| **Geospatial** | Store geography as **GeoJSON in JSON(B) columns** (Prisma `Json`). No PostGIS. Validate GeoJSON shapes with `zod` on the way in/out; optional GIN index on the JSONB columns. |
| **Auth** | HTTP **Basic** for identity **+ RBAC** enforcement (`user_role` → `role_permission` → `permission`) per endpoint. |
| **Kafka** | **Produce + Consume** — produce `event.aircraft.context`, consume `ai.recommendation` (write‑back sink). |
| **Infra** | **Service Dockerfile only**. Connect to the provided DB / Kafka / S3 (credentials per `doc/מדריכי התחברות לDB.pdf`). No docker‑compose for dependencies. |

### 0.6 Tech stack

Express + HTTP Basic · **Prisma 7** (with migrations) · **pure TypeScript, no `any`**
(lint‑enforced) · modular folder structure · `kafkajs` · AWS SDK v3 (S3/MinIO) · `zod`
validation · `pino` logging.

---

## 1. Target Folder Structure

```
core-service/
├── src/
│   ├── server.ts                  # bootstrap + graceful shutdown
│   ├── app.ts                     # express app factory (middleware + route mounting)
│   ├── config/
│   │   └── env.ts                 # typed, zod-validated environment config
│   ├── lib/
│   │   ├── prisma.ts              # PrismaClient singleton
│   │   ├── kafka.ts               # kafkajs producer/consumer factory
│   │   ├── s3.ts                  # S3/MinIO client (AWS SDK v3)
│   │   └── logger.ts              # pino logger
│   ├── middleware/
│   │   ├── basicAuth.ts           # HTTP Basic identity
│   │   ├── authorize.ts           # RBAC permission guard
│   │   ├── validate.ts            # zod request validation
│   │   └── errorHandler.ts        # centralized error mapping
│   ├── modules/                   # one folder per entity
│   │   └── <entity>/
│   │       ├── <entity>.routes.ts
│   │       ├── <entity>.controller.ts   # thin: HTTP in/out
│   │       ├── <entity>.service.ts      # business logic, wraps Prisma
│   │       └── <entity>.schema.ts       # zod input/output schemas
│   │   # entities: events, aircraft, aircraftType, aircraftPathHistory,
│   │   #           targets, polygons, pictures, users, roles, recommendations
│   ├── messaging/
│   │   ├── contracts/             # typed + zod DTOs for the two Kafka payloads
│   │   ├── producers/eventContext.producer.ts
│   │   └── consumers/recommendation.consumer.ts
│   ├── storage/
│   │   └── pictures.storage.ts    # PNG upload to S3, returns object_key/bucket
│   └── geo/
│       └── geo.ts                 # GeoJSON zod schemas + helpers (Point/Polygon validation)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                    # seed permissions/roles/admin user
├── tests/
├── Dockerfile
├── .dockerignore
├── .env.example
├── tsconfig.json                  # strict, noImplicitAny
├── .eslintrc.*                    # @typescript-eslint/no-explicit-any: "error"
├── package.json
└── README.md
```

**Module convention:** `routes` → `controller` (thin, HTTP only) → `service` (logic + Prisma)
→ `schema` (zod validation). No Prisma calls in controllers.

---

## 2. Milestones

### M0 — Foundation & shared understanding
**Goal:** the whole team shares one mental model before code.
- Capture §0 (flow, responsibilities, data model, contracts, decisions) as living docs.
- Agree on naming, soft‑delete convention, and the two Kafka topics + payload shapes.

**Acceptance:** team sign‑off on this guide; ERD and contracts referenced by all members.

---

### M1 — Workspace & tooling
**Goal:** a runnable, strict‑typed Express skeleton the team can build on.

- `package.json` with scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`,
  `prisma:*`.
- `tsconfig.json`: `strict: true`, `noImplicitAny: true`, `exactOptionalPropertyTypes`.
- ESLint: `@typescript-eslint/no-explicit-any: "error"` (the **no‑`any`** guarantee).
- Folder skeleton (§1) committed with placeholder modules.
- `lib/logger.ts` (pino) and `config/env.ts` (zod‑validated env; fail fast on boot).
- `app.ts` + `server.ts`: Express app, `/health` endpoint, error handler, graceful shutdown.
- **Dockerfile** (multi‑stage: build → slim runtime) + `.dockerignore` + `.env.example`.

**Acceptance:** `npm run dev` boots; `GET /health` → 200; `npm run lint && npm run typecheck`
clean; `docker build` succeeds.

---

### M2 — Database: Prisma 7 schema & migrations
**Goal:** the full schema modeled and migrated.

- Prisma datasource: Postgres (no extensions required).
- Model **all** ERD tables; geography columns as **`Json`** (JSONB) holding GeoJSON —
  `Point` for `target.location` / `aircraft_path_history.location`, `Polygon` for
  `polygon.area` (EPSG:4326).
- Define enums: `permission`, polygon `zone`, target `status`, aircraft `status`.
- Soft‑delete convention (`delete_date` nullable) and timestamps.
- Optional: GIN index on the JSONB geography columns (raw SQL in migration) if queried.
- `prisma/seed.ts`: seed permissions, baseline roles, and an admin user.

**Acceptance:** `prisma migrate dev` applies cleanly; geography columns are JSONB;
`prisma db seed` runs; generated client is fully typed.

---

### M3 — DB access (CRUD) + Auth
**Goal:** authenticated, authorized CRUD for every entity.

- `lib/prisma.ts` singleton.
- Per‑entity modules (routes/controller/service/schema) with shared patterns:
  pagination, filtering, soft‑delete, consistent error mapping.
- `geo/geo.ts`: zod schemas for GeoJSON `Point` / `Polygon` + helpers to validate and
  (de)serialize geography JSON on the way in/out of Prisma `Json` fields.
- `middleware/basicAuth.ts`: parse `Authorization: Basic`, resolve `user`.
- `middleware/authorize.ts`: `authorize(permission)` — resolve user → roles → permissions,
  enforce the `permission` enum per route.
- `middleware/validate.ts` (zod) + `middleware/errorHandler.ts` (central error taxonomy).

**Acceptance:** CRUD endpoints for all entities pass integration tests; unauthenticated →
401, missing permission → 403; geography fields round‑trip as validated GeoJSON; no `any`
in the tree.

---

### M4 — Kafka & S3 integration
**Goal:** close the loop with the AI pipeline.

- `lib/s3.ts` + `storage/pictures.storage.ts`: PNG upload endpoint → store to S3/MinIO →
  create `picture` row (`object_key`, `bucket`, `file_name`, `uploaded_at`).
- `messaging/contracts/`: typed + zod DTOs matching §0.4 exactly.
- **Producer** (`producers/eventContext.producer.ts`): on event create, assemble
  `event_context` (event_id, picture_id, target_location, image_path) + `aircraft_context`
  (aircraft list with latest `path_history`), publish to `event.aircraft.context`.
- **Consumer** (`consumers/recommendation.consumer.ts`): subscribe `ai.recommendation`,
  validate, persist `ai_recommendation`, link the event
  (`ai_recommendation_id`, `aircraft_id`); **idempotent by `event_id`**.
- Producer/consumer wired into `server.ts` lifecycle with graceful shutdown; retry/DLQ note.

**Acceptance:** creating an event publishes a schema‑valid `event.aircraft.context` payload;
an inbound `ai.recommendation` message persists + links correctly and is idempotent on
re‑delivery; picture upload round‑trips to S3 and creates the `picture` row.

---

## 3. Cross‑cutting Concerns

- **Testing:** `vitest` + `supertest`; integration tests against a test DB; contract tests
  for both Kafka payloads.
- **No `any`:** enforced by ESLint rule + `tsc --noEmit` in CI.
- **Config & secrets:** all connection params (DB, Kafka, S3) from env, validated in
  `config/env.ts`; values sourced from the DB connection guide (`doc/מדריכי התחברות לDB.pdf`).
- **Observability:** structured `pino` logs; request logging middleware; error taxonomy.
- **CI (suggested):** `lint → typecheck → migrate → test → docker build`.

---

## 4. Open Questions / Future
- Multiple aircraft and/or multiple pictures per event (noted in the ERD).
- Aircraft current state: derive from latest `aircraft_path_history.update_date` (runtime)
  vs. denormalized snapshot on `aircraft` (storage) — runtime preferred for now.
- `urgency_level` type alignment between `ai_recommendation` (float) and the message enum.
