/**
 * Base OpenAPI 3.0 document served at /docs via swagger-ui-express.
 * Entity modules will register their paths/schemas here in later milestones.
 */
export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Core Service API',
    version: '0.1.0',
    description:
      'System of record for the AI aircraft-recommendation platform. ' +
      'Exposes CRUD + lifecycle endpoints for every domain entity.',
  },
  servers: [{ url: '/', description: 'Current host' }],
  paths: {
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
  },
  components: {
    securitySchemes: {
      basicAuth: { type: 'http', scheme: 'basic' },
    },
  },
  tags: [{ name: 'system', description: 'Health & operational endpoints' }],
} as const;
