# Future Extensions (designed, not yet implemented)

These two extensions were intentionally **designed but not built** — the current
`event` table keeps a single `aircraft_id` and `picture_id`. When the product
needs many-to-many, add the join tables below (one Prisma migration) plus the
nested routers, reusing the existing soft-delete + "reactivate on re-add"
assignment pattern (see `user-roles` / `role-permissions` modules).

## 14. Event ⇄ Aircraft (`event_aircraft`)

Prisma model:

```prisma
model EventAircraft {
  id          Int       @id @default(autoincrement())
  event_id    String    @db.Uuid
  aircraft_id String    @db.Uuid
  create_date DateTime  @default(now())
  delete_date DateTime?

  event    Event    @relation(fields: [event_id], references: [id])
  aircraft Aircraft @relation(fields: [aircraft_id], references: [id])

  @@unique([event_id, aircraft_id])
  @@map("event_aircraft")
}
```

Endpoints (nested router at `/events/:eventId/aircraft`, `mergeParams`):

| Method | Path | Permission | Behaviour |
|---|---|---|---|
| POST | `/events/:eventId/aircraft` | EDIT | body `{ aircraft_id }`; verify event + aircraft exist; 409 on active duplicate; reactivate a soft-deleted row instead of inserting. |
| GET | `/events/:eventId/aircraft` | VIEW | list active aircraft for the event. |
| DELETE | `/events/:eventId/aircraft/:aircraftId` | EDIT | soft-delete the active assignment (404 if none). |

## 15. Event ⇄ Files (`event_picture`)

Prisma model:

```prisma
model EventPicture {
  id          Int       @id @default(autoincrement())
  event_id    String    @db.Uuid
  picture_id  String    @db.Uuid
  create_date DateTime  @default(now())
  delete_date DateTime?

  event   Event   @relation(fields: [event_id], references: [id])
  picture Picture @relation(fields: [picture_id], references: [id])

  @@unique([event_id, picture_id])
  @@map("event_picture")
}
```

Endpoints (nested router at `/events/:eventId/files`, `mergeParams`):

| Method | Path | Permission | Behaviour |
|---|---|---|---|
| POST | `/events/:eventId/files` | EDIT | body `{ picture_id }`; verify event + picture exist; 409 on active duplicate; reactivate a soft-deleted row. |
| GET | `/events/:eventId/files` | VIEW | list files attached to the event. |
| DELETE | `/events/:eventId/files/:fileId` | EDIT | soft-delete the active link (404 if none). |

## Optional: spatial GIN indexes

Geography is stored as GeoJSON in JSONB (no PostGIS). If JSONB geometry is ever
queried, add raw-SQL GIN indexes in a migration (not required today):

```sql
CREATE INDEX idx_polygon_geojson ON polygon USING GIN (geojson jsonb_path_ops);
CREATE INDEX idx_target_location ON target USING GIN (location jsonb_path_ops);
CREATE INDEX idx_aircraft_path_history_location ON aircraft_path_history USING GIN (location jsonb_path_ops);
```
