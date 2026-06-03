import { TargetStatus } from '@prisma/client';
import { z } from 'zod';

import { GeoJsonPointSchema } from '../../geo/geo.js';
import { buildListQuerySchema } from '../../lib/query.js';

export const targetCreateSchema = z
  .object({
    name: z.string().min(1),
    location: GeoJsonPointSchema,
    status: z.nativeEnum(TargetStatus),
  })
  .strict();

export const targetUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    location: GeoJsonPointSchema.optional(),
    status: z.nativeEnum(TargetStatus).optional(),
  })
  .strict();

export const targetIdParamSchema = z.object({ id: z.string().uuid() });

export const targetListQuerySchema = buildListQuerySchema([
  'create_date',
  'name',
  'status',
]).extend({
  status: z.nativeEnum(TargetStatus).optional(),
});

export type TargetCreate = z.infer<typeof targetCreateSchema>;
export type TargetUpdate = z.infer<typeof targetUpdateSchema>;
export type TargetListQuery = z.infer<typeof targetListQuerySchema>;
