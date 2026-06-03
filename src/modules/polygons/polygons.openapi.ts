import {
  errorResponses,
  jsonContent,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

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

const ZONE = { type: 'string', enum: ['gaza_south', 'gaza_north'] };

/** Contract polygon item (note the `state_duartion` spelling). */
const Polygon = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    zone: ZONE,
    state_duartion: { type: 'integer' },
    area: ref('GeoJsonPolygon'),
  },
  required: ['id', 'name', 'zone', 'state_duartion', 'area'],
};

const PolygonList = {
  type: 'object',
  properties: { polygons: { type: 'array', items: ref('Polygon') } },
  required: ['polygons'],
};

const PolygonCreate = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    geojson: ref('GeoJsonPolygon'),
    zone: { type: 'string', enum: ['GAZA_SOUTH', 'GAZA_NORTH'] },
    expiry_date: { type: 'string', format: 'date-time' },
  },
  required: ['name', 'geojson', 'zone', 'expiry_date'],
};

const PolygonUpdate = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    geojson: ref('GeoJsonPolygon'),
    zone: { type: 'string', enum: ['GAZA_SOUTH', 'GAZA_NORTH'] },
    expiry_date: { type: 'string', format: 'date-time' },
  },
};

const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

export const polygonsOpenapi: OpenapiFragment = {
  tags: [{ name: 'polygons', description: 'Danger-zone polygons (GeoJSON)' }],
  schemas: { GeoJsonPolygon, Polygon, PolygonList, PolygonCreate, PolygonUpdate },
  paths: {
    '/api/polygons': {
      get: {
        tags: ['polygons'],
        summary: 'List danger zones (?active=true)',
        parameters: [
          { name: 'active', in: 'query', schema: { type: 'boolean' } },
          { name: 'zone', in: 'query', schema: { type: 'string', enum: ['GAZA_SOUTH', 'GAZA_NORTH'] } },
        ],
        responses: {
          '200': { description: 'Polygons', content: jsonContent(ref('PolygonList')) },
          ...errorResponses('400', '401', '403'),
        },
      },
      post: {
        tags: ['polygons'],
        summary: 'Create a polygon (internal)',
        requestBody: { required: true, content: jsonContent(ref('PolygonCreate')) },
        responses: { '201': { description: 'Created' }, ...errorResponses('400', '401', '403') },
      },
    },
    '/api/polygons/{id}': {
      get: {
        tags: ['polygons'],
        summary: 'Get a polygon (internal)',
        parameters: [idParam],
        responses: { '200': { description: 'Polygon' }, ...errorResponses('401', '403', '404') },
      },
      patch: {
        tags: ['polygons'],
        summary: 'Update a polygon (internal)',
        parameters: [idParam],
        requestBody: { required: true, content: jsonContent(ref('PolygonUpdate')) },
        responses: { '200': { description: 'Updated' }, ...errorResponses('400', '401', '403', '404') },
      },
      delete: {
        tags: ['polygons'],
        summary: 'Delete a polygon (internal)',
        parameters: [idParam],
        responses: { '204': { description: 'Deleted' }, ...errorResponses('401', '403', '404') },
      },
    },
  },
};
