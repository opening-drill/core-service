import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, toPrismaList } from '../../lib/query.js';
import { withPrismaErrors } from '../../lib/prismaErrors.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { AiAnalysisCreate, AiAnalysisListQuery } from './aiAnalyses.schema.js';

async function ensurePicture(pictureId: string): Promise<void> {
  const picture = await prisma.picture.findUnique({ where: { id: pictureId }, select: { id: true } });
  if (!picture) throw new HttpError(404, 'Picture not found');
}

export const aiAnalysesService = {
  async list(query: AiAnalysisListQuery) {
    const where: Prisma.AiAnalysisWhereInput = {
      ...(query.picture_id !== undefined ? { picture_id: query.picture_id } : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'create_date');
    const [data, total] = await prisma.$transaction([
      prisma.aiAnalysis.findMany({ where, skip, take, orderBy }),
      prisma.aiAnalysis.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const analysis = await prisma.aiAnalysis.findUnique({ where: { id } });
    if (!analysis) throw new HttpError(404, 'AI analysis not found');
    return analysis;
  },

  async create(input: AiAnalysisCreate) {
    await ensurePicture(input.picture_id);
    return prisma.aiAnalysis.create({
      data: { raw_result: input.raw_result, picture_id: input.picture_id },
    });
  },

  async remove(id: string) {
    await withPrismaErrors(() => prisma.aiAnalysis.delete({ where: { id } }), {
      notFound: 'AI analysis not found',
    });
  },
};
