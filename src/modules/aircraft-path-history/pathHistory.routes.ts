import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { pathHistoryController } from './pathHistory.controller.js';
import {
  pathHistoryCreateSchema,
  pathHistoryListQuerySchema,
  pathHistoryParamsSchema,
} from './pathHistory.schema.js';

// mergeParams: inherit `:aircraftId` from the parent /aircraft router.
// Mounted at /aircraft/:aircraftId/path-history.
export const pathHistoryRouter = Router({ mergeParams: true });

pathHistoryRouter.get(
  '/',
  requireView,
  validate({ params: pathHistoryParamsSchema, query: pathHistoryListQuerySchema }),
  asyncHandler(pathHistoryController.list),
);
pathHistoryRouter.post(
  '/',
  requireEdit,
  validate({ params: pathHistoryParamsSchema, body: pathHistoryCreateSchema }),
  asyncHandler(pathHistoryController.create),
);
