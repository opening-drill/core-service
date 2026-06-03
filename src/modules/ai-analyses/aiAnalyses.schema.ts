import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

export const aiAnalysisCreateSchema = z
  .object({
    raw_result: z.string().min(1),
    picture_id: z.string().uuid(),
  })
  .strict();

export const aiAnalysisIdParamSchema = z.object({ id: z.string().uuid() });

export const aiAnalysisListQuerySchema = buildListQuerySchema(['create_date']).extend({
  picture_id: z.string().uuid().optional(),
});

export type AiAnalysisCreate = z.infer<typeof aiAnalysisCreateSchema>;
export type AiAnalysisListQuery = z.infer<typeof aiAnalysisListQuerySchema>;
