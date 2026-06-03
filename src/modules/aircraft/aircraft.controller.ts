import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { aircraftService } from './aircraft.service.js';
import type { AircraftCreate, AircraftUpdate } from './aircraft.schema.js';
import { aircraftListQuerySchema } from './aircraft.schema.js';

export const aircraftController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await aircraftService.list(getQuery(req, aircraftListQuerySchema)));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await aircraftService.getById(getParam(req, 'id')));
  },

  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await aircraftService.create(req.body as AircraftCreate));
  },

  async update(req: Request, res: Response): Promise<void> {
    res.json(await aircraftService.update(getParam(req, 'id'), req.body as AircraftUpdate));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await aircraftService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
