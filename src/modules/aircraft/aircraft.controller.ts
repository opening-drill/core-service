import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { aircraftService } from './aircraft.service.js';
import type { AircraftCreate, AircraftUpdate } from './aircraft.schema.js';
import { aircraftListQuerySchema, aircraftLiveQuerySchema } from './aircraft.schema.js';
import {
  aircraftEnvelope,
  toContractAircraftListItem,
  toContractAircraftLive,
} from './aircraft.serialize.js';

export const aircraftController = {
  /** GET /api/aircraft (?status=) — list available aircraft. */
  async list(req: Request, res: Response): Promise<void> {
    const result = await aircraftService.list(getQuery(req, aircraftListQuerySchema));
    res.json(aircraftEnvelope(result.data.map(toContractAircraftListItem)));
  },

  /** GET /api/aircraft/live — all drones, latest position each. */
  async live(req: Request, res: Response): Promise<void> {
    const { status } = getQuery(req, aircraftLiveQuerySchema);
    const rows = await aircraftService.live(status);
    res.json(aircraftEnvelope(rows.map(({ aircraft, latest }) => toContractAircraftLive(aircraft, latest))));
  },

  // Internal (non-contract): single aircraft fetch.
  async getById(req: Request, res: Response): Promise<void> {
    res.json(await aircraftService.getById(getParam(req, 'id')));
  },

  // Internal (non-contract): create an aircraft.
  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await aircraftService.create(req.body as AircraftCreate));
  },

  /** PATCH /api/aircraft/:aircraft_id — update drone metadata. */
  async update(req: Request, res: Response): Promise<void> {
    const updated = await aircraftService.update(getParam(req, 'id'), req.body as AircraftUpdate);
    res.json({ ok: true, update_date: updated.update_date });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await aircraftService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
