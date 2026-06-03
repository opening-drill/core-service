import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { eventsService } from './events.service.js';
import type { EventCreate, EventUpdate } from './events.schema.js';
import { eventListQuerySchema } from './events.schema.js';

export const eventsController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await eventsService.list(getQuery(req, eventListQuerySchema)));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await eventsService.getById(getParam(req, 'id')));
  },

  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await eventsService.create(req.body as EventCreate));
  },

  async update(req: Request, res: Response): Promise<void> {
    res.json(await eventsService.update(getParam(req, 'id'), req.body as EventUpdate));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await eventsService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
