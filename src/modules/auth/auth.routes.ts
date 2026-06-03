import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { authController } from './auth.controller.js';

// basicAuth runs globally before this router; any authenticated user may call.
export const authRouter = Router();

authRouter.get('/me', asyncHandler(authController.me));
