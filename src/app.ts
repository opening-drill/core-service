import express, { type Express, type Request, type Response } from 'express';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { logger } from './lib/logger.js';
import { openapiDocument } from './lib/openapi.js';
import { apiKeyAuth } from './middleware/apiKeyAuth.js';
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
import { usersAuthRouter, usersRouter, usersSignupRouter } from './modules/users/users.routes.js';

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

  // Entity modules — each requires `X-Api-Key` (env API_KEY).
  // /health, /docs and /openapi.json stay public. apiKeyAuth is applied per-mount
  // (not globally) so unmatched routes still reach notFoundHandler.
  app.use('/api/auth', apiKeyAuth, authRouter);
  app.use('/api/users/auth', usersAuthRouter);
  app.use('/api/users/signup', usersSignupRouter);
  app.use('/api/users', apiKeyAuth, usersRouter);
  app.use('/api/roles', apiKeyAuth, rolesRouter);
  app.use('/api/permissions', apiKeyAuth, permissionsRouter);
  app.use('/api/polygons', apiKeyAuth, polygonsRouter);
  app.use('/api/targets', apiKeyAuth, targetsRouter);
  app.use('/api/aircraft-types', apiKeyAuth, aircraftTypesRouter);
  app.use('/api/aircraft', apiKeyAuth, aircraftRouter);
  app.use('/api/storage/pictures', apiKeyAuth, picturesRouter);
  app.use('/api/events', apiKeyAuth, eventsRouter);
  app.use('/api/ai-recommendations', apiKeyAuth, aiRecommendationsRouter);
  app.use('/api/ai-analysis', apiKeyAuth, aiAnalysesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
