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

/** POST /api/users/auth — verify username/password (requires `X-Api-Key` header). */
export const userAuthSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(1),
  })
  .strict();

/** POST /api/users/signup — provision a user (requires `X-Api-Key`). */
export const userSignupSchema = z
  .object({
    full_name: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(8),
    role_name: z.string().min(1).optional(),
    role_id: z.string().uuid().optional(),
  })
  .strict()
  .refine((d) => !(d.role_name !== undefined && d.role_id !== undefined), {
    message: 'Provide role_name or role_id, not both',
  });

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
export type UserSignup = z.infer<typeof userSignupSchema>;
