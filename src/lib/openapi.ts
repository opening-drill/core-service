/**
 * OpenAPI 3.0 document served at /docs (swagger-ui-express) and /openapi.json.
 * Composed from per-module fragments so each module owns its own paths/schemas.
 */
import { authOpenapi } from '../modules/auth/auth.openapi.js';
import { aiAnalysesOpenapi } from '../modules/ai-analyses/aiAnalyses.openapi.js';
import { aiRecommendationsOpenapi } from '../modules/ai-recommendations/aiRecommendations.openapi.js';
import { aircraftOpenapi } from '../modules/aircraft/aircraft.openapi.js';
import { aircraftTypesOpenapi } from '../modules/aircraft-types/aircraftTypes.openapi.js';
import { eventsOpenapi } from '../modules/events/events.openapi.js';
import { permissionsOpenapi } from '../modules/permissions/permissions.openapi.js';
import { picturesOpenapi } from '../modules/pictures/pictures.openapi.js';
import { polygonsOpenapi } from '../modules/polygons/polygons.openapi.js';
import { rolesOpenapi } from '../modules/roles/roles.openapi.js';
import { targetsOpenapi } from '../modules/targets/targets.openapi.js';
import { usersOpenapi } from '../modules/users/users.openapi.js';
import {
  errorSchema,
  type OpenapiFragment,
  type OpenapiPaths,
  type OpenapiSchemas,
  type OpenapiTag,
} from './openapiHelpers.js';

const fragments: OpenapiFragment[] = [
  authOpenapi,
  usersOpenapi,
  rolesOpenapi,
  permissionsOpenapi,
  polygonsOpenapi,
  targetsOpenapi,
  aircraftTypesOpenapi,
  aircraftOpenapi,
  picturesOpenapi,
  eventsOpenapi,
  aiRecommendationsOpenapi,
  aiAnalysesOpenapi,
];

const healthPath: OpenapiPaths = {
  '/health': {
    get: {
      summary: 'Liveness/readiness probe',
      tags: ['system'],
      responses: {
        '200': {
          description: 'Service is up',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ok' },
                  uptime: { type: 'number', example: 12.34 },
                  timestamp: { type: 'string', format: 'date-time' },
                },
                required: ['status', 'uptime', 'timestamp'],
              },
            },
          },
        },
      },
    },
  },
};

const mergedPaths: OpenapiPaths = fragments.reduce<OpenapiPaths>(
  (acc, fragment) => ({ ...acc, ...fragment.paths }),
  { ...healthPath },
);

/** Shared `{ lng, lat }` coordinate schema referenced across contract fragments. */
const lngLatSchema: OpenapiSchemas[string] = {
  type: 'object',
  properties: {
    lng: { type: 'number', minimum: -180, maximum: 180 },
    lat: { type: 'number', minimum: -90, maximum: 90 },
  },
  required: ['lng', 'lat'],
};

const mergedSchemas: OpenapiSchemas = fragments.reduce<OpenapiSchemas>(
  (acc, fragment) => ({ ...acc, ...fragment.schemas }),
  { Error: errorSchema, LngLat: lngLatSchema },
);

const mergedTags: OpenapiTag[] = [
  { name: 'system', description: 'Health & operational endpoints' },
  ...fragments.flatMap((fragment) => fragment.tags),
];

export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Core Service API',
    version: '0.1.0',
    description:
      'System of record for the AI aircraft-recommendation platform. ' +
      'Exposes CRUD + lifecycle endpoints for every domain entity. ' +
      'All `/api/*` endpoints require header `X-Api-Key` (env `API_KEY`).',
  },
  servers: [{ url: '/', description: 'Current host' }],
  security: [{ apiKey: [] }],
  paths: mergedPaths,
  components: {
    securitySchemes: {
      apiKey: { type: 'apiKey', in: 'header', name: 'X-Api-Key' },
    },
    schemas: mergedSchemas,
  },
  tags: mergedTags,
};
