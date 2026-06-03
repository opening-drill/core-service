import type { Request, Response } from 'express';
import { PermissionType } from '@prisma/client';

import { getParam, getQuery } from '../../middleware/validate.js';
import { permissionsService } from './permissions.service.js';
import type { PermissionCreate } from './permissions.schema.js';
import { permissionListQuerySchema } from './permissions.schema.js';

export const permissionsController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await permissionsService.list(getQuery(req, permissionListQuerySchema)));
  },

  async getByPermission(req: Request, res: Response): Promise<void> {
    res.json(await permissionsService.getByPermission(getParam(req, 'permission') as PermissionType));
  },

  async create(req: Request, res: Response): Promise<void> {
    const { permission } = req.body as PermissionCreate;
    res.status(201).json(await permissionsService.create(permission));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await permissionsService.remove(getParam(req, 'permission') as PermissionType);
    res.status(204).end();
  },
};
