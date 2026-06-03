import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { rolesService } from './roles.service.js';
import type { RoleCreate, RoleUpdate } from './roles.schema.js';
import { roleListQuerySchema } from './roles.schema.js';

export const rolesController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await rolesService.list(getQuery(req, roleListQuerySchema)));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await rolesService.getById(getParam(req, 'id')));
  },

  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await rolesService.create(req.body as RoleCreate));
  },

  async update(req: Request, res: Response): Promise<void> {
    res.json(await rolesService.update(getParam(req, 'id'), req.body as RoleUpdate));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await rolesService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
