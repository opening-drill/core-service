import {
  errorResponses,
  jsonContent,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

const EventCreate = {
  type: 'object',
  properties: {
    user_id: { type: 'string', description: 'IDF identifier (username)', example: '1234567@idf.il' },
    target_id: { type: 'string', format: 'uuid' },
    picture_id: { type: 'string', format: 'uuid' },
    aircraft_id: { type: 'string', format: 'uuid', nullable: true },
    ai_recommendation_id: { type: 'string', format: 'uuid', nullable: true },
    create_date: { type: 'string', format: 'date-time' },
  },
  required: ['user_id', 'target_id', 'picture_id'],
};

const EventCreated = {
  type: 'object',
  properties: {
    event_id: { type: 'string', format: 'uuid' },
    create_date: { type: 'string', format: 'date-time' },
  },
  required: ['event_id', 'create_date'],
};

const EventUpdate = {
  type: 'object',
  properties: {
    aircraft_id: { type: 'string', format: 'uuid', nullable: true },
    ai_recommendation_id: { type: 'string', format: 'uuid', nullable: true },
    target_id: { type: 'string', format: 'uuid' },
    picture_id: { type: 'string', format: 'uuid' },
  },
};

const EventListItem = {
  type: 'object',
  properties: {
    event_id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string' },
    target_id: { type: 'string', format: 'uuid' },
    create_date: { type: 'string', format: 'date-time' },
  },
  required: ['event_id', 'user_id', 'target_id', 'create_date'],
};

const EventList = {
  type: 'object',
  properties: { events: { type: 'array', items: ref('EventListItem') } },
  required: ['events'],
};

const EventDetail = {
  type: 'object',
  properties: {
    event_id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string' },
    target_id: { type: 'string', format: 'uuid' },
    picture_id: { type: 'string', format: 'uuid' },
    aircraft_id: { type: 'string', format: 'uuid', nullable: true },
    ai_recommendation_id: { type: 'string', format: 'uuid', nullable: true },
    create_date: { type: 'string', format: 'date-time' },
    update_date: { type: 'string', format: 'date-time', nullable: true },
    target: {
      type: 'object',
      properties: {
        target_id: { type: 'string', format: 'uuid' },
        location: ref('LngLat'),
        name: { type: 'string' },
        status: { type: 'string' },
      },
    },
    picture: {
      type: 'object',
      properties: { picture_id: { type: 'string', format: 'uuid' }, file_name: { type: 'string' } },
    },
  },
  required: ['event_id', 'user_id', 'target_id', 'picture_id', 'create_date'],
};

const EventAiContext = {
  type: 'object',
  properties: {
    event_context: {
      type: 'object',
      properties: {
        event_id: { type: 'string', format: 'uuid' },
        picture_id: { type: 'string', format: 'uuid' },
        target_location: ref('LngLat'),
        image_path: { type: 'string', example: 's3://field-images/evt/2026-06-03/abc.png' },
      },
    },
    aircraft_context: {
      type: 'object',
      properties: {
        aircrafts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aircraft_id: { type: 'string', format: 'uuid' },
              aircraft_type: { type: 'string' },
              path_history: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { timestamp: { type: 'string', format: 'date-time' }, location: ref('LngLat') },
                },
              },
            },
          },
        },
      },
    },
  },
};

const EventUpdateResult = {
  type: 'object',
  properties: { ok: { type: 'boolean' }, update_date: { type: 'string', format: 'date-time' } },
  required: ['ok', 'update_date'],
};

const idParam = { name: 'event_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

export const eventsOpenapi: OpenapiFragment = {
  tags: [{ name: 'events', description: 'Events linking user, target, picture, aircraft & recommendation' }],
  schemas: { EventCreate, EventCreated, EventUpdate, EventListItem, EventList, EventDetail, EventAiContext, EventUpdateResult },
  paths: {
    '/api/events': {
      get: {
        tags: ['events'],
        summary: 'List events',
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'user_id', in: 'query', schema: { type: 'string' } },
          { name: 'target_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'aircraft_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Events', content: jsonContent(ref('EventList')) },
          ...errorResponses('400', '401', '403'),
        },
      },
      post: {
        tags: ['events'],
        summary: 'Create an event',
        requestBody: { required: true, content: jsonContent(ref('EventCreate')) },
        responses: {
          '201': { description: 'Created', content: jsonContent(ref('EventCreated')) },
          ...errorResponses('400', '401', '403', '404', '409'),
        },
      },
    },
    '/api/events/{event_id}': {
      get: {
        tags: ['events'],
        summary: 'Get event metadata',
        parameters: [idParam],
        responses: {
          '200': { description: 'Event', content: jsonContent(ref('EventDetail')) },
          ...errorResponses('401', '403', '404'),
        },
      },
      patch: {
        tags: ['events'],
        summary: 'Update an event',
        parameters: [idParam],
        requestBody: { required: true, content: jsonContent(ref('EventUpdate')) },
        responses: {
          '200': { description: 'Updated', content: jsonContent(ref('EventUpdateResult')) },
          ...errorResponses('400', '401', '403', '404', '409'),
        },
      },
    },
    '/api/events/{event_id}/ai-context': {
      get: {
        tags: ['events'],
        summary: 'Bundled context for AI (free aircraft)',
        parameters: [idParam],
        responses: {
          '200': { description: 'AI context', content: jsonContent(ref('EventAiContext')) },
          ...errorResponses('401', '403', '404'),
        },
      },
    },
  },
};
