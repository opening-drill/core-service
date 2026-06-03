import type { Request, Response } from 'express';

import { getParam } from '../../middleware/validate.js';
import { userRolesService } from './userRoles.service.js';
import type { UserRoleCreate } from './userRoles.schema.js';

export const userRolesController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await userRolesService.list(getParam(req, 'userId')));
  },

  async assign(req: Request, res: Response): Promise<void> {
    res.status(201).json(await userRolesService.assign(getParam(req, 'userId'), req.body as UserRoleCreate));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await userRolesService.remove(getParam(req, 'userId'), getParam(req, 'roleId'));
    res.status(204).end();
  },
};
