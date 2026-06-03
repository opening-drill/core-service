import {
  errorResponses,
  jsonContent,
  listQueryParams,
  listResponseSchema,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

const AiAnalysis = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    raw_result: { type: 'string' },
    picture_id: { type: 'string', format: 'uuid' },
    create_date: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'raw_result', 'picture_id', 'create_date'],
};

const AiAnalysisCreate = {
  type: 'object',
  properties: { raw_result: { type: 'string' }, picture_id: { type: 'string', format: 'uuid' } },
  required: ['raw_result', 'picture_id'],
};

const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

export const aiAnalysesOpenapi: OpenapiFragment = {
  tags: [{ name: 'ai-analysis', description: 'AI analysis results' }],
  schemas: { AiAnalysis, AiAnalysisCreate },
  paths: {
    '/ai-analysis': {
      get: {
        tags: ['ai-analysis'],
        summary: 'List AI analyses',
        parameters: [
          ...listQueryParams(['create_date']),
          { name: 'picture_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Page of analyses', content: jsonContent(listResponseSchema('AiAnalysis')) },
          ...errorResponses('400', '401', '403'),
        },
      },
      post: {
        tags: ['ai-analysis'],
        summary: 'Create an AI analysis',
        requestBody: { required: true, content: jsonContent(ref('AiAnalysisCreate')) },
        responses: {
          '201': { description: 'Created', content: jsonContent(ref('AiAnalysis')) },
          ...errorResponses('400', '401', '403', '404'),
        },
      },
    },
    '/ai-analysis/{id}': {
      get: {
        tags: ['ai-analysis'],
        summary: 'Get an AI analysis',
        parameters: [idParam],
        responses: {
          '200': { description: 'Analysis', content: jsonContent(ref('AiAnalysis')) },
          ...errorResponses('401', '403', '404'),
        },
      },
      delete: {
        tags: ['ai-analysis'],
        summary: 'Delete an AI analysis',
        parameters: [idParam],
        responses: { '204': { description: 'Deleted' }, ...errorResponses('401', '403', '404') },
      },
    },
  },
};
