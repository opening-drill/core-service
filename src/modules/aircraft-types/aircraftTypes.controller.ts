import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { aircraftTypesService } from './aircraftTypes.service.js';
import type { AircraftTypeCreate, AircraftTypeUpdate } from './aircraftTypes.schema.js';
import { aircraftTypeListQuerySchema } from './aircraftTypes.schema.js';

export const aircraftTypesController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await aircraftTypesService.list(getQuery(req, aircraftTypeListQuerySchema)));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await aircraftTypesService.getById(getParam(req, 'id')));
  },

  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await aircraftTypesService.create(req.body as AircraftTypeCreate));
  },

  async update(req: Request, res: Response): Promise<void> {
    res.json(await aircraftTypesService.update(getParam(req, 'id'), req.body as AircraftTypeUpdate));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await aircraftTypesService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
