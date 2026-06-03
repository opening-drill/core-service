import { TargetStatus } from '@prisma/client';
import { z } from 'zod';

import { LngLatSchema, lngLatToPoint } from '../../geo/geo.js';
import { contractEnumSchema } from '../../lib/enumCase.js';
import { buildListQuerySchema } from '../../lib/query.js';

/** Contract location `{ lng, lat }` → stored GeoJSON Point. */
const contractLocation = LngLatSchema.transform(lngLatToPoint);
/** Contract lowercase status → `TargetStatus` enum. */
const contractTargetStatus = contractEnumSchema(TargetStatus);

export const targetCreateSchema = z
  .object({
    name: z.string().min(1),
    location: contractLocation,
    status: contractTargetStatus,
  })
  .strict();

export const targetUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    location: contractLocation.optional(),
    status: contractTargetStatus.optional(),
  })
  .strict();

export const targetIdParamSchema = z.object({ id: z.string().uuid() });

export const targetListQuerySchema = buildListQuerySchema([
  'create_date',
  'name',
  'status',
]).extend({
  status: contractTargetStatus.optional(),
});

export type TargetCreate = z.infer<typeof targetCreateSchema>;
export type TargetUpdate = z.infer<typeof targetUpdateSchema>;
export type TargetListQuery = z.infer<typeof targetListQuerySchema>;
