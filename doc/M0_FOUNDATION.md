# M0 — Foundation & Shared Understanding

> Living record of the shared mental model the team agrees on before building.
> Canonical source for §0 is [`CORE_SERVICE_GUIDE.md`](./CORE_SERVICE_GUIDE.md);
> this file is the sign-off artifact and tracks decisions/changes since.

## Scope (M0 acceptance)

- [x] §0 (flow, responsibilities, data model, contracts, decisions) captured as living docs — see the guide.
- [x] ERD referenced by all members — [`erd.txt`](./erd.txt) (source: dbdiagram.io link in [README](../README.md)).
- [x] Naming, soft-delete convention, and message/API contracts agreed — see below.
- [ ] Team sign-off recorded (add names/date once reviewed).

## Agreed conventions

- **UUID primary keys** everywhere except `user.id` (varchar) and the auto-increment
  int keys on `user_role`, `role_permission`, `aircraft_path_history`.
- **Soft delete** via a nullable `delete_date` on most entities; creation tracked via `create_date`.
- **Geospatial as GeoJSON in JSON(B) columns** (Prisma `Json`), WGS84 / EPSG:4326. No PostGIS.
  - `target.location`, `aircraft_path_history.location` → GeoJSON `Point`.
  - `polygon.area` → GeoJSON `Polygon`.
  - Validated with `zod` on the way in/out.
- **Enums:** `permission.permission`, `polygon.zone`, `target.status`, `aircraft.status`.
- **Auth:** HTTP **Basic** for identity **+ RBAC** (`user_role` → `role_permission` → `permission`) per endpoint.

## Decision log

| Date | Decision | Notes |
|---|---|---|
| 2026-06-03 | **No Kafka.** The service exposes a **REST API documented with Swagger** and receives API requests directly. | Supersedes §0.1/§0.4/§0.5 (Kafka produce/consume) and milestone **M4 (Kafka & S3 integration)**. The `messaging/` folder, the two Kafka topics, and the produce/consume flow are **out of scope**. |
| 2026-06-03 | API documentation served via **swagger-ui-express** at `/docs`, raw spec at `/openapi.json`. | Each entity module contributes its OpenAPI paths/schemas. |

### Impact of the no-Kafka decision

- The end-to-end flow becomes: **client → REST endpoint → core service → DB** (and S3/MinIO for
  picture uploads). AI-recommendation results, previously consumed from `ai.recommendation`, are now
  written through a normal authenticated REST endpoint instead.
- `src/messaging/**` and `messaging/contracts` are **not created**.
- S3/MinIO picture upload remains in scope (it was never Kafka-coupled).

## Data model (reference)

| Domain | Tables |
|---|---|
| Identity / RBAC | `user`, `role`, `permission`, `user_role`, `role_permission` |
| Geospatial | `polygon` (danger zones), `target` |
| Core workflow | `event`, `picture`, `ai_recommendation` |
| Fleet | `aircraft`, `aircraft_type`, `aircraft_path_history` |

## Sign-off

| Name | Role | Date |
|---|---|---|
| _(pending)_ | | |
