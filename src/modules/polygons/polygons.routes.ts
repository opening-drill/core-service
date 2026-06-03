import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { polygonsController } from './polygons.controller.js';
import {
  polygonCreateSchema,
  polygonIdParamSchema,
  polygonListQuerySchema,
  polygonUpdateSchema,
} from './polygons.schema.js';

export const polygonsRouter = Router();

polygonsRouter.get('/', requireView, validate({ query: polygonListQuerySchema }), asyncHandler(polygonsController.list));
polygonsRouter.post('/', requireEdit, validate({ body: polygonCreateSchema }), asyncHandler(polygonsController.create));
polygonsRouter.get('/:id', requireView, validate({ params: polygonIdParamSchema }), asyncHandler(polygonsController.getById));
polygonsRouter.patch('/:id', requireEdit, validate({ params: polygonIdParamSchema, body: polygonUpdateSchema }), asyncHandler(polygonsController.update));
polygonsRouter.delete('/:id', requireEdit, validate({ params: polygonIdParamSchema }), asyncHandler(polygonsController.remove));
