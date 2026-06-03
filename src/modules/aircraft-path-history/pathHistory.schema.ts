import { z } from 'zod';

import { GeoJsonPointSchema, LngLatSchema, lngLatToPoint } from '../../geo/geo.js';
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
 * its own `aircraft_id` and `{ lng, lat }` location; telemetry fields and
 * `update_date` are optional.
 */
export const pathHistoryBatchPointSchema = z
  .object({
    aircraft_id: z.string().uuid(),
    location: LngLatSchema.transform(lngLatToPoint),
    altitude: z.number().int().optional(),
    horizontal_speed_mps: z.number().optional(),
    vertical_speed_mps: z.number().optional(),
    heading_degrees: z.number().optional(),
    position_accuracy_m: z.number().optional(),
    update_date: z.coerce.date().optional(),
  })
  .strict();

export const pathHistoryBatchSchema = z.array(pathHistoryBatchPointSchema).min(1);

export const pathHistoryCreateSchema = z
  .object({
    location: GeoJsonPointSchema,
    altitude: z.number().int(),
    horizontal_speed_mps: z.number(),
    vertical_speed_mps: z.number(),
    heading_degrees: z.number(),
    position_accuracy_m: z.number(),
  })
  .strict();

export const pathHistoryListQuerySchema = buildListQuerySchema(['update_date', 'altitude']).extend({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type PathHistoryCreate = z.infer<typeof pathHistoryCreateSchema>;
export type PathHistoryListQuery = z.infer<typeof pathHistoryListQuerySchema>;
export type AircraftPathQuery = z.infer<typeof aircraftPathQuerySchema>;
export type AircraftTrackQuery = z.infer<typeof aircraftTrackQuerySchema>;
export type PathHistoryBatchPoint = z.infer<typeof pathHistoryBatchPointSchema>;
export type PathHistoryBatch = z.infer<typeof pathHistoryBatchSchema>;
