import {
  errorResponses,
  jsonContent,
  listQueryParams,
  listResponseSchema,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

const Picture = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    s3_object_id: { type: 'string' },
    s3_bucket_id: { type: 'string' },
    file_name: { type: 'string' },
    uploaded_at: { type: 'string', format: 'date-time' },
  },
  required: ['id', 's3_object_id', 's3_bucket_id', 'file_name', 'uploaded_at'],
};

const PictureUploadIntent = {
  type: 'object',
  properties: { file_name: { type: 'string' }, content_type: { type: 'string', default: 'image/png' } },
  required: ['file_name'],
};

const PictureUploadUrl = {
  type: 'object',
  properties: {
    uploadUrl: { type: 'string' },
    s3_object_id: { type: 'string' },
    s3_bucket_id: { type: 'string' },
    expiresIn: { type: 'integer' },
  },
  required: ['uploadUrl', 's3_object_id', 's3_bucket_id', 'expiresIn'],
};

const PictureCreate = {
  type: 'object',
  properties: { file_name: { type: 'string' }, s3_object_id: { type: 'string' }, s3_bucket_id: { type: 'string' } },
  required: ['file_name', 's3_object_id', 's3_bucket_id'],
};

const PictureDownloadUrl = {
  type: 'object',
  properties: { downloadUrl: { type: 'string' }, expiresIn: { type: 'integer' } },
  required: ['downloadUrl', 'expiresIn'],
};

const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

export const picturesOpenapi: OpenapiFragment = {
  tags: [{ name: 'pictures', description: 'Picture metadata & S3 pre-signed URLs' }],
  schemas: { Picture, PictureUploadIntent, PictureUploadUrl, PictureCreate, PictureDownloadUrl },
  paths: {
    '/pictures/upload-intent': {
      post: {
        tags: ['pictures'],
        summary: 'Get a pre-signed upload URL (step 1)',
        requestBody: { required: true, content: jsonContent(ref('PictureUploadIntent')) },
        responses: {
          '200': { description: 'Pre-signed PUT URL', content: jsonContent(ref('PictureUploadUrl')) },
          ...errorResponses('400', '401', '403'),
        },
      },
    },
    '/pictures': {
      get: {
        tags: ['pictures'],
        summary: 'List pictures',
        parameters: [
          ...listQueryParams(['uploaded_at', 'file_name']),
          { name: 'file_name', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Page of pictures', content: jsonContent(listResponseSchema('Picture')) },
          ...errorResponses('400', '401', '403'),
        },
      },
      post: {
        tags: ['pictures'],
        summary: 'Persist picture metadata after upload (step 3)',
        requestBody: { required: true, content: jsonContent(ref('PictureCreate')) },
        responses: {
          '201': { description: 'Created', content: jsonContent(ref('Picture')) },
          ...errorResponses('400', '401', '403'),
        },
      },
    },
    '/pictures/{id}': {
      get: {
        tags: ['pictures'],
        summary: 'Get picture metadata',
        parameters: [idParam],
        responses: {
          '200': { description: 'Picture', content: jsonContent(ref('Picture')) },
          ...errorResponses('401', '403', '404'),
        },
      },
      delete: {
        tags: ['pictures'],
        summary: 'Delete a picture (hard delete)',
        parameters: [idParam],
        responses: { '204': { description: 'Deleted' }, ...errorResponses('401', '403', '404', '409') },
      },
    },
    '/pictures/{id}/download-url': {
      get: {
        tags: ['pictures'],
        summary: 'Get a pre-signed download URL',
        parameters: [idParam],
        responses: {
          '200': { description: 'Pre-signed GET URL', content: jsonContent(ref('PictureDownloadUrl')) },
          ...errorResponses('401', '403', '404'),
        },
      },
    },
  },
};
