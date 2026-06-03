import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { aiRecommendationsService } from './aiRecommendations.service.js';
import type { AiRecommendationCreate } from './aiRecommendations.schema.js';
import { aiRecommendationListQuerySchema } from './aiRecommendations.schema.js';

export const aiRecommendationsController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await aiRecommendationsService.list(getQuery(req, aiRecommendationListQuerySchema)));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await aiRecommendationsService.getById(getParam(req, 'id')));
  },

  /** POST /api/ai-recommendations — store and link to the event. */
  async create(req: Request, res: Response): Promise<void> {
    const rec = await aiRecommendationsService.create(req.body as AiRecommendationCreate);
    res.status(201).json({ ai_recommendation_id: rec.id });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await aiRecommendationsService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
