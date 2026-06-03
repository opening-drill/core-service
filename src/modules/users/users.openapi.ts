import { crudPaths, ref, type OpenapiFragment } from '../../lib/openapiHelpers.js';

const User = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    full_name: { type: 'string' },
    username: { type: 'string' },
    create_date: { type: 'string', format: 'date-time' },
    delete_date: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'full_name', 'username', 'create_date'],
};

const UserCreate = {
  type: 'object',
  properties: {
    full_name: { type: 'string' },
    username: { type: 'string' },
    password: { type: 'string', minLength: 8 },
  },
  required: ['full_name', 'username', 'password'],
};

const UserUpdate = {
  type: 'object',
  properties: {
    full_name: { type: 'string' },
    password: { type: 'string', minLength: 8 },
  },
};

const RoleAssignment = {
  type: 'object',
  properties: {
    role_id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    assigned_at: { type: 'string', format: 'date-time' },
  },
  required: ['role_id', 'name'],
};

export const usersOpenapi: OpenapiFragment = {
  tags: [{ name: 'users', description: 'User accounts & role assignments' }],
  schemas: { User, UserCreate, UserUpdate, RoleAssignment },
  paths: {
    ...crudPaths({
      base: '/users',
      tag: 'users',
      label: 'user',
      resource: 'User',
      createSchema: 'UserCreate',
      updateSchema: 'UserUpdate',
      sortable: ['create_date', 'username', 'full_name'],
      listFilters: [{ name: 'username', in: 'query', schema: { type: 'string' } }],
    }),
    '/users/{userId}/roles': {
      get: {
        tags: ['users'],
        summary: "List a user's roles",
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Assigned roles', content: { 'application/json': { schema: { type: 'array', items: ref('RoleAssignment') } } } },
        },
      },
      post: {
        tags: ['users'],
        summary: 'Assign a role to a user',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { role_id: { type: 'string', format: 'uuid' } }, required: ['role_id'] } } },
        },
        responses: { '201': { description: 'Assigned', content: { 'application/json': { schema: ref('RoleAssignment') } } } },
      },
    },
    '/users/{userId}/roles/{roleId}': {
      delete: {
        tags: ['users'],
        summary: 'Remove a role from a user',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'roleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '204': { description: 'Removed' } },
      },
    },
  },
};
