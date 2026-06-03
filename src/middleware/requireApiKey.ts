import type { RequestHandler } from 'express';

import { isApiKeyConfigured, isApiKeyValid } from '../lib/apiKey.js';
import { HttpError } from './errorHandler.js';

function unauthorized(message: string): HttpError {
  return new HttpError(401, message, undefined, 'Unauthorized');
}

/** Requires a valid `X-Api-Key` without attaching `req.user` (public pre-auth routes). */
export const requireApiKey: RequestHandler = (req, _res, next) => {
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

  next();
};
