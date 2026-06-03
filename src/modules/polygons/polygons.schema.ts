import { Zone } from '@prisma/client';
import { z } from 'zod';

import { GeoJsonPolygonSchema } from '../../geo/geo.js';
import { buildListQuerySchema } from '../../lib/query.js';

export const polygonCreateSchema = z
  .object({
    name: z.string().min(1),
    geojson: GeoJsonPolygonSchema,
    zone: z.nativeEnum(Zone),
    expiry_date: z.coerce.date(),
  })
  .strict();

export const polygonUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    geojson: GeoJsonPolygonSchema.optional(),
    zone: z.nativeEnum(Zone).optional(),
    expiry_date: z.coerce.date().optional(),
  })
  .strict();

export const polygonIdParamSchema = z.object({ id: z.string().uuid() });

export const polygonListQuerySchema = buildListQuerySchema([
  'create_date',
  'name',
  'expiry_date',
]).extend({
  zone: z.nativeEnum(Zone).optional(),
  // Contract `?active=true` — only zones that are not soft-deleted.
  active: z.coerce.boolean().optional(),
});

export type PolygonCreate = z.infer<typeof polygonCreateSchema>;
export type PolygonUpdate = z.infer<typeof polygonUpdateSchema>;
export type PolygonListQuery = z.infer<typeof polygonListQuerySchema>;
