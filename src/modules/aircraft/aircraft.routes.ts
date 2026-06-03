import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { pathHistoryController } from '../aircraft-path-history/pathHistory.controller.js';
import { pathHistoryRouter } from '../aircraft-path-history/pathHistory.routes.js';
import {
  aircraftPathQuerySchema,
  aircraftTrackQuerySchema,
  pathHistoryBatchSchema,
  pathHistoryParamsSchema,
} from '../aircraft-path-history/pathHistory.schema.js';
import { aircraftController } from './aircraft.controller.js';
import {
  aircraftCreateSchema,
  aircraftIdParamSchema,
  aircraftListQuerySchema,
  aircraftLiveQuerySchema,
  aircraftUpdateSchema,
} from './aircraft.schema.js';

export const aircraftRouter = Router();

aircraftRouter.get('/', requireView, validate({ query: aircraftListQuerySchema }), asyncHandler(aircraftController.list));
aircraftRouter.post('/', requireEdit, validate({ body: aircraftCreateSchema }), asyncHandler(aircraftController.create));

// Fleet-wide endpoints (literal paths must precede the `/:id` matcher).
aircraftRouter.get('/live', requireView, validate({ query: aircraftLiveQuerySchema }), asyncHandler(aircraftController.live));
aircraftRouter.post(
  '/path-history-batch',
  requireEdit,
  validate({ body: pathHistoryBatchSchema }),
  asyncHandler(pathHistoryController.batch),
);

// Telemetry — latest position, path, track, and nested path-history (mergeParams).
aircraftRouter.get(
  '/:aircraftId/latest-position',
  requireView,
  validate({ params: pathHistoryParamsSchema }),
  asyncHandler(pathHistoryController.latest),
);
aircraftRouter.get(
  '/:aircraftId/path',
  requireView,
  validate({ params: pathHistoryParamsSchema, query: aircraftPathQuerySchema }),
  asyncHandler(pathHistoryController.path),
);
aircraftRouter.get(
  '/:aircraftId/track',
  requireView,
  validate({ params: pathHistoryParamsSchema, query: aircraftTrackQuerySchema }),
  asyncHandler(pathHistoryController.track),
);
aircraftRouter.use('/:aircraftId/path-history', pathHistoryRouter);

aircraftRouter.get('/:id', requireView, validate({ params: aircraftIdParamSchema }), asyncHandler(aircraftController.getById));
aircraftRouter.patch('/:id', requireEdit, validate({ params: aircraftIdParamSchema, body: aircraftUpdateSchema }), asyncHandler(aircraftController.update));
aircraftRouter.delete('/:id', requireEdit, validate({ params: aircraftIdParamSchema }), asyncHandler(aircraftController.remove));
