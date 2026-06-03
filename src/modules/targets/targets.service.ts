import { Prisma } from '@prisma/client';

import { toGeoJsonInput } from '../../geo/geo.js';
import { prisma } from '../../lib/prisma.js';
import { buildListResult, softDeleteWhere, toPrismaList } from '../../lib/query.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { TargetCreate, TargetListQuery, TargetUpdate } from './targets.schema.js';

async function findActiveOrThrow(id: string): Promise<void> {
  const existing = await prisma.target.findFirst({ where: { id, delete_date: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, 'Target not found');
}

export const targetsService = {
  async list(query: TargetListQuery) {
    const where: Prisma.TargetWhereInput = {
      ...softDeleteWhere(query.include_deleted),
      ...(query.status !== undefined ? { status: query.status } : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'create_date');
    const [data, total] = await prisma.$transaction([
      prisma.target.findMany({ where, skip, take, orderBy }),
      prisma.target.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const target = await prisma.target.findFirst({ where: { id, delete_date: null } });
    if (!target) throw new HttpError(404, 'Target not found');
    return target;
  },

  async create(input: TargetCreate) {
    return prisma.target.create({
      data: {
        name: input.name,
        location: toGeoJsonInput(input.location),
        status: input.status,
      },
    });
  },

  async update(id: string, input: TargetUpdate) {
    await findActiveOrThrow(id);
    const data: Prisma.TargetUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.location !== undefined ? { location: toGeoJsonInput(input.location) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    };
    return prisma.target.update({ where: { id }, data });
  },

  async remove(id: string) {
    await findActiveOrThrow(id);
    await prisma.target.update({ where: { id }, data: { delete_date: new Date() } });
  },
};
