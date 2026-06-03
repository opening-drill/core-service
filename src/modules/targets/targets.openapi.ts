import { crudPaths, type OpenapiFragment } from '../../lib/openapiHelpers.js';

const GeoJsonPoint = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['Point'] },
    coordinates: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
  },
  required: ['type', 'coordinates'],
};

const Target = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    location: { $ref: '#/components/schemas/GeoJsonPoint' },
    status: { type: 'string', enum: ['DESTROYED', 'STANDING'] },
    create_date: { type: 'string', format: 'date-time' },
    delete_date: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'name', 'location', 'status', 'create_date'],
};

const TargetCreate = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    location: { $ref: '#/components/schemas/GeoJsonPoint' },
    status: { type: 'string', enum: ['DESTROYED', 'STANDING'] },
  },
  required: ['name', 'location', 'status'],
};

const TargetUpdate = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    location: { $ref: '#/components/schemas/GeoJsonPoint' },
    status: { type: 'string', enum: ['DESTROYED', 'STANDING'] },
  },
};

export const targetsOpenapi: OpenapiFragment = {
  tags: [{ name: 'targets', description: 'Targets (GeoJSON points)' }],
  schemas: { GeoJsonPoint, Target, TargetCreate, TargetUpdate },
  paths: crudPaths({
    base: '/targets',
    tag: 'targets',
    label: 'target',
    resource: 'Target',
    createSchema: 'TargetCreate',
    updateSchema: 'TargetUpdate',
    sortable: ['create_date', 'name', 'status'],
    listFilters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['DESTROYED', 'STANDING'] } }],
  }),
};
