import type { Request, Response } from 'express';
import { PermissionType } from '@prisma/client';

import { getParam } from '../../middleware/validate.js';
import { rolePermissionsService } from './rolePermissions.service.js';
import type { RolePermissionCreate } from './rolePermissions.schema.js';

export const rolePermissionsController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await rolePermissionsService.list(getParam(req, 'roleId')));
  },

  async assign(req: Request, res: Response): Promise<void> {
    const { permission } = req.body as RolePermissionCreate;
    res.status(201).json(await rolePermissionsService.assign(getParam(req, 'roleId'), permission));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await rolePermissionsService.remove(
      getParam(req, 'roleId'),
      getParam(req, 'permission') as PermissionType,
    );
    res.status(204).end();
  },
};
