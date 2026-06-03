import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, softDeleteWhere, toPrismaList } from '../../lib/query.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type {
  AircraftTypeCreate,
  AircraftTypeListQuery,
  AircraftTypeUpdate,
} from './aircraftTypes.schema.js';

async function findActiveOrThrow(id: string): Promise<void> {
  const existing = await prisma.aircraftType.findFirst({ where: { id, delete_date: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, 'Aircraft type not found');
}

export const aircraftTypesService = {
  async list(query: AircraftTypeListQuery) {
    const priceFilter: Prisma.IntFilter = {
      ...(query.min_price !== undefined ? { gte: query.min_price } : {}),
      ...(query.max_price !== undefined ? { lte: query.max_price } : {}),
    };
    const where: Prisma.AircraftTypeWhereInput = {
      ...softDeleteWhere(query.include_deleted),
      ...(query.name !== undefined ? { name: { contains: query.name, mode: 'insensitive' } } : {}),
      ...(query.min_price !== undefined || query.max_price !== undefined ? { price: priceFilter } : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'create_date');
    const [data, total] = await prisma.$transaction([
      prisma.aircraftType.findMany({ where, skip, take, orderBy }),
      prisma.aircraftType.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const row = await prisma.aircraftType.findFirst({ where: { id, delete_date: null } });
    if (!row) throw new HttpError(404, 'Aircraft type not found');
    return row;
  },

  async create(input: AircraftTypeCreate) {
    return prisma.aircraftType.create({
      data: {
        name: input.name,
        price: input.price,
        payload_kg: input.payload_kg,
        velocity_kmh: input.velocity_kmh,
      },
    });
  },

  async update(id: string, input: AircraftTypeUpdate) {
    await findActiveOrThrow(id);
    const data: Prisma.AircraftTypeUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.payload_kg !== undefined ? { payload_kg: input.payload_kg } : {}),
      ...(input.velocity_kmh !== undefined ? { velocity_kmh: input.velocity_kmh } : {}),
    };
    return prisma.aircraftType.update({ where: { id }, data });
  },

  async remove(id: string) {
    await findActiveOrThrow(id);
    await prisma.aircraftType.update({ where: { id }, data: { delete_date: new Date() } });
  },
};
