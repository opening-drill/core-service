import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

export const aircraftTypeCreateSchema = z
  .object({
    name: z.string().min(1),
    price: z.number().int().nonnegative(),
    payload_kg: z.number().nonnegative(),
    velocity_kmh: z.number().nonnegative(),
  })
  .strict();

export const aircraftTypeUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    price: z.number().int().nonnegative().optional(),
    payload_kg: z.number().nonnegative().optional(),
    velocity_kmh: z.number().nonnegative().optional(),
  })
  .strict();

export const aircraftTypeIdParamSchema = z.object({ id: z.string().uuid() });

export const aircraftTypeListQuerySchema = buildListQuerySchema([
  'create_date',
  'name',
  'price',
]).extend({
  name: z.string().min(1).optional(),
  min_price: z.coerce.number().int().nonnegative().optional(),
  max_price: z.coerce.number().int().nonnegative().optional(),
});

export type AircraftTypeCreate = z.infer<typeof aircraftTypeCreateSchema>;
export type AircraftTypeUpdate = z.infer<typeof aircraftTypeUpdateSchema>;
export type AircraftTypeListQuery = z.infer<typeof aircraftTypeListQuerySchema>;
