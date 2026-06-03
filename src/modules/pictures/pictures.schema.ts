import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

export const pictureUploadIntentSchema = z
  .object({
    file_name: z.string().min(1),
    content_type: z.string().min(1).default('image/png'),
  })
  .strict();

export const pictureCreateSchema = z
  .object({
    file_name: z.string().min(1),
    s3_object_id: z.string().min(1),
    s3_bucket_id: z.string().min(1),
  })
  .strict();

export const pictureIdParamSchema = z.object({ id: z.string().uuid() });

export const pictureListQuerySchema = buildListQuerySchema(['uploaded_at', 'file_name']).extend({
  file_name: z.string().min(1).optional(),
});

export type PictureUploadIntent = z.infer<typeof pictureUploadIntentSchema>;
export type PictureCreate = z.infer<typeof pictureCreateSchema>;
export type PictureListQuery = z.infer<typeof pictureListQuerySchema>;
