import type { Request, Response } from 'express';

import { getUser } from '../../middleware/validate.js';
import { authService } from './auth.service.js';

export const authController = {
  async me(req: Request, res: Response): Promise<void> {
    res.json(await authService.me(getUser(req)));
  },
};
