import {
  errorResponses,
  jsonContent,
  listQueryParams,
  listResponseSchema,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

const Permission = {
  type: 'object',
  properties: {
    permission: { type: 'string', enum: ['VIEW', 'EDIT'] },
    create_date: { type: 'string', format: 'date-time' },
    delete_date: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['permission', 'create_date'],
};

const PermissionCreate = {
  type: 'object',
  properties: { permission: { type: 'string', enum: ['VIEW', 'EDIT'] } },
  required: ['permission'],
};

const permissionPathParam = {
  name: 'permission',
  in: 'path',
  required: true,
  schema: { type: 'string', enum: ['VIEW', 'EDIT'] },
};

export const permissionsOpenapi: OpenapiFragment = {
  tags: [{ name: 'permissions', description: 'Permission catalogue (enum-keyed)' }],
  schemas: { Permission, PermissionCreate },
  paths: {
    '/permissions': {
      get: {
        tags: ['permissions'],
        summary: 'List permissions',
        parameters: listQueryParams(['create_date', 'permission']),
        responses: {
          '200': { description: 'Permissions', content: jsonContent(listResponseSchema('Permission')) },
          ...errorResponses('401', '403'),
        },
      },
      post: {
        tags: ['permissions'],
        summary: 'Create (or reactivate) a permission',
        requestBody: { required: true, content: jsonContent(ref('PermissionCreate')) },
        responses: {
          '201': { description: 'Created', content: jsonContent(ref('Permission')) },
          ...errorResponses('400', '401', '403', '409'),
        },
      },
    },
    '/permissions/{permission}': {
      get: {
        tags: ['permissions'],
        summary: 'Get a permission',
        parameters: [permissionPathParam],
        responses: {
          '200': { description: 'Permission', content: jsonContent(ref('Permission')) },
          ...errorResponses('401', '403', '404'),
        },
      },
      delete: {
        tags: ['permissions'],
        summary: 'Soft-delete a permission',
        parameters: [permissionPathParam],
        responses: { '204': { description: 'Deleted' }, ...errorResponses('401', '403', '404') },
      },
    },
  },
};
