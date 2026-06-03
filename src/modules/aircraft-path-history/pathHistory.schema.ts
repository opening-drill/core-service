import { z } from 'zod';

import { LngLatSchema, PathSchema, lngLatArrayToPath } from '../../geo/geo.js';
import { buildListQuerySchema } from '../../lib/query.js';

export const pathHistoryParamsSchema = z.object({ aircraftId: z.string().uuid() });

/** GET /api/aircraft/:aircraft_id/path — `?limit=` or `?until=`. */
export const aircraftPathQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10000).optional(),
  until: z.coerce.date().optional(),
});

/** GET /api/aircraft/:aircraft_id/track — `?from=&to=`. */
export const aircraftTrackQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

/**
 * Batch position write (contract `pathHistory.insertBatch`). Each point carries
 * its own `aircraft_id` and a path of `[{ lng, lat }]` locations;
 * `update_date` is optional.
 */
export const pathHistoryBatchPointSchema = z
  .object({
    aircraft_id: z.string().uuid(),
    location: z.array(LngLatSchema).min(1).transform(lngLatArrayToPath),
    update_date: z.coerce.date().optional(),
  })
  .strict();

export const pathHistoryBatchSchema = z.array(pathHistoryBatchPointSchema).min(1);

export const pathHistoryCreateSchema = z
  .object({
    location: PathSchema,
  })
  .strict();

export const pathHistoryListQuerySchema = buildListQuerySchema(['update_date']).extend({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type PathHistoryCreate = z.infer<typeof pathHistoryCreateSchema>;
export type PathHistoryListQuery = z.infer<typeof pathHistoryListQuerySchema>;
export type AircraftPathQuery = z.infer<typeof aircraftPathQuerySchema>;
export type AircraftTrackQuery = z.infer<typeof aircraftTrackQuerySchema>;
export type PathHistoryBatchPoint = z.infer<typeof pathHistoryBatchPointSchema>;
export type PathHistoryBatch = z.infer<typeof pathHistoryBatchSchema>;
