import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { rolePermissionsRouter } from '../role-permissions/rolePermissions.routes.js';
import { rolesController } from './roles.controller.js';
import {
  roleCreateSchema,
  roleIdParamSchema,
  roleListQuerySchema,
  roleUpdateSchema,
} from './roles.schema.js';

export const rolesRouter = Router();

rolesRouter.get(
  '/',
  requireView,
  validate({ query: roleListQuerySchema }),
  asyncHandler(rolesController.list),
);
rolesRouter.post(
  '/',
  requireEdit,
  validate({ body: roleCreateSchema }),
  asyncHandler(rolesController.create),
);
rolesRouter.get(
  '/:id',
  requireView,
  validate({ params: roleIdParamSchema }),
  asyncHandler(rolesController.getById),
);
rolesRouter.patch(
  '/:id',
  requireEdit,
  validate({ params: roleIdParamSchema, body: roleUpdateSchema }),
  asyncHandler(rolesController.update),
);
rolesRouter.delete(
  '/:id',
  requireEdit,
  validate({ params: roleIdParamSchema }),
  asyncHandler(rolesController.remove),
);

// Nested: permission assignments for a role.
rolesRouter.use('/:roleId/permissions', rolePermissionsRouter);
