import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { userRolesRouter } from '../user-roles/userRoles.routes.js';
import { usersController } from './users.controller.js';
import {
  userCreateSchema,
  userIdParamSchema,
  userListQuerySchema,
  userUpdateSchema,
} from './users.schema.js';

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

// Nested: role assignments for a user.
usersRouter.use('/:userId/roles', userRolesRouter);
