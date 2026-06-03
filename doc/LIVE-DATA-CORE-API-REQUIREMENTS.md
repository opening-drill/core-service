# Core API Routes — Live Data Team Requirements

Routes we need from the Core team (Postgres + S3). Separate calls per entity—no bundled `POST /api/write`.

**Conventions:** UUIDs for `event`, `target`, `picture`, `aircraft`; `user_id` = string; coordinates `{ "lng", "lat" }`; times ISO-8601 UTC; errors `{ "error": { "code", "message" } }`.

---

## RBAC

### 1. `POST /api/users/:user_id/roles` — add user role

**Input**
```json
{ "role_name": "cop_operator" }
```
or `{ "role_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }`

**Output** `201`
```json
{
  "user_id": "1234567@idf.il",
  "role_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "created_at": "2026-06-03T12:00:00Z"
}
```

---

### 2. `GET /api/users/:user_id/permissions` — check user roles

**Input** — path only

**Output** `200`
```json
{
  "user_id": "1234567@idf.il",
  "roles": ["cop_operator"],
  "permissions": ["view", "dispatch", "edit"]
}
```

---

## S3 / pictures

### 3. `POST /api/storage/pictures` — put image (file + metadata)

**Input** — `multipart/form-data`
```
file: <binary>
file_name: target-123.png   (optional)
bucket: field-images        (optional)
```

**Output** `201`
```json
{
  "picture_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "object_key": "evt/2026-06-03/abc.png",
  "bucket": "field-images",
  "file_name": "target-123.png",
  "uploaded_at": "2026-06-03T12:00:00Z"
}
```

---

### 4. `GET /api/storage/pictures/:picture_id/url` — pull image for UI (presigned)

**Input** — query: `?expires=900` (optional)

**Output** `200`
```json
{
  "image_url": "https://minio.example/field-images/evt/...?X-Amz-Signature=...",
  "object_key": "evt/2026-06-03/abc.png",
  "expires_at": "2026-06-03T12:15:00Z"
}
```

---

### 5. `GET /api/storage/pictures/:picture_id` — pull image ref for AI

**Input** — path only

**Output** `200`
```json
{
  "picture_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "image_path": "s3://field-images/evt/2026-06-03/abc.png",
  "object_key": "evt/2026-06-03/abc.png",
  "bucket": "field-images"
}
```

---

## Target + event metadata (separate routes)

### 6. `POST /api/targets` — put target metadata

**Input**
```json
{
  "location": { "lng": 34.79, "lat": 32.07 },
  "name": "North bunker",
  "status": "standing"
}
```

**Output** `201`
```json
{
  "target_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "standing",
  "create_date": "2026-06-03T12:00:00Z"
}
```

---

### 7. `POST /api/events` — put event metadata

**Input** — requires existing `target_id` and `picture_id`
```json
{
  "user_id": "1234567@idf.il",
  "target_id": "550e8400-e29b-41d4-a716-446655440000",
  "picture_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "create_date": "2026-06-03T12:00:00Z"
}
```

**Output** `201`
```json
{
  "event_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "create_date": "2026-06-03T12:00:00Z"
}
```

---

### 8. `GET /api/events/:event_id` — pull event metadata

**Input** — path only

**Output** `200`
```json
{
  "event_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "user_id": "1234567@idf.il",
  "target_id": "550e8400-e29b-41d4-a716-446655440000",
  "picture_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "aircraft_id": null,
  "ai_recommendation_id": null,
  "create_date": "2026-06-03T12:00:00Z",
  "update_date": null,
  "target": {
    "target_id": "550e8400-e29b-41d4-a716-446655440000",
    "location": { "lng": 34.79, "lat": 32.07 },
    "name": "North bunker",
    "status": "standing"
  },
  "picture": {
    "picture_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "file_name": "target-123.png"
  }
}
```

---

### 9. `GET /api/events` — list events

**Input** — query: `?from=2026-06-03T00:00:00Z&to=2026-06-03T23:59:59Z` (optional filters)

**Output** `200`
```json
{
  "events": [
    {
      "event_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "user_id": "1234567@idf.il",
      "target_id": "550e8400-e29b-41d4-a716-446655440000",
      "create_date": "2026-06-03T12:00:00Z"
    }
  ]
}
```

---

### 10. `GET /api/events/:event_id/ai-context` — pull bundled context for AI (optional but preferred)

**Input** — path only

**Output** `200`
```json
{
  "event_context": {
    "event_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "picture_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "target_location": { "lng": 34.79, "lat": 32.07 },
    "image_path": "s3://field-images/evt/2026-06-03/abc.png"
  },
  "aircraft_context": {
    "aircrafts": [
      {
        "aircraft_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "aircraft_type": "F-15",
        "path_history": [
          {
            "timestamp": "2026-06-03T12:01:00Z",
            "location": { "lng": 34.80, "lat": 32.10 }
          }
        ]
      }
    ]
  }
}
```

