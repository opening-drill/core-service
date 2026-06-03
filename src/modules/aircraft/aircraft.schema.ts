import { AircraftStatus } from '@prisma/client';
import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

export const aircraftCreateSchema = z
  .object({
    type_id: z.string().uuid(),
    status: z.nativeEnum(AircraftStatus),
  })
  .strict();

export const aircraftUpdateSchema = z
  .object({
    type_id: z.string().uuid().optional(),
    status: z.nativeEnum(AircraftStatus).optional(),
  })
  .strict();

export const aircraftIdParamSchema = z.object({ id: z.string().uuid() });

// Aircraft has no create_date; the list default sorts by update_date.
export const aircraftListQuerySchema = buildListQuerySchema(['update_date', 'status']).extend({
  status: z.nativeEnum(AircraftStatus).optional(),
  type_id: z.string().uuid().optional(),
});

export type AircraftCreate = z.infer<typeof aircraftCreateSchema>;
export type AircraftUpdate = z.infer<typeof aircraftUpdateSchema>;
export type AircraftListQuery = z.infer<typeof aircraftListQuerySchema>;
