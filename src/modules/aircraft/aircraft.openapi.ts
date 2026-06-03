import {
  crudPaths,
  errorResponses,
  jsonContent,
  listQueryParams,
  listResponseSchema,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

const STATUS = { type: 'string', enum: ['BUSY', 'FREE', 'BROKEN'] };

const Aircraft = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    type_id: { type: 'string', format: 'uuid' },
    status: STATUS,
    update_date: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'type_id', 'status', 'update_date'],
};

const AircraftCreate = {
  type: 'object',
  properties: { type_id: { type: 'string', format: 'uuid' }, status: STATUS },
  required: ['type_id', 'status'],
};

const AircraftUpdate = {
  type: 'object',
  properties: { type_id: { type: 'string', format: 'uuid' }, status: STATUS },
};

const PathHistory = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    aircraft_id: { type: 'string', format: 'uuid' },
    location: { $ref: '#/components/schemas/GeoJsonPoint' },
    altitude: { type: 'integer' },
    horizontal_speed_mps: { type: 'number' },
    vertical_speed_mps: { type: 'number' },
    heading_degrees: { type: 'number' },
    position_accuracy_m: { type: 'number' },
    update_date: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'aircraft_id', 'location', 'altitude', 'update_date'],
};

const PathHistoryCreate = {
  type: 'object',
  properties: {
    location: { $ref: '#/components/schemas/GeoJsonPoint' },
    altitude: { type: 'integer' },
    horizontal_speed_mps: { type: 'number' },
    vertical_speed_mps: { type: 'number' },
    heading_degrees: { type: 'number' },
    position_accuracy_m: { type: 'number' },
  },
  required: ['location', 'altitude', 'horizontal_speed_mps', 'vertical_speed_mps', 'heading_degrees', 'position_accuracy_m'],
};

// GeoJsonPoint is also declared by the targets fragment; identical definitions
// merge harmlessly. Repeated here so this fragment is self-sufficient.
const GeoJsonPoint = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['Point'] },
    coordinates: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
  },
  required: ['type', 'coordinates'],
};

const aircraftIdParam = { name: 'aircraftId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

export const aircraftOpenapi: OpenapiFragment = {
  tags: [{ name: 'aircraft', description: 'Aircraft fleet & telemetry' }],
  schemas: { Aircraft, AircraftCreate, AircraftUpdate, PathHistory, PathHistoryCreate, GeoJsonPoint },
  paths: {
    ...crudPaths({
      base: '/aircraft',
      tag: 'aircraft',
      label: 'aircraft',
      resource: 'Aircraft',
      createSchema: 'AircraftCreate',
      updateSchema: 'AircraftUpdate',
      sortable: ['update_date', 'status'],
      listFilters: [
        { name: 'status', in: 'query', schema: STATUS },
        { name: 'type_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
      ],
    }),
    '/aircraft/{aircraftId}/path-history': {
      get: {
        tags: ['aircraft'],
        summary: 'List path history (with date range)',
        parameters: [
          aircraftIdParam,
          ...listQueryParams(['update_date', 'altitude']),
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          '200': { description: 'Page of path-history points', content: jsonContent(listResponseSchema('PathHistory')) },
          ...errorResponses('400', '401', '403', '404'),
        },
      },
      post: {
        tags: ['aircraft'],
        summary: 'Append a path-history point',
        parameters: [aircraftIdParam],
        requestBody: { required: true, content: jsonContent(ref('PathHistoryCreate')) },
        responses: {
          '201': { description: 'Created', content: jsonContent(ref('PathHistory')) },
          ...errorResponses('400', '401', '403', '404'),
        },
      },
    },
    '/aircraft/{aircraftId}/latest-position': {
      get: {
        tags: ['aircraft'],
        summary: 'Latest position by most-recent update_date',
        parameters: [aircraftIdParam],
        responses: {
          '200': { description: 'Latest path-history point', content: jsonContent(ref('PathHistory')) },
          ...errorResponses('401', '403', '404'),
        },
      },
    },
  },
};
