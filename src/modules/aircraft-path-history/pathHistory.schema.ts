import { z } from 'zod';

import { GeoJsonPointSchema } from '../../geo/geo.js';
import { buildListQuerySchema } from '../../lib/query.js';

export const pathHistoryParamsSchema = z.object({ aircraftId: z.string().uuid() });

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
