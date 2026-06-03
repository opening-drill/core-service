# Entity modules

One folder per domain entity, each following the convention:

```
<entity>/
├── <entity>.routes.ts       # route definitions
├── <entity>.controller.ts   # thin: HTTP in/out only
├── <entity>.service.ts      # business logic, wraps Prisma
└── <entity>.schema.ts       # zod input/output schemas + OpenAPI fragments
```

Flow: `routes → controller (HTTP only) → service (logic + Prisma) → schema (zod)`.
**No Prisma calls in controllers.**

Planned entities: `events`, `aircraft`, `aircraftType`, `aircraftPathHistory`,
`targets`, `polygons`, `pictures`, `users`, `roles`, `recommendations`.

Implemented from the DB-access milestone onward.
