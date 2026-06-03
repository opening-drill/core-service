import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { pathHistoryService } from './pathHistory.service.js';
import type { PathHistoryCreate } from './pathHistory.schema.js';
import { pathHistoryListQuerySchema } from './pathHistory.schema.js';

export const pathHistoryController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(
      await pathHistoryService.list(getParam(req, 'aircraftId'), getQuery(req, pathHistoryListQuerySchema)),
    );
  },

  async create(req: Request, res: Response): Promise<void> {
    res
      .status(201)
      .json(await pathHistoryService.create(getParam(req, 'aircraftId'), req.body as PathHistoryCreate));
  },

  async latest(req: Request, res: Response): Promise<void> {
    res.json(await pathHistoryService.latest(getParam(req, 'aircraftId')));
  },
};
