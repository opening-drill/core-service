import { crudPaths, type OpenapiFragment } from '../../lib/openapiHelpers.js';

const Event = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid' },
    target_id: { type: 'string', format: 'uuid' },
    picture_id: { type: 'string', format: 'uuid' },
    aircraft_id: { type: 'string', format: 'uuid', nullable: true },
    ai_recommendation_id: { type: 'string', format: 'uuid', nullable: true },
    create_date: { type: 'string', format: 'date-time' },
    update_date: { type: 'string', format: 'date-time' },
    delete_date: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'user_id', 'target_id', 'picture_id', 'create_date', 'update_date'],
};

const EventCreate = {
  type: 'object',
  properties: {
    user_id: { type: 'string', format: 'uuid' },
    target_id: { type: 'string', format: 'uuid' },
    picture_id: { type: 'string', format: 'uuid' },
    aircraft_id: { type: 'string', format: 'uuid', nullable: true },
    ai_recommendation_id: { type: 'string', format: 'uuid', nullable: true },
  },
  required: ['user_id', 'target_id', 'picture_id'],
};

const EventUpdate = {
  type: 'object',
  properties: {
    target_id: { type: 'string', format: 'uuid' },
    picture_id: { type: 'string', format: 'uuid' },
    aircraft_id: { type: 'string', format: 'uuid', nullable: true },
    ai_recommendation_id: { type: 'string', format: 'uuid', nullable: true },
  },
};

export const eventsOpenapi: OpenapiFragment = {
  tags: [{ name: 'events', description: 'Events linking user, target, picture, aircraft & recommendation' }],
  schemas: { Event, EventCreate, EventUpdate },
  paths: crudPaths({
    base: '/events',
    tag: 'events',
    label: 'event',
    resource: 'Event',
    createSchema: 'EventCreate',
    updateSchema: 'EventUpdate',
    sortable: ['create_date', 'update_date'],
    listFilters: [
      { name: 'user_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
      { name: 'target_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
      { name: 'aircraft_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
    ],
  }),
};
