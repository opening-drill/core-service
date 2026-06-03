import {
  errorResponses,
  jsonContent,
  listQueryParams,
  listResponseSchema,
  ref,
  type OpenapiFragment,
} from '../../lib/openapiHelpers.js';

/** Internal row shape (used by the non-contract list endpoint). */
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

/** Multipart upload form (POST /api/storage/pictures). */
const PictureUpload = {
  type: 'object',
  properties: {
    file: { type: 'string', format: 'binary' },
    file_name: { type: 'string' },
  },
  required: ['file'],
};

/** Contract upload result (POST /api/storage/pictures). */
const PictureCreated = {
  type: 'object',
  properties: {
    picture_id: { type: 'string', format: 'uuid' },
    object_key: { type: 'string' },
    bucket: { type: 'string' },
    file_name: { type: 'string' },
    uploaded_at: { type: 'string', format: 'date-time' },
  },
  required: ['picture_id', 'object_key', 'bucket', 'file_name', 'uploaded_at'],
};

/** Contract image ref (GET /api/storage/pictures/:picture_id). */
const PictureRef = {
  type: 'object',
  properties: {
    picture_id: { type: 'string', format: 'uuid' },
    image_path: { type: 'string', example: 's3://field-images/evt/2026-06-03/abc.png' },
    object_key: { type: 'string' },
    bucket: { type: 'string' },
  },
  required: ['picture_id', 'image_path', 'object_key', 'bucket'],
};

/** Contract presigned URL (GET /api/storage/pictures/:picture_id/url). */
const PictureUrl = {
  type: 'object',
  properties: {
    image_url: { type: 'string' },
    object_key: { type: 'string' },
    expires_at: { type: 'string', format: 'date-time' },
  },
  required: ['image_url', 'object_key', 'expires_at'],
};

const idParam = { name: 'picture_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

export const picturesOpenapi: OpenapiFragment = {
  tags: [{ name: 'pictures', description: 'Picture upload (multipart) & S3 pre-signed download URLs' }],
  schemas: { Picture, PictureUpload, PictureCreated, PictureRef, PictureUrl },
  paths: {
    '/api/storage/pictures': {
      get: {
        tags: ['pictures'],
        summary: 'List pictures (internal)',
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
        summary: 'Upload an image (file + metadata) in one request',
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: ref('PictureUpload') } },
        },
        responses: {
          '201': { description: 'Created', content: jsonContent(ref('PictureCreated')) },
          ...errorResponses('400', '401', '403'),
        },
      },
    },
    '/api/storage/pictures/{picture_id}': {
      get: {
        tags: ['pictures'],
        summary: 'Get picture ref for AI',
        parameters: [idParam],
        responses: {
          '200': { description: 'Picture ref', content: jsonContent(ref('PictureRef')) },
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
    '/api/storage/pictures/{picture_id}/url': {
      get: {
        tags: ['pictures'],
        summary: 'Get a pre-signed download URL for the UI',
        parameters: [idParam, { name: 'expires', in: 'query', schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Pre-signed GET URL', content: jsonContent(ref('PictureUrl')) },
          ...errorResponses('401', '403', '404'),
        },
      },
    },
  },
};
