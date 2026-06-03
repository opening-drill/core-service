import {
  errorResponses,
  jsonContent,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

const Target = {
  type: 'object',
  properties: {
    target_id: { type: 'string', format: 'uuid' },
    location: ref('LngLat'),
    name: { type: 'string' },
    status: { type: 'string', enum: ['standing', 'destroyed'] },
  },
  required: ['target_id', 'location', 'name', 'status'],
};

const TargetCreate = {
  type: 'object',
  properties: {
    location: ref('LngLat'),
    name: { type: 'string' },
    status: { type: 'string', enum: ['standing', 'destroyed'] },
  },
  required: ['location', 'name', 'status'],
};

const TargetCreated = {
  type: 'object',
  properties: {
    target_id: { type: 'string', format: 'uuid' },
    status: { type: 'string', enum: ['standing', 'destroyed'] },
    create_date: { type: 'string', format: 'date-time' },
  },
  required: ['target_id', 'status', 'create_date'],
};

const TargetUpdate = {
  type: 'object',
  properties: { status: { type: 'string', enum: ['standing', 'destroyed'] }, name: { type: 'string' } },
};

const OkResult = {
  type: 'object',
  properties: { ok: { type: 'boolean' } },
  required: ['ok'],
};

const idParam = { name: 'target_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

export const targetsOpenapi: OpenapiFragment = {
  tags: [{ name: 'targets', description: 'Target metadata' }],
  schemas: { Target, TargetCreate, TargetCreated, TargetUpdate, OkResult },
  paths: {
    '/api/targets': {
      post: {
        tags: ['targets'],
        summary: 'Create a target',
        requestBody: { required: true, content: jsonContent(ref('TargetCreate')) },
        responses: {
          '201': { description: 'Created', content: jsonContent(ref('TargetCreated')) },
          ...errorResponses('400', '401', '403'),
        },
      },
    },
    '/api/targets/{target_id}': {
      get: {
        tags: ['targets'],
        summary: 'Get a target',
        parameters: [idParam],
        responses: {
          '200': { description: 'Target', content: jsonContent(ref('Target')) },
          ...errorResponses('401', '403', '404'),
        },
      },
      patch: {
        tags: ['targets'],
        summary: 'Update target status',
        parameters: [idParam],
        requestBody: { required: true, content: jsonContent(ref('TargetUpdate')) },
        responses: {
          '200': { description: 'Updated', content: jsonContent(ref('OkResult')) },
          ...errorResponses('400', '401', '403', '404'),
        },
      },
    },
  },
};
