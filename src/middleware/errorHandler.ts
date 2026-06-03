import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { logger } from '../lib/logger.js';

/**
 * Lightweight HTTP error with an explicit status code.
 * Services/controllers throw this for expected, mappable failures.
 */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    if (details !== undefined) {
      this.details = details;
    }
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
      error: err.name,
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
