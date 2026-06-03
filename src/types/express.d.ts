import type { AuthUser } from './auth.js';

/**
 * Express `Request` augmentation.
 *
 * - `user` is attached by `basicAuth` once the caller is authenticated.
 * - `validatedQuery` holds the zod-parsed query string (Express 5 makes
 *   `req.query` read-only, so `validate()` cannot reassign it directly).
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      validatedQuery?: unknown;
    }
  }
}

export {};
