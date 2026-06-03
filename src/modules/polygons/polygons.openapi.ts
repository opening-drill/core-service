import { crudPaths, type OpenapiFragment } from '../../lib/openapiHelpers.js';

const GeoJsonPolygon = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['Polygon'] },
    coordinates: {
      type: 'array',
      items: { type: 'array', items: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 } },
    },
  },
  required: ['type', 'coordinates'],
};

const Polygon = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    geojson: { $ref: '#/components/schemas/GeoJsonPolygon' },
    zone: { type: 'string', enum: ['GAZA_SOUTH', 'GAZA_NORTH'] },
    state_duration: { type: 'integer' },
    create_date: { type: 'string', format: 'date-time' },
    delete_date: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'name', 'geojson', 'zone', 'state_duration', 'create_date'],
};

const PolygonCreate = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    geojson: { $ref: '#/components/schemas/GeoJsonPolygon' },
    zone: { type: 'string', enum: ['GAZA_SOUTH', 'GAZA_NORTH'] },
    state_duration: { type: 'integer', minimum: 0 },
  },
  required: ['name', 'geojson', 'zone', 'state_duration'],
};

const PolygonUpdate = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    geojson: { $ref: '#/components/schemas/GeoJsonPolygon' },
    zone: { type: 'string', enum: ['GAZA_SOUTH', 'GAZA_NORTH'] },
    state_duration: { type: 'integer', minimum: 0 },
  },
};

export const polygonsOpenapi: OpenapiFragment = {
  tags: [{ name: 'polygons', description: 'Danger-zone polygons (GeoJSON)' }],
  schemas: { GeoJsonPolygon, Polygon, PolygonCreate, PolygonUpdate },
  paths: crudPaths({
    base: '/polygons',
    tag: 'polygons',
    label: 'polygon',
    resource: 'Polygon',
    createSchema: 'PolygonCreate',
    updateSchema: 'PolygonUpdate',
    sortable: ['create_date', 'name', 'state_duration'],
    listFilters: [{ name: 'zone', in: 'query', schema: { type: 'string', enum: ['GAZA_SOUTH', 'GAZA_NORTH'] } }],
  }),
};
