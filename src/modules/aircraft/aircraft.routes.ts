import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { pathHistoryController } from '../aircraft-path-history/pathHistory.controller.js';
import { pathHistoryRouter } from '../aircraft-path-history/pathHistory.routes.js';
import { pathHistoryParamsSchema } from '../aircraft-path-history/pathHistory.schema.js';
import { aircraftController } from './aircraft.controller.js';
import {
  aircraftCreateSchema,
  aircraftIdParamSchema,
  aircraftListQuerySchema,
  aircraftUpdateSchema,
} from './aircraft.schema.js';

export const aircraftRouter = Router();

aircraftRouter.get('/', requireView, validate({ query: aircraftListQuerySchema }), asyncHandler(aircraftController.list));
aircraftRouter.post('/', requireEdit, validate({ body: aircraftCreateSchema }), asyncHandler(aircraftController.create));

// Telemetry — latest position + path history (nested, mergeParams).
aircraftRouter.get(
  '/:aircraftId/latest-position',
  requireView,
  validate({ params: pathHistoryParamsSchema }),
  asyncHandler(pathHistoryController.latest),
);
aircraftRouter.use('/:aircraftId/path-history', pathHistoryRouter);

aircraftRouter.get('/:id', requireView, validate({ params: aircraftIdParamSchema }), asyncHandler(aircraftController.getById));
aircraftRouter.patch('/:id', requireEdit, validate({ params: aircraftIdParamSchema, body: aircraftUpdateSchema }), asyncHandler(aircraftController.update));
aircraftRouter.delete('/:id', requireEdit, validate({ params: aircraftIdParamSchema }), asyncHandler(aircraftController.remove));
