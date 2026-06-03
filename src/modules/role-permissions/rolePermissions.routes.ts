import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { rolePermissionsController } from './rolePermissions.controller.js';
import {
  rolePermissionCreateSchema,
  rolePermissionDeleteParamsSchema,
  rolePermissionParamsSchema,
} from './rolePermissions.schema.js';

// mergeParams: inherit `:roleId` from the parent /roles router.
export const rolePermissionsRouter = Router({ mergeParams: true });

rolePermissionsRouter.get(
  '/',
  requireView,
  validate({ params: rolePermissionParamsSchema }),
  asyncHandler(rolePermissionsController.list),
);
rolePermissionsRouter.post(
  '/',
  requireEdit,
  validate({ params: rolePermissionParamsSchema, body: rolePermissionCreateSchema }),
  asyncHandler(rolePermissionsController.assign),
);
rolePermissionsRouter.delete(
  '/:permission',
  requireEdit,
  validate({ params: rolePermissionDeleteParamsSchema }),
  asyncHandler(rolePermissionsController.remove),
);
