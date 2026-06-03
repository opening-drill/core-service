import {
  errorResponses,
  jsonContent,
  listQueryParams,
  listResponseSchema,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

const AiRecommendation = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    raw_recommendation: { type: 'string' },
    recommended_aircraft_id: { type: 'string', format: 'uuid' },
    urgency_level: { type: 'number' },
    create_date: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'raw_recommendation', 'recommended_aircraft_id', 'urgency_level', 'create_date'],
};

const AiRecommendationCreate = {
  type: 'object',
  properties: {
    event_id: { type: 'string', format: 'uuid' },
    recommended_aircraft_id: { type: 'string', format: 'uuid' },
    urgency_level: { type: 'number' },
    raw_recommendation: { type: 'string' },
  },
  required: ['event_id', 'recommended_aircraft_id', 'urgency_level', 'raw_recommendation'],
};

const AiRecommendationCreated = {
  type: 'object',
  properties: { ai_recommendation_id: { type: 'string', format: 'uuid' } },
  required: ['ai_recommendation_id'],
};

const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

export const aiRecommendationsOpenapi: OpenapiFragment = {
  tags: [{ name: 'ai-recommendations', description: 'AI aircraft recommendations' }],
  schemas: { AiRecommendation, AiRecommendationCreate, AiRecommendationCreated },
  paths: {
    '/api/ai-recommendations': {
      get: {
        tags: ['ai-recommendations'],
        summary: 'List AI recommendations (internal)',
        parameters: [
          ...listQueryParams(['create_date', 'urgency_level']),
          { name: 'recommended_aircraft_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'min_urgency', in: 'query', schema: { type: 'number' } },
        ],
        responses: {
          '200': { description: 'Page of recommendations', content: jsonContent(listResponseSchema('AiRecommendation')) },
          ...errorResponses('400', '401', '403'),
        },
      },
      post: {
        tags: ['ai-recommendations'],
        summary: 'Store an AI recommendation (links it to the event)',
        requestBody: { required: true, content: jsonContent(ref('AiRecommendationCreate')) },
        responses: {
          '201': { description: 'Created', content: jsonContent(ref('AiRecommendationCreated')) },
          ...errorResponses('400', '401', '403', '404'),
        },
      },
    },
    '/api/ai-recommendations/{id}': {
      get: {
        tags: ['ai-recommendations'],
        summary: 'Get an AI recommendation',
        parameters: [idParam],
        responses: {
          '200': { description: 'Recommendation', content: jsonContent(ref('AiRecommendation')) },
          ...errorResponses('401', '403', '404'),
        },
      },
      delete: {
        tags: ['ai-recommendations'],
        summary: 'Delete an AI recommendation',
        parameters: [idParam],
        responses: { '204': { description: 'Deleted' }, ...errorResponses('401', '403', '404') },
      },
    },
  },
};
