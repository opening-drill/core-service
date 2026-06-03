import type { RequestHandler } from 'express';

import { isApiKeyConfigured, isApiKeyValid } from '../lib/apiKey.js';
import { HttpError } from './errorHandler.js';

/** Synthetic principal attached when `X-Api-Key` is valid. */
export const API_KEY_PRINCIPAL = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'api-key',
  full_name: 'API Key Client',
} as const;

function unauthorized(message: string): HttpError {
  return new HttpError(401, message, undefined, 'Unauthorized');
}

/**
 * Authenticates requests via `X-Api-Key` (env `API_KEY`).
 * Attaches `req.user` with a synthetic principal; RBAC grants full access.
 */
export const apiKeyAuth: RequestHandler = (req, _res, next) => {
  if (!isApiKeyConfigured()) {
    next(
      new HttpError(
        503,
        'API authentication is not configured (missing API_KEY)',
        undefined,
        'AuthNotConfigured',
      ),
    );
    return;
  }

  const provided = req.header('x-api-key');
  if (!provided || !isApiKeyValid(provided)) {
    next(unauthorized('Invalid or missing X-Api-Key'));
    return;
  }

  req.user = { ...API_KEY_PRINCIPAL };
  next();
};
