import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

export const userCreateSchema = z
  .object({
    full_name: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(8),
  })
  .strict();

export const userUpdateSchema = z
  .object({
    full_name: z.string().min(1).optional(),
    password: z.string().min(8).optional(),
  })
  .strict();

export const userIdParamSchema = z.object({ id: z.string().uuid() });

/** `:user_id` path param for permissions/roles is the username, not a UUID. */
export const userNameParamSchema = z.object({ userId: z.string().min(1) });

/** POST /api/users/auth — credential check. */
export const userAuthSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(1),
  })
  .strict();

export const userListQuerySchema = buildListQuerySchema([
  'create_date',
  'username',
  'full_name',
]).extend({
  username: z.string().min(1).optional(),
});

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UserAuth = z.infer<typeof userAuthSchema>;
