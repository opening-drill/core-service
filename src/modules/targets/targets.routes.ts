import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { targetsController } from './targets.controller.js';
import {
  targetCreateSchema,
  targetIdParamSchema,
  targetListQuerySchema,
  targetUpdateSchema,
} from './targets.schema.js';

export const targetsRouter = Router();

targetsRouter.get('/', requireView, validate({ query: targetListQuerySchema }), asyncHandler(targetsController.list));
targetsRouter.post('/', requireEdit, validate({ body: targetCreateSchema }), asyncHandler(targetsController.create));
targetsRouter.get('/:id', requireView, validate({ params: targetIdParamSchema }), asyncHandler(targetsController.getById));
targetsRouter.patch('/:id', requireEdit, validate({ params: targetIdParamSchema, body: targetUpdateSchema }), asyncHandler(targetsController.update));
targetsRouter.delete('/:id', requireEdit, validate({ params: targetIdParamSchema }), asyncHandler(targetsController.remove));
