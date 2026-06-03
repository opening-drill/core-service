import { Prisma } from '@prisma/client';

import { toGeoJsonInput } from '../../geo/geo.js';
import { prisma } from '../../lib/prisma.js';
import { buildListResult, softDeleteWhere, toPrismaList } from '../../lib/query.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { PolygonCreate, PolygonListQuery, PolygonUpdate } from './polygons.schema.js';

async function findActiveOrThrow(id: string): Promise<void> {
  const existing = await prisma.polygon.findFirst({ where: { id, delete_date: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, 'Polygon not found');
}

export const polygonsService = {
  async list(query: PolygonListQuery) {
    const where: Prisma.PolygonWhereInput = {
      ...softDeleteWhere(query.include_deleted),
      ...(query.zone !== undefined ? { zone: query.zone } : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'create_date');
    const [data, total] = await prisma.$transaction([
      prisma.polygon.findMany({ where, skip, take, orderBy }),
      prisma.polygon.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const polygon = await prisma.polygon.findFirst({ where: { id, delete_date: null } });
    if (!polygon) throw new HttpError(404, 'Polygon not found');
    return polygon;
  },

  async create(input: PolygonCreate) {
    return prisma.polygon.create({
      data: {
        name: input.name,
        geojson: toGeoJsonInput(input.geojson),
        zone: input.zone,
        expiry_date: input.expiry_date,
      },
    });
  },

  async update(id: string, input: PolygonUpdate) {
    await findActiveOrThrow(id);
    const data: Prisma.PolygonUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.geojson !== undefined ? { geojson: toGeoJsonInput(input.geojson) } : {}),
      ...(input.zone !== undefined ? { zone: input.zone } : {}),
      ...(input.state_duration !== undefined ? { state_duration: input.state_duration } : {}),
    };
    return prisma.polygon.update({ where: { id }, data });
  },

  async remove(id: string) {
    await findActiveOrThrow(id);
    await prisma.polygon.update({ where: { id }, data: { delete_date: new Date() } });
  },
};
