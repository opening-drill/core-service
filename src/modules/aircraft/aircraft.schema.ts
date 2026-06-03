import { AircraftStatus } from '@prisma/client';
import { z } from 'zod';

import { contractEnumSchema } from '../../lib/enumCase.js';
import { buildListQuerySchema } from '../../lib/query.js';

/** Contract lowercase status (`busy`/`free`/`broken`) → `AircraftStatus` enum. */
const contractAircraftStatus = contractEnumSchema(AircraftStatus);

export const aircraftCreateSchema = z
  .object({
    type_id: z.string().uuid(),
    status: contractAircraftStatus,
  })
  .strict();

export const aircraftUpdateSchema = z
  .object({
    type_id: z.string().uuid().optional(),
    status: contractAircraftStatus.optional(),
  })
  .strict();

export const aircraftIdParamSchema = z.object({ id: z.string().uuid() });

// Aircraft has no create_date; the list default sorts by update_date.
export const aircraftListQuerySchema = buildListQuerySchema(['update_date', 'status']).extend({
  status: contractAircraftStatus.optional(),
  type_id: z.string().uuid().optional(),
});

/** GET /api/aircraft/live — optional status filter. */
export const aircraftLiveQuerySchema = z.object({
  status: contractAircraftStatus.optional(),
});

export type AircraftCreate = z.infer<typeof aircraftCreateSchema>;
export type AircraftUpdate = z.infer<typeof aircraftUpdateSchema>;
export type AircraftListQuery = z.infer<typeof aircraftListQuerySchema>;
export type AircraftLiveQuery = z.infer<typeof aircraftLiveQuerySchema>;
