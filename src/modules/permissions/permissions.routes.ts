import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { permissionsController } from './permissions.controller.js';
import {
  permissionCreateSchema,
  permissionListQuerySchema,
  permissionParamSchema,
} from './permissions.schema.js';

export const permissionsRouter = Router();

permissionsRouter.get(
  '/',
  requireView,
  validate({ query: permissionListQuerySchema }),
  asyncHandler(permissionsController.list),
);
permissionsRouter.post(
  '/',
  requireEdit,
  validate({ body: permissionCreateSchema }),
  asyncHandler(permissionsController.create),
);
permissionsRouter.get(
  '/:permission',
  requireView,
  validate({ params: permissionParamSchema }),
  asyncHandler(permissionsController.getByPermission),
);
permissionsRouter.delete(
  '/:permission',
  requireEdit,
  validate({ params: permissionParamSchema }),
  asyncHandler(permissionsController.remove),
);
