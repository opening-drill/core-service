import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

export const aiRecommendationCreateSchema = z
  .object({
    raw_recommendation: z.string().min(1),
    recommended_aircraft_id: z.string().uuid(),
    urgency_level: z.number(),
  })
  .strict();

export const aiRecommendationIdParamSchema = z.object({ id: z.string().uuid() });

export const aiRecommendationListQuerySchema = buildListQuerySchema([
  'create_date',
  'urgency_level',
]).extend({
  recommended_aircraft_id: z.string().uuid().optional(),
  min_urgency: z.coerce.number().optional(),
});

export type AiRecommendationCreate = z.infer<typeof aiRecommendationCreateSchema>;
export type AiRecommendationListQuery = z.infer<typeof aiRecommendationListQuerySchema>;
