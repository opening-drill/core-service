import { crudPaths, ref, type OpenapiFragment } from '../../lib/openapiHelpers.js';

const Role = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    create_date: { type: 'string', format: 'date-time' },
    delete_date: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'name', 'create_date'],
};

const RoleCreate = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
const RoleUpdate = { type: 'object', properties: { name: { type: 'string' } } };

const PermissionAssignment = {
  type: 'object',
  properties: {
    permission: { type: 'string', enum: ['VIEW', 'EDIT'] },
    assigned_at: { type: 'string', format: 'date-time' },
  },
  required: ['permission'],
};

export const rolesOpenapi: OpenapiFragment = {
  tags: [{ name: 'roles', description: 'Roles & permission assignments' }],
  schemas: { Role, RoleCreate, RoleUpdate, PermissionAssignment },
  paths: {
    ...crudPaths({
      base: '/api/roles',
      tag: 'roles',
      label: 'role',
      resource: 'Role',
      createSchema: 'RoleCreate',
      updateSchema: 'RoleUpdate',
      sortable: ['create_date', 'name'],
      listFilters: [{ name: 'name', in: 'query', schema: { type: 'string' } }],
    }),
    '/roles/{roleId}/permissions': {
      get: {
        tags: ['roles'],
        summary: "List a role's permissions",
        parameters: [{ name: 'roleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Assigned permissions', content: { 'application/json': { schema: { type: 'array', items: ref('PermissionAssignment') } } } },
        },
      },
      post: {
        tags: ['roles'],
        summary: 'Assign a permission to a role',
        parameters: [{ name: 'roleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { permission: { type: 'string', enum: ['VIEW', 'EDIT'] } }, required: ['permission'] } } },
        },
        responses: { '201': { description: 'Assigned', content: { 'application/json': { schema: ref('PermissionAssignment') } } } },
      },
    },
    '/roles/{roleId}/permissions/{permission}': {
      delete: {
        tags: ['roles'],
        summary: 'Remove a permission from a role',
        parameters: [
          { name: 'roleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'permission', in: 'path', required: true, schema: { type: 'string', enum: ['VIEW', 'EDIT'] } },
        ],
        responses: { '204': { description: 'Removed' } },
      },
    },
  },
};
