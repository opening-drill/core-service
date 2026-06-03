import { PermissionType } from '@prisma/client';
import { z } from 'zod';

export const rolePermissionParamsSchema = z.object({ roleId: z.string().uuid() });

export const rolePermissionDeleteParamsSchema = z.object({
  roleId: z.string().uuid(),
  permission: z.nativeEnum(PermissionType),
});

export const rolePermissionCreateSchema = z
  .object({ permission: z.nativeEnum(PermissionType) })
  .strict();

export type RolePermissionCreate = z.infer<typeof rolePermissionCreateSchema>;
