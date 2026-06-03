import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { targetsService } from './targets.service.js';
import type { TargetCreate, TargetUpdate } from './targets.schema.js';
import { targetListQuerySchema } from './targets.schema.js';

export const targetsController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await targetsService.list(getQuery(req, targetListQuerySchema)));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await targetsService.getById(getParam(req, 'id')));
  },

  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await targetsService.create(req.body as TargetCreate));
  },

  async update(req: Request, res: Response): Promise<void> {
    res.json(await targetsService.update(getParam(req, 'id'), req.body as TargetUpdate));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await targetsService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
