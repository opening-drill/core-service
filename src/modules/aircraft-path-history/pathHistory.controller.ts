import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { pathHistoryService } from './pathHistory.service.js';
import type { PathHistoryBatch, PathHistoryCreate } from './pathHistory.schema.js';
import {
  aircraftPathQuerySchema,
  aircraftTrackQuerySchema,
  pathHistoryListQuerySchema,
} from './pathHistory.schema.js';
import { toContractPathPoint, toContractTrackPoint } from './pathHistory.serialize.js';

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

  /** GET /api/aircraft/:aircraft_id/path */
  async path(req: Request, res: Response): Promise<void> {
    const aircraftId = getParam(req, 'aircraftId');
    const points = await pathHistoryService.path(aircraftId, getQuery(req, aircraftPathQuerySchema));
    res.json({ aircraft_id: aircraftId, points: points.map(toContractPathPoint) });
  },

  /** GET /api/aircraft/:aircraft_id/track */
  async track(req: Request, res: Response): Promise<void> {
    const aircraftId = getParam(req, 'aircraftId');
    const points = await pathHistoryService.track(aircraftId, getQuery(req, aircraftTrackQuerySchema));
    res.json({ aircraft_id: aircraftId, points: points.map(toContractTrackPoint) });
  },

  /** POST /api/aircraft/path-history-batch — bulk position write. */
  async batch(req: Request, res: Response): Promise<void> {
    res.status(201).json(await pathHistoryService.insertBatch(req.body as PathHistoryBatch));
  },
};
