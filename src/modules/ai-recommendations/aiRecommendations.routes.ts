import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { aiRecommendationsController } from './aiRecommendations.controller.js';
import {
  aiRecommendationCreateSchema,
  aiRecommendationIdParamSchema,
  aiRecommendationListQuerySchema,
} from './aiRecommendations.schema.js';

export const aiRecommendationsRouter = Router();

aiRecommendationsRouter.get('/', requireView, validate({ query: aiRecommendationListQuerySchema }), asyncHandler(aiRecommendationsController.list));
aiRecommendationsRouter.post('/', requireEdit, validate({ body: aiRecommendationCreateSchema }), asyncHandler(aiRecommendationsController.create));
aiRecommendationsRouter.get('/:id', requireView, validate({ params: aiRecommendationIdParamSchema }), asyncHandler(aiRecommendationsController.getById));
aiRecommendationsRouter.delete('/:id', requireEdit, validate({ params: aiRecommendationIdParamSchema }), asyncHandler(aiRecommendationsController.remove));
