import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { aiAnalysesController } from './aiAnalyses.controller.js';
import {
  aiAnalysisCreateSchema,
  aiAnalysisIdParamSchema,
  aiAnalysisListQuerySchema,
} from './aiAnalyses.schema.js';

export const aiAnalysesRouter = Router();

aiAnalysesRouter.get('/', requireView, validate({ query: aiAnalysisListQuerySchema }), asyncHandler(aiAnalysesController.list));
aiAnalysesRouter.post('/', requireEdit, validate({ body: aiAnalysisCreateSchema }), asyncHandler(aiAnalysesController.create));
aiAnalysesRouter.get('/:id', requireView, validate({ params: aiAnalysisIdParamSchema }), asyncHandler(aiAnalysesController.getById));
aiAnalysesRouter.delete('/:id', requireEdit, validate({ params: aiAnalysisIdParamSchema }), asyncHandler(aiAnalysesController.remove));
