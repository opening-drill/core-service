import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { requireApiKey } from '../../middleware/requireApiKey.js';
import { validate } from '../../middleware/validate.js';
import { userRolesRouter } from '../user-roles/userRoles.routes.js';
import { usersController } from './users.controller.js';
import {
  userAuthSchema,
  userCreateSchema,
  userIdParamSchema,
  userListQuerySchema,
  userNameParamSchema,
  userSignupSchema,
  userUpdateSchema,
} from './users.schema.js';

/** POST /api/users/auth — username/password in body; `X-Api-Key` in header only. */
export const usersAuthRouter = Router();
usersAuthRouter.post(
  '/',
  requireApiKey,
  validate({ body: userAuthSchema }),
  asyncHandler(usersController.authenticate),
);

/** POST /api/users/signup — provision a user (requires `X-Api-Key`). */
export const usersSignupRouter = Router();
usersSignupRouter.post(
  '/',
  requireApiKey,
  validate({ body: userSignupSchema }),
  asyncHandler(usersController.signup),
);

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

usersRouter.get(
  '/:userId/permissions',
  requireView,
  validate({ params: userNameParamSchema }),
  asyncHandler(usersController.permissions),
);

usersRouter.use('/:userId/roles', userRolesRouter);
