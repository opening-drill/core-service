import { z } from 'zod';

import { buildListQuerySchema } from '../../lib/query.js';

export const aiRecommendationCreateSchema = z
  .object({
    // Links the recommendation back to the event (sets Event.ai_recommendation_id).
    event_id: z.string().uuid(),
    recommended_aircraft_id: z.string().uuid(),
    urgency_level: z.number(),
    raw_recommendation: z.string().min(1),
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
