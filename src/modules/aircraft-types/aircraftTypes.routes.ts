import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { aircraftTypesController } from './aircraftTypes.controller.js';
import {
  aircraftTypeCreateSchema,
  aircraftTypeIdParamSchema,
  aircraftTypeListQuerySchema,
  aircraftTypeUpdateSchema,
} from './aircraftTypes.schema.js';

export const aircraftTypesRouter = Router();

aircraftTypesRouter.get('/', requireView, validate({ query: aircraftTypeListQuerySchema }), asyncHandler(aircraftTypesController.list));
aircraftTypesRouter.post('/', requireEdit, validate({ body: aircraftTypeCreateSchema }), asyncHandler(aircraftTypesController.create));
aircraftTypesRouter.get('/:id', requireView, validate({ params: aircraftTypeIdParamSchema }), asyncHandler(aircraftTypesController.getById));
aircraftTypesRouter.patch('/:id', requireEdit, validate({ params: aircraftTypeIdParamSchema, body: aircraftTypeUpdateSchema }), asyncHandler(aircraftTypesController.update));
aircraftTypesRouter.delete('/:id', requireEdit, validate({ params: aircraftTypeIdParamSchema }), asyncHandler(aircraftTypesController.remove));
