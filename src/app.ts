import express, { type Express, type Request, type Response } from 'express';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { logger } from './lib/logger.js';
import { openapiDocument } from './lib/openapi.js';
import { basicAuth } from './middleware/basicAuth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { aiAnalysesRouter } from './modules/ai-analyses/aiAnalyses.routes.js';
import { aiRecommendationsRouter } from './modules/ai-recommendations/aiRecommendations.routes.js';
import { aircraftRouter } from './modules/aircraft/aircraft.routes.js';
import { aircraftTypesRouter } from './modules/aircraft-types/aircraftTypes.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { eventsRouter } from './modules/events/events.routes.js';
import { permissionsRouter } from './modules/permissions/permissions.routes.js';
import { picturesRouter } from './modules/pictures/pictures.routes.js';
import { polygonsRouter } from './modules/polygons/polygons.routes.js';
import { rolesRouter } from './modules/roles/roles.routes.js';
import { targetsRouter } from './modules/targets/targets.routes.js';
import { usersAuthRouter, usersRouter } from './modules/users/users.routes.js';

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

  // Entity modules — each requires an authenticated identity (HTTP Basic);
  // /health, /docs and /openapi.json above stay public. basicAuth is applied
  // per-mount (not globally) so unmatched routes still reach notFoundHandler.
  // All routes live under the `/api` prefix per the live-data contract.
  app.use('/api/auth', basicAuth, authRouter);
  // Public login endpoint — must precede the basicAuth-protected /api/users mount.
  app.use('/api/users/auth', usersAuthRouter);
  app.use('/api/users', basicAuth, usersRouter);
  app.use('/api/roles', basicAuth, rolesRouter);
  app.use('/api/permissions', basicAuth, permissionsRouter);
  app.use('/api/polygons', basicAuth, polygonsRouter);
  app.use('/api/targets', basicAuth, targetsRouter);
  app.use('/api/aircraft-types', basicAuth, aircraftTypesRouter);
  app.use('/api/aircraft', basicAuth, aircraftRouter);
  // Pictures are exposed under the contract's storage namespace.
  app.use('/api/storage/pictures', basicAuth, picturesRouter);
  app.use('/api/events', basicAuth, eventsRouter);
  app.use('/api/ai-recommendations', basicAuth, aiRecommendationsRouter);
  app.use('/api/ai-analysis', basicAuth, aiAnalysesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
