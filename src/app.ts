import express, { type Express, type Request, type Response } from 'express';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { logger } from './lib/logger.js';
import { openapiDocument } from './lib/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

/**
 * Express application factory: wires middleware, the Swagger UI, and routes.
 * Kept free of network/listener concerns so it can be imported directly in
 * tests (supertest) without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '5mb' }));
  app.use(pinoHttp({ logger }));

  // Liveness/readiness probe.
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Interactive API documentation.
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  app.get('/openapi.json', (_req: Request, res: Response) => {
    res.status(200).json(openapiDocument);
  });

  // Entity modules (events, aircraft, targets, …) mount here in later milestones.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
