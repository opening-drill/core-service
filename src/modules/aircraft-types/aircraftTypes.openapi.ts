import { crudPaths, type OpenapiFragment } from '../../lib/openapiHelpers.js';

const AircraftType = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    price: { type: 'integer' },
    payload_kg: { type: 'number' },
    velocity_kmh: { type: 'number' },
    create_date: { type: 'string', format: 'date-time' },
    delete_date: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'name', 'price', 'payload_kg', 'velocity_kmh', 'create_date'],
};

const AircraftTypeCreate = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    price: { type: 'integer', minimum: 0 },
    payload_kg: { type: 'number', minimum: 0 },
    velocity_kmh: { type: 'number', minimum: 0 },
  },
  required: ['name', 'price', 'payload_kg', 'velocity_kmh'],
};

const AircraftTypeUpdate = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    price: { type: 'integer', minimum: 0 },
    payload_kg: { type: 'number', minimum: 0 },
    velocity_kmh: { type: 'number', minimum: 0 },
  },
};

export const aircraftTypesOpenapi: OpenapiFragment = {
  tags: [{ name: 'aircraft-types', description: 'Aircraft type catalogue' }],
  schemas: { AircraftType, AircraftTypeCreate, AircraftTypeUpdate },
  paths: crudPaths({
    base: '/api/aircraft-types',
    tag: 'aircraft-types',
    label: 'aircraft type',
    resource: 'AircraftType',
    createSchema: 'AircraftTypeCreate',
    updateSchema: 'AircraftTypeUpdate',
    sortable: ['create_date', 'name', 'price'],
    listFilters: [
      { name: 'name', in: 'query', schema: { type: 'string' } },
      { name: 'min_price', in: 'query', schema: { type: 'integer', minimum: 0 } },
      { name: 'max_price', in: 'query', schema: { type: 'integer', minimum: 0 } },
    ],
  }),
};
