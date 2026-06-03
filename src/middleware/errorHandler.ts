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
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR';
  }
}

/**
 * Normalizes any error code to the SCREAMING_SNAKE_CASE the live-data contract
 * expects (`{ error: { code, message } }`). Accepts legacy PascalCase codes
 * (`NotFound`, `StorageNotConfigured`) thrown elsewhere in the codebase and
 * converts them in one place, so call sites need not be swept.
 */
function normalizeCode(code: string): string {
  return code
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

/** 404 handler for unmatched routes. Mounted after all routes. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
};

/** Centralized error mapper. Mounted last. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues,
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: {
        code: normalizeCode(err.code),
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Malformed JSON from express.json() / body-parser (e.g. trailing commas).
  const parserStatus =
    typeof err === 'object' && err !== null && 'status' in err
      ? (err as { status: unknown }).status
      : undefined;
  if (err instanceof SyntaxError && parserStatus === 400) {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request body must be valid JSON (check for trailing commas or unquoted keys)',
      },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
