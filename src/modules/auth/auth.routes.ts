import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { authController } from './auth.controller.js';

// apiKeyAuth runs before this router.
export const authRouter = Router();

authRouter.get('/me', asyncHandler(authController.me));
