import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { polygonsService } from './polygons.service.js';
import type { PolygonCreate, PolygonUpdate } from './polygons.schema.js';
import { polygonListQuerySchema } from './polygons.schema.js';
import { polygonsEnvelope, toContractPolygon } from './polygons.serialize.js';

export const polygonsController = {
  /** GET /api/polygons (?active=true) — active danger zones. */
  async list(req: Request, res: Response): Promise<void> {
    const result = await polygonsService.list(getQuery(req, polygonListQuerySchema));
    res.json(polygonsEnvelope(result.data.map(toContractPolygon)));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await polygonsService.getById(getParam(req, 'id')));
  },

  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await polygonsService.create(req.body as PolygonCreate));
  },

  async update(req: Request, res: Response): Promise<void> {
    res.json(await polygonsService.update(getParam(req, 'id'), req.body as PolygonUpdate));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await polygonsService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
