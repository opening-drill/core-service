import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { logger } from '../lib/logger.js';

/**
 * Lightweight HTTP error with an explicit status code.
 * Services/controllers throw this for expected, mappable failures.
 */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  /**
   * @param code Machine-readable error code surfaced as the response `error`
   *   field (e.g. `NotFound`, `Forbidden`, `Conflict`). Defaults to a name
   *   derived from the status code.
   */
  constructor(statusCode: number, message: string, details?: unknown, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code ?? defaultCodeForStatus(statusCode);
    if (details !== undefined) {
      this.details = details;
    }
  }
}

/** Maps common HTTP status codes to a machine-readable error code. */
function defaultCodeForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'BadRequest';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'NotFound';
    case 409:
      return 'Conflict';
    default:
      return status >= 500 ? 'InternalServerError' : 'Error';
  }
}

/** 404 handler for unmatched routes. Mounted after all routes. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/** Centralized error mapper. Mounted last. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Request validation failed',
      details: err.issues,
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
  });
};
