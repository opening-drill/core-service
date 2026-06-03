import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { userRolesRouter } from '../user-roles/userRoles.routes.js';
import { usersController } from './users.controller.js';
import {
  userAuthSchema,
  userCreateSchema,
  userIdParamSchema,
  userListQuerySchema,
  userNameParamSchema,
  userUpdateSchema,
} from './users.schema.js';

/**
 * Public authentication endpoint (POST /api/users/auth). Mounted WITHOUT
 * basicAuth — it verifies credentials itself — so it must be mounted before the
 * protected `/api/users` router in app.ts.
 */
export const usersAuthRouter = Router();
usersAuthRouter.post('/', validate({ body: userAuthSchema }), asyncHandler(usersController.authenticate));

export const usersRouter = Router();

usersRouter.get(
  '/',
  requireView,
  validate({ query: userListQuerySchema }),
  asyncHandler(usersController.list),
);
usersRouter.post(
  '/',
  requireEdit,
  validate({ body: userCreateSchema }),
  asyncHandler(usersController.create),
);
usersRouter.get(
  '/:id',
  requireView,
  validate({ params: userIdParamSchema }),
  asyncHandler(usersController.getById),
);
usersRouter.patch(
  '/:id',
  requireEdit,
  validate({ params: userIdParamSchema, body: userUpdateSchema }),
  asyncHandler(usersController.update),
);
usersRouter.delete(
  '/:id',
  requireEdit,
  validate({ params: userIdParamSchema }),
  asyncHandler(usersController.remove),
);

// Effective roles & permissions for a user (`:userId` is the username).
usersRouter.get(
  '/:userId/permissions',
  requireView,
  validate({ params: userNameParamSchema }),
  asyncHandler(usersController.permissions),
);

// Nested: role assignments for a user.
usersRouter.use('/:userId/roles', userRolesRouter);
