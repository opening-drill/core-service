import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, toPrismaList } from '../../lib/query.js';
import { withPrismaErrors } from '../../lib/prismaErrors.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { AircraftCreate, AircraftListQuery, AircraftUpdate } from './aircraft.schema.js';

async function ensureTypeActive(typeId: string): Promise<void> {
  const type = await prisma.aircraftType.findFirst({ where: { id: typeId, delete_date: null }, select: { id: true } });
  if (!type) throw new HttpError(404, 'Aircraft type not found');
}

export const aircraftService = {
  async list(query: AircraftListQuery) {
    const where: Prisma.AircraftWhereInput = {
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.type_id !== undefined ? { type_id: query.type_id } : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'update_date');
    const [data, total] = await prisma.$transaction([
      prisma.aircraft.findMany({ where, skip, take, orderBy }),
      prisma.aircraft.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const aircraft = await prisma.aircraft.findUnique({ where: { id } });
    if (!aircraft) throw new HttpError(404, 'Aircraft not found');
    return aircraft;
  },

  async create(input: AircraftCreate) {
    await ensureTypeActive(input.type_id);
    return prisma.aircraft.create({ data: { type_id: input.type_id, status: input.status } });
  },

  async update(id: string, input: AircraftUpdate) {
    await this.getById(id);
    if (input.type_id !== undefined) await ensureTypeActive(input.type_id);
    const data: Prisma.AircraftUpdateInput = {
      ...(input.type_id !== undefined ? { type: { connect: { id: input.type_id } } } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    };
    return prisma.aircraft.update({ where: { id }, data });
  },

  async remove(id: string) {
    // Hard delete (no delete_date). RESTRICT FKs from path_history / recommendations → 409.
    await withPrismaErrors(() => prisma.aircraft.delete({ where: { id } }), {
      notFound: 'Aircraft not found',
      conflict: 'Cannot delete aircraft: it has path history or AI recommendations',
    });
  },
};
