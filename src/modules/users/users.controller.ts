import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { usersService } from './users.service.js';
import type { UserAuth, UserCreate, UserSignup, UserUpdate } from './users.schema.js';
import { userListQuerySchema } from './users.schema.js';

export const usersController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await usersService.list(getQuery(req, userListQuerySchema));
    res.json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await usersService.getById(getParam(req, 'id')));
  },

  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await usersService.create(req.body as UserCreate));
  },

  async update(req: Request, res: Response): Promise<void> {
    res.json(await usersService.update(getParam(req, 'id'), req.body as UserUpdate));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await usersService.remove(getParam(req, 'id'));
    res.status(204).end();
  },

  /** GET /api/users/:user_id/permissions */
  async permissions(req: Request, res: Response): Promise<void> {
    res.json(await usersService.permissions(getParam(req, 'userId')));
  },

  /** POST /api/users/auth — verify username/password (`X-Api-Key` in header). */
  async authenticate(req: Request, res: Response): Promise<void> {
    res.json(await usersService.authenticate(req.body as UserAuth));
  },

  /** POST /api/users/signup — provision a user (`X-Api-Key` required). */
  async signup(req: Request, res: Response): Promise<void> {
    res.status(201).json(await usersService.signup(req.body as UserSignup));
  },
};
