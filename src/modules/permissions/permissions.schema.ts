import { PermissionType } from '@prisma/client';
import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

export const permissionCreateSchema = z
  .object({ permission: z.nativeEnum(PermissionType) })
  .strict();

export const permissionParamSchema = z.object({ permission: z.nativeEnum(PermissionType) });

export const permissionListQuerySchema = buildListQuerySchema(['create_date', 'permission']);

export type PermissionCreate = z.infer<typeof permissionCreateSchema>;
export type PermissionListQuery = z.infer<typeof permissionListQuerySchema>;
