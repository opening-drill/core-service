import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

export const roleCreateSchema = z.object({ name: z.string().min(1) }).strict();

export const roleUpdateSchema = z.object({ name: z.string().min(1).optional() }).strict();

export const roleIdParamSchema = z.object({ id: z.string().uuid() });

export const roleListQuerySchema = buildListQuerySchema(['create_date', 'name']).extend({
  name: z.string().min(1).optional(),
});

export type RoleCreate = z.infer<typeof roleCreateSchema>;
export type RoleUpdate = z.infer<typeof roleUpdateSchema>;
export type RoleListQuery = z.infer<typeof roleListQuerySchema>;
