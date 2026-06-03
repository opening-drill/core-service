import type { Request, RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

import { HttpError } from './errorHandler.js';
import type { AuthUser } from '../types/auth.js';

/**
 * Zod request-validation middleware.
 *
 * Validates `body` / `params` / `query` against the supplied schemas. Parsed
 * (and coerced) `body`/`params` are written back onto the request; the parsed
 * query is stored on `req.validatedQuery` because Express 5 exposes `req.query`
 * as a read-only getter. Validation failures surface to the central error
 * handler as a `ZodError` → HTTP 400.
 */
export interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        req.validatedQuery = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as unknown;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Type-safe accessor for the zod-parsed query. The query was already validated
 * by `validate({ query })`, so this narrows `req.validatedQuery` to the
 * schema's inferred type without re-parsing.
 */
export function getQuery<S extends ZodTypeAny>(req: Request, _schema: S): z.infer<S> {
  return req.validatedQuery;
}

/**
 * Reads a required path parameter as a string. The value is guaranteed present
 * by route matching and validated upstream by `validate({ params })`.
 */
export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string') {
    throw new HttpError(400, `Missing path parameter: ${name}`);
  }
  return value;
}

/** Returns the authenticated user or throws 401 if the request is anonymous. */
export function getUser(req: Request): AuthUser {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }
  return req.user;
}