---

### 11. `PATCH /api/events/:event_id` — update event

**Input** — any subset
```json
{
  "aircraft_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "ai_recommendation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Output** `200`
```json
{ "ok": true, "update_date": "2026-06-03T12:05:00Z" }
```

---

### 12. `GET /api/targets/:target_id` — pull target

**Input** — path only

**Output** `200`
```json
{
  "target_id": "550e8400-e29b-41d4-a716-446655440000",
  "location": { "lng": 34.79, "lat": 32.07 },
  "name": "North bunker",
  "status": "standing"
}
```

---

### 13. `PATCH /api/targets/:target_id` — update target status

**Input**
```json
{ "status": "destroyed" }
```

**Output** `200`
```json
{ "ok": true }
```

---

## Drone / aircraft

### 14. `PATCH /api/aircraft/:aircraft_id` — put drone metadata

**Input**
```json
{
  "status": "busy",
  "type_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

**Output** `200`
```json
{ "ok": true, "update_date": "2026-06-03T12:05:00Z" }
```

---

### 15. `pathHistory.insertBatch(points[])` — write drone position data (pool, not REST)

**Input**
```json
[
  {
    "aircraft_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "location": { "lng": 34.80, "lat": 32.10 },
    "altitude": 1200,
    "horizontal_speed_mps": 45.2,
    "vertical_speed_mps": 0.5,
    "heading_degrees": 270,
    "position_accuracy_m": 3.0,
    "update_date": "2026-06-03T12:01:00Z"
  }
]
```

**Output**
```json
{ "inserted": 1 }
```

---

### 16. `GET /api/aircraft/live` — all drones, latest position each

**Input** — query optional: `?status=busy`

**Output** `200`
```json
{
  "aircraft": [
    {
      "aircraft_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "aircraft_type": "F-15",
      "status": "busy",
      "location": { "lng": 34.80, "lat": 32.10 },
      "altitude": 1200,
      "heading_degrees": 270,
      "update_date": "2026-06-03T12:01:00Z"
    }
  ]
}
```

---

### 17. `GET /api/aircraft/:aircraft_id/path` — path history up to a point

**Input** — query: `?limit=100` or `?until=2026-06-03T12:10:00Z`

**Output** `200`
```json
{
  "aircraft_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "points": [
    {
      "location": { "lng": 34.80, "lat": 32.10 },
      "altitude": 1200,
      "heading_degrees": 270,
      "update_date": "2026-06-03T12:01:00Z"
    }
  ]
}
```

---

### 18. `GET /api/aircraft?status=free` — list available aircraft

**Input** — query: `status=free`

**Output** `200`
```json
{
  "aircraft": [
    {
      "aircraft_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "aircraft_type": "F-15",
      "status": "free"
    }
  ]
}
```

---

### 19. `GET /api/aircraft/:aircraft_id/track` — full track for debrief

**Input** — query: `?from=2026-06-03T10:00:00Z&to=2026-06-03T14:00:00Z`

**Output** `200`
```json
{
  "aircraft_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "points": [
    {
      "location": { "lng": 34.78, "lat": 32.08 },
      "altitude": 1100,
      "update_date": "2026-06-03T10:30:00Z"
    }
  ]
}
```

---

## AI recommendation + zones

### 20. `POST /api/ai-recommendations` — store AI recommendation

**Input**
```json
{
  "event_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "recommended_aircraft_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "urgency_level": 0.92,
  "raw_recommendation": "Dispatch F-15 to target within 8 minutes."
}
```

**Output** `201`
```json
{
  "ai_recommendation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

---

### 21. `GET /api/polygons?active=true` — active danger zones

**Input** — query: `active=true`

**Output** `200`
```json
{
  "polygons": [
    {
      "id": "2e8f4a1b-9c3d-4e5f-a6b7-8c9d0e1f2a3b",
      "name": "Zone south",
      "zone": "gaza_south",
      "state_duartion": 30,
      "area": {
        "type": "Polygon",
        "coordinates": [[[34.78, 32.07], [34.79, 32.08], [34.78, 32.07]]]
      }
    }
  ]
}
```

---

## Typical call order (report target)

```
POST /api/storage/pictures
POST /api/targets
POST /api/events
GET  /api/events/:event_id/ai-context   → publish to Kafka
POST /api/ai-recommendations
PATCH /api/events/:event_id
GET  /api/storage/pictures/:picture_id/url
```

---

## Error example (all routes)

**Output** `404`
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Event 6ba7b810-9dad-11d1-80b4-00c04fd430c8 not found"
  }
}
```
