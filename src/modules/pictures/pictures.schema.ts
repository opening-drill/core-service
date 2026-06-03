import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

/**
 * Text fields accompanying the multipart upload (the binary arrives as
 * `req.file` via multer). Non-strict: multer may omit absent optional fields.
 *
 * NOTE: the destination bucket is intentionally NOT client-controllable — the
 * server always writes to the configured `S3_BUCKET`. Accepting a client bucket
 * would allow arbitrary-bucket writes against the service's S3 credentials.
 */
export const pictureUploadFieldsSchema = z.object({
  file_name: z.string().min(1).optional(),
});

export const pictureIdParamSchema = z.object({ id: z.string().uuid() });

/** Optional presigned-URL lifetime in seconds (contract `?expires=`). */
export const pictureUrlQuerySchema = z.object({
  expires: z.coerce.number().int().min(1).max(604800).optional(),
});

export const pictureListQuerySchema = buildListQuerySchema(['uploaded_at', 'file_name']).extend({
  file_name: z.string().min(1).optional(),
});

export type PictureUploadFields = z.infer<typeof pictureUploadFieldsSchema>;
export type PictureListQuery = z.infer<typeof pictureListQuerySchema>;
export type PictureUrlQuery = z.infer<typeof pictureUrlQuerySchema>;
