import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { aiAnalysesService } from './aiAnalyses.service.js';
import type { AiAnalysisCreate } from './aiAnalyses.schema.js';
import { aiAnalysisListQuerySchema } from './aiAnalyses.schema.js';

export const aiAnalysesController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await aiAnalysesService.list(getQuery(req, aiAnalysisListQuerySchema)));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await aiAnalysesService.getById(getParam(req, 'id')));
  },

  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await aiAnalysesService.create(req.body as AiAnalysisCreate));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await aiAnalysesService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
