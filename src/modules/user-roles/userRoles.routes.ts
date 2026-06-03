import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { userRolesController } from './userRoles.controller.js';
import {
  userRoleCreateSchema,
  userRoleDeleteParamsSchema,
  userRoleParamsSchema,
} from './userRoles.schema.js';

// mergeParams: inherit `:userId` from the parent /users router.
export const userRolesRouter = Router({ mergeParams: true });

userRolesRouter.get(
  '/',
  requireView,
  validate({ params: userRoleParamsSchema }),
  asyncHandler(userRolesController.list),
);
userRolesRouter.post(
  '/',
  requireEdit,
  validate({ params: userRoleParamsSchema, body: userRoleCreateSchema }),
  asyncHandler(userRolesController.assign),
);
userRolesRouter.delete(
  '/:roleId',
  requireEdit,
  validate({ params: userRoleDeleteParamsSchema }),
  asyncHandler(userRolesController.remove),
);
