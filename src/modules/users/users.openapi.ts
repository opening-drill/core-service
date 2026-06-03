import {
  crudPaths,
  errorResponses,
  jsonContent,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

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

const RoleAssignmentResult = {
  type: 'object',
  properties: {
    user_id: { type: 'string', example: '1234567@idf.il' },
    role_id: { type: 'string', format: 'uuid' },
    created_at: { type: 'string', format: 'date-time' },
  },
  required: ['user_id', 'role_id', 'created_at'],
};

const RoleAssignCreate = {
  type: 'object',
  properties: { role_name: { type: 'string' }, role_id: { type: 'string', format: 'uuid' } },
};

const UserPermissions = {
  type: 'object',
  properties: {
    user_id: { type: 'string' },
    roles: { type: 'array', items: { type: 'string' } },
    permissions: { type: 'array', items: { type: 'string' } },
  },
  required: ['user_id', 'roles', 'permissions'],
};

const UserAuthRequest = {
  type: 'object',
  properties: { username: { type: 'string' }, password: { type: 'string' } },
  required: ['username', 'password'],
};

const UserAuthResult = {
  type: 'object',
  properties: {
    user_id: { type: 'string' },
    full_name: { type: 'string' },
    roles: { type: 'array', items: { type: 'string' } },
    permissions: { type: 'array', items: { type: 'string' } },
  },
  required: ['user_id', 'full_name', 'roles', 'permissions'],
};

const userIdParam = { name: 'user_id', in: 'path', required: true, schema: { type: 'string' } };

export const usersOpenapi: OpenapiFragment = {
  tags: [{ name: 'users', description: 'User accounts, auth, role assignments & permissions' }],
  schemas: {
    User,
    UserCreate,
    UserUpdate,
    RoleAssignment,
    RoleAssignmentResult,
    RoleAssignCreate,
    UserPermissions,
    UserAuthRequest,
    UserAuthResult,
  },
  paths: {
    ...crudPaths({
      base: '/api/users',
      tag: 'users',
      label: 'user',
      resource: 'User',
      createSchema: 'UserCreate',
      updateSchema: 'UserUpdate',
      sortable: ['create_date', 'username', 'full_name'],
      listFilters: [{ name: 'username', in: 'query', schema: { type: 'string' } }],
    }),
    '/api/users/auth': {
      post: {
        tags: ['users'],
        summary: 'Authenticate by username + password',
        security: [],
        requestBody: { required: true, content: jsonContent(ref('UserAuthRequest')) },
        responses: {
          '200': { description: 'Authenticated user', content: jsonContent(ref('UserAuthResult')) },
          ...errorResponses('400', '401'),
        },
      },
    },
    '/api/users/{user_id}/permissions': {
      get: {
        tags: ['users'],
        summary: "Get a user's roles & permissions",
        parameters: [userIdParam],
        responses: {
          '200': { description: 'Roles & permissions', content: jsonContent(ref('UserPermissions')) },
          ...errorResponses('401', '403', '404'),
        },
      },
    },
    '/api/users/{user_id}/roles': {
      get: {
        tags: ['users'],
        summary: "List a user's roles",
        parameters: [userIdParam],
        responses: {
          '200': {
            description: 'Assigned roles',
            content: { 'application/json': { schema: { type: 'array', items: ref('RoleAssignment') } } },
          },
          ...errorResponses('401', '403', '404'),
        },
      },
      post: {
        tags: ['users'],
        summary: 'Assign a role to a user (by role_name or role_id)',
        parameters: [userIdParam],
        requestBody: { required: true, content: jsonContent(ref('RoleAssignCreate')) },
        responses: {
          '201': { description: 'Assigned', content: jsonContent(ref('RoleAssignmentResult')) },
          ...errorResponses('400', '401', '403', '404', '409'),
        },
      },
    },
    '/api/users/{user_id}/roles/{roleId}': {
      delete: {
        tags: ['users'],
        summary: 'Remove a role from a user',
        parameters: [userIdParam, { name: 'roleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Removed' }, ...errorResponses('401', '403', '404') },
      },
    },
  },
};
