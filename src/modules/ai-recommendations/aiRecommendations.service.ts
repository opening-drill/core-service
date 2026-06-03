import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, toPrismaList } from '../../lib/query.js';
import { withPrismaErrors } from '../../lib/prismaErrors.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type {
  AiRecommendationCreate,
  AiRecommendationListQuery,
} from './aiRecommendations.schema.js';

async function ensureAircraft(aircraftId: string): Promise<void> {
  const aircraft = await prisma.aircraft.findUnique({ where: { id: aircraftId }, select: { id: true } });
  if (!aircraft) throw new HttpError(404, 'Recommended aircraft not found');
}

export const aiRecommendationsService = {
  async list(query: AiRecommendationListQuery) {
    const where: Prisma.AiRecommendationWhereInput = {
      ...(query.recommended_aircraft_id !== undefined
        ? { recommended_aircraft_id: query.recommended_aircraft_id }
        : {}),
      ...(query.min_urgency !== undefined ? { urgency_level: { gte: query.min_urgency } } : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'create_date');
    const [data, total] = await prisma.$transaction([
      prisma.aiRecommendation.findMany({ where, skip, take, orderBy }),
      prisma.aiRecommendation.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const rec = await prisma.aiRecommendation.findUnique({ where: { id } });
    if (!rec) throw new HttpError(404, 'AI recommendation not found');
    return rec;
  },

  async create(input: AiRecommendationCreate) {
    await ensureAircraft(input.recommended_aircraft_id);
    return prisma.aiRecommendation.create({
      data: {
        raw_recommendation: input.raw_recommendation,
        recommended_aircraft_id: input.recommended_aircraft_id,
        urgency_level: input.urgency_level,
      },
    });
  },

  async remove(id: string) {
    // Hard delete. A linked event's ai_recommendation_id is SET NULL (no block).
    await withPrismaErrors(() => prisma.aiRecommendation.delete({ where: { id } }), {
      notFound: 'AI recommendation not found',
    });
  },
};
