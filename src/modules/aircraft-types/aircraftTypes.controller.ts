import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { aircraftService } from '../aircraft/aircraft.service.js';
import { aircraftByTypeQuerySchema } from '../aircraft/aircraft.schema.js';
import {
  aircraftEnvelope,
  toContractAircraftListItem,
} from '../aircraft/aircraft.serialize.js';
import { aircraftTypesService } from './aircraftTypes.service.js';
import type { AircraftTypeCreate, AircraftTypeUpdate } from './aircraftTypes.schema.js';
import { aircraftTypeListQuerySchema } from './aircraftTypes.schema.js';

export const aircraftTypesController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await aircraftTypesService.list(getQuery(req, aircraftTypeListQuerySchema)));
  },

  /** GET /api/aircraft-types/:typeId/aircraft — list aircraft for this type. */
  async listAircraft(req: Request, res: Response): Promise<void> {
    const typeId = getParam(req, 'typeId');
    const query = getQuery(req, aircraftByTypeQuerySchema);
    const rows = await aircraftService.listByTypeId(
      typeId,
      query.status !== undefined ? { status: query.status } : {},
    );
    res.json(aircraftEnvelope(rows.map(toContractAircraftListItem)));
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
