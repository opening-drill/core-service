import { errorResponses, jsonContent, ref, type OpenapiFragment } from '../../lib/openapiHelpers.js';

const Me = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    username: { type: 'string' },
    full_name: { type: 'string' },
    roles: { type: 'array', items: { type: 'string' } },
    permissions: { type: 'array', items: { type: 'string', enum: ['VIEW', 'EDIT'] } },
  },
  required: ['id', 'username', 'full_name', 'roles', 'permissions'],
};

export const authOpenapi: OpenapiFragment = {
  tags: [{ name: 'auth', description: 'Authenticated identity' }],
  schemas: { Me },
  paths: {
    '/api/auth/me': {
      get: {
        tags: ['auth'],
        summary: 'Current user with effective roles & permissions',
        responses: {
          '200': { description: 'The authenticated principal', content: jsonContent(ref('Me')) },
          ...errorResponses('401'),
        },
      },
    },
  },
};
