import { z } from 'zod';

export const userRoleParamsSchema = z.object({ userId: z.string().uuid() });

export const userRoleDeleteParamsSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const userRoleCreateSchema = z.object({ role_id: z.string().uuid() }).strict();

export type UserRoleCreate = z.infer<typeof userRoleCreateSchema>;
