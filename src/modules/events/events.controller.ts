import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { eventsService } from './events.service.js';
import type { EventCreate, EventUpdate } from './events.schema.js';
import { eventListQuerySchema } from './events.schema.js';
import {
  eventsEnvelope,
  toAiContext,
  toContractEventCreated,
  toContractEventDetail,
  toContractEventListItem,
} from './events.serialize.js';

export const eventsController = {
  /** GET /api/events */
  async list(req: Request, res: Response): Promise<void> {
    const result = await eventsService.list(getQuery(req, eventListQuerySchema));
    res.json(eventsEnvelope(result.data.map(toContractEventListItem)));
  },

  /** GET /api/events/:event_id */
  async getById(req: Request, res: Response): Promise<void> {
    res.json(toContractEventDetail(await eventsService.getById(getParam(req, 'id'))));
  },

  /** GET /api/events/:event_id/ai-context */
  async aiContext(req: Request, res: Response): Promise<void> {
    const { event, aircrafts } = await eventsService.getAiContext(getParam(req, 'id'));
    res.json(toAiContext(event, aircrafts));
  },

  /** POST /api/events */
  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(toContractEventCreated(await eventsService.create(req.body as EventCreate)));
  },

  /** PATCH /api/events/:event_id */
  async update(req: Request, res: Response): Promise<void> {
    const updated = await eventsService.update(getParam(req, 'id'), req.body as EventUpdate);
    res.json({ ok: true, update_date: updated.update_date });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await eventsService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
