import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { targetsService } from './targets.service.js';
import type { TargetCreate, TargetUpdate } from './targets.schema.js';
import { targetListQuerySchema } from './targets.schema.js';
import { toContractTarget, toContractTargetCreated } from './targets.serialize.js';

export const targetsController = {
  // Internal (non-contract) list endpoint — keeps the `{ data, meta }` envelope.
  async list(req: Request, res: Response): Promise<void> {
    res.json(await targetsService.list(getQuery(req, targetListQuerySchema)));
  },

  /** GET /api/targets/:target_id */
  async getById(req: Request, res: Response): Promise<void> {
    res.json(toContractTarget(await targetsService.getById(getParam(req, 'id'))));
  },

  /** POST /api/targets */
  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(toContractTargetCreated(await targetsService.create(req.body as TargetCreate)));
  },

  /** PATCH /api/targets/:target_id — update status. */
  async update(req: Request, res: Response): Promise<void> {
    await targetsService.update(getParam(req, 'id'), req.body as TargetUpdate);
    res.json({ ok: true });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await targetsService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
