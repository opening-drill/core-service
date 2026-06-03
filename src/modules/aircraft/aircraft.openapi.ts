import {
  errorResponses,
  jsonContent,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

const STATUS = { type: 'string', enum: ['busy', 'free', 'broken'] };

const AircraftListItem = {
  type: 'object',
  properties: {
    aircraft_id: { type: 'string', format: 'uuid' },
    aircraft_type: { type: 'string' },
    status: STATUS,
  },
  required: ['aircraft_id', 'aircraft_type', 'status'],
};

const AircraftList = {
  type: 'object',
  properties: { aircraft: { type: 'array', items: ref('AircraftListItem') } },
  required: ['aircraft'],
};

const AircraftLiveItem = {
  type: 'object',
  properties: {
    aircraft_id: { type: 'string', format: 'uuid' },
    aircraft_type: { type: 'string' },
    status: STATUS,
    location: { ...ref('LngLat'), nullable: true },
    altitude: { type: 'integer', nullable: true },
    heading_degrees: { type: 'number', nullable: true },
    update_date: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['aircraft_id', 'aircraft_type', 'status'],
};

const AircraftLiveList = {
  type: 'object',
  properties: { aircraft: { type: 'array', items: ref('AircraftLiveItem') } },
  required: ['aircraft'],
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

const AircraftUpdateResult = {
  type: 'object',
  properties: { ok: { type: 'boolean' }, update_date: { type: 'string', format: 'date-time' } },
  required: ['ok', 'update_date'],
};

const PathPoint = {
  type: 'object',
  properties: {
    location: ref('LngLat'),
    altitude: { type: 'integer', nullable: true },
    heading_degrees: { type: 'number', nullable: true },
    update_date: { type: 'string', format: 'date-time' },
  },
};

const PathResult = {
  type: 'object',
  properties: {
    aircraft_id: { type: 'string', format: 'uuid' },
    points: { type: 'array', items: ref('PathPoint') },
  },
  required: ['aircraft_id', 'points'],
};

const TrackPoint = {
  type: 'object',
  properties: {
    location: ref('LngLat'),
    altitude: { type: 'integer', nullable: true },
    update_date: { type: 'string', format: 'date-time' },
  },
};

const TrackResult = {
  type: 'object',
  properties: {
    aircraft_id: { type: 'string', format: 'uuid' },
    points: { type: 'array', items: ref('TrackPoint') },
  },
  required: ['aircraft_id', 'points'],
};

const PathHistoryBatchPoint = {
  type: 'object',
  properties: {
    aircraft_id: { type: 'string', format: 'uuid' },
    location: ref('LngLat'),
    altitude: { type: 'integer' },
    horizontal_speed_mps: { type: 'number' },
    vertical_speed_mps: { type: 'number' },
    heading_degrees: { type: 'number' },
    position_accuracy_m: { type: 'number' },
    update_date: { type: 'string', format: 'date-time' },
  },
  required: ['aircraft_id', 'location'],
};

const PathHistoryBatch = { type: 'array', items: ref('PathHistoryBatchPoint') };

const PathHistoryBatchResult = {
  type: 'object',
  properties: { inserted: { type: 'integer' } },
  required: ['inserted'],
};

const idParam = { name: 'aircraft_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

export const aircraftOpenapi: OpenapiFragment = {
  tags: [{ name: 'aircraft', description: 'Aircraft fleet & telemetry' }],
  schemas: {
    AircraftListItem,
    AircraftList,
    AircraftLiveItem,
    AircraftLiveList,
    AircraftCreate,
    AircraftUpdate,
    AircraftUpdateResult,
    PathPoint,
    PathResult,
    TrackPoint,
    TrackResult,
    PathHistoryBatchPoint,
    PathHistoryBatch,
    PathHistoryBatchResult,
  },
  paths: {
    '/api/aircraft': {
      get: {
        tags: ['aircraft'],
        summary: 'List aircraft (filter by status, type_id, or type_name)',
        parameters: [
          { name: 'status', in: 'query', schema: STATUS },
          { name: 'type_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'type_name', in: 'query', schema: { type: 'string', description: 'Exact type name, e.g. F-15' } },
        ],
        responses: {
          '200': { description: 'Aircraft', content: jsonContent(ref('AircraftList')) },
          ...errorResponses('400', '401', '403'),
        },
      },
      post: {
        tags: ['aircraft'],
        summary: 'Create an aircraft (internal)',
        requestBody: { required: true, content: jsonContent(ref('AircraftCreate')) },
        responses: { '201': { description: 'Created' }, ...errorResponses('400', '401', '403', '404') },
      },
    },
    '/api/aircraft-types/{type_id}/aircraft': {
      get: {
        tags: ['aircraft'],
        summary: 'List aircraft by type id',
        description:
          'Returns all aircraft of the given type. Optional `status` filter. ' +
          'Same response shape as `GET /api/aircraft`.',
        parameters: [
          { name: 'type_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', schema: STATUS },
        ],
        responses: {
          '200': { description: 'Aircraft of this type', content: jsonContent(ref('AircraftList')) },
          ...errorResponses('400', '401', '403', '404'),
        },
      },
    },
    '/api/aircraft/live': {
      get: {
        tags: ['aircraft'],
        summary: 'All drones, latest position each',
        parameters: [{ name: 'status', in: 'query', schema: STATUS }],
        responses: {
          '200': { description: 'Live aircraft', content: jsonContent(ref('AircraftLiveList')) },
          ...errorResponses('400', '401', '403'),
        },
      },
    },
    '/api/aircraft/path-history-batch': {
      post: {
        tags: ['aircraft'],
        summary: 'Bulk write drone position data',
        requestBody: { required: true, content: jsonContent(ref('PathHistoryBatch')) },
        responses: {
          '201': { description: 'Inserted', content: jsonContent(ref('PathHistoryBatchResult')) },
          ...errorResponses('400', '401', '403'),
        },
      },
    },
    '/api/aircraft/{aircraft_id}': {
      patch: {
        tags: ['aircraft'],
        summary: 'Update drone metadata',
        parameters: [idParam],
        requestBody: { required: true, content: jsonContent(ref('AircraftUpdate')) },
        responses: {
          '200': { description: 'Updated', content: jsonContent(ref('AircraftUpdateResult')) },
          ...errorResponses('400', '401', '403', '404'),
        },
      },
      delete: {
        tags: ['aircraft'],
        summary: 'Delete an aircraft (internal)',
        parameters: [idParam],
        responses: { '204': { description: 'Deleted' }, ...errorResponses('401', '403', '404', '409') },
      },
    },
    '/api/aircraft/{aircraft_id}/path': {
      get: {
        tags: ['aircraft'],
        summary: 'Path history up to a point (?limit= or ?until=)',
        parameters: [
          idParam,
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'until', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          '200': { description: 'Path', content: jsonContent(ref('PathResult')) },
          ...errorResponses('400', '401', '403', '404'),
        },
      },
    },
    '/api/aircraft/{aircraft_id}/track': {
      get: {
        tags: ['aircraft'],
        summary: 'Full track for debrief (?from=&to=)',
        parameters: [
          idParam,
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          '200': { description: 'Track', content: jsonContent(ref('TrackResult')) },
          ...errorResponses('400', '401', '403', '404'),
        },
      },
    },
  },
};
