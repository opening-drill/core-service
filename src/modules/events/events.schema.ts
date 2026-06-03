import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

export const eventCreateSchema = z
  .object({
    // Contract user_id is the IDF identifier == User.username (resolved to UUID).
    user_id: z.string().min(1),
    target_id: z.string().uuid(),
    picture_id: z.string().uuid(),
    aircraft_id: z.string().uuid().nullish(),
    ai_recommendation_id: z.string().uuid().nullish(),
    // Optional client-supplied creation timestamp (otherwise defaults to now()).
    create_date: z.coerce.date().optional(),
  })
  .strict();

export const eventUpdateSchema = z
  .object({
    target_id: z.string().uuid().optional(),
    picture_id: z.string().uuid().optional(),
    aircraft_id: z.string().uuid().nullable().optional(),
    ai_recommendation_id: z.string().uuid().nullable().optional(),
  })
  .strict();

export const eventIdParamSchema = z.object({ id: z.string().uuid() });

export const eventListQuerySchema = buildListQuerySchema([
  'create_date',
  'update_date',
]).extend({
  // user_id filter is the username (resolved to UUID in the service).
  user_id: z.string().min(1).optional(),
  target_id: z.string().uuid().optional(),
  aircraft_id: z.string().uuid().optional(),
  // create_date range filters (contract `?from=&to=`).
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type EventCreate = z.infer<typeof eventCreateSchema>;
export type EventUpdate = z.infer<typeof eventUpdateSchema>;
export type EventListQuery = z.infer<typeof eventListQuerySchema>;
