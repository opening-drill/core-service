import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { eventsController } from './events.controller.js';
import {
  eventCreateSchema,
  eventIdParamSchema,
  eventListQuerySchema,
  eventUpdateSchema,
} from './events.schema.js';

export const eventsRouter = Router();

eventsRouter.get('/', requireView, validate({ query: eventListQuerySchema }), asyncHandler(eventsController.list));
eventsRouter.post('/', requireEdit, validate({ body: eventCreateSchema }), asyncHandler(eventsController.create));
eventsRouter.get('/:id', requireView, validate({ params: eventIdParamSchema }), asyncHandler(eventsController.getById));
eventsRouter.patch('/:id', requireEdit, validate({ params: eventIdParamSchema, body: eventUpdateSchema }), asyncHandler(eventsController.update));
eventsRouter.delete('/:id', requireEdit, validate({ params: eventIdParamSchema }), asyncHandler(eventsController.remove));
