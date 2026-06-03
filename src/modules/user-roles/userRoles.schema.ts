import { z } from 'zod';

// `userId` here is the contract user_id (== username), resolved to a UUID in the
// service. `roleId` (delete path) remains a UUID.
export const userRoleParamsSchema = z.object({ userId: z.string().min(1) });

export const userRoleDeleteParamsSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().uuid(),
});

/** Assign by role name or role id (contract accepts either). */
export const userRoleCreateSchema = z
  .object({
    role_name: z.string().min(1).optional(),
    role_id: z.string().uuid().optional(),
  })
  .strict()
  .refine((d) => d.role_name !== undefined || d.role_id !== undefined, {
    message: 'Provide role_name or role_id',
  });

export type UserRoleCreate = z.infer<typeof userRoleCreateSchema>;
