import { AircraftStatus, Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, toPrismaList } from '../../lib/query.js';
import { withPrismaErrors } from '../../lib/prismaErrors.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { AircraftCreate, AircraftListQuery, AircraftUpdate } from './aircraft.schema.js';
import { aircraftTypeInclude, type AircraftWithType, type LatestPosition } from './aircraft.serialize.js';

async function ensureTypeActive(typeId: string): Promise<void> {
  const type = await prisma.aircraftType.findFirst({ where: { id: typeId, delete_date: null }, select: { id: true } });
  if (!type) throw new HttpError(404, 'Aircraft type not found');
}

type AircraftFilterInput = {
  status?: AircraftStatus | undefined;
  type_id?: string | undefined;
  type_name?: string | undefined;
};

function pickAircraftFilters(input: AircraftFilterInput): {
  status?: AircraftStatus;
  type_id?: string;
  type_name?: string;
} {
  const filters: { status?: AircraftStatus; type_id?: string; type_name?: string } = {};
  if (input.status !== undefined) filters.status = input.status;
  if (input.type_id !== undefined) filters.type_id = input.type_id;
  if (input.type_name !== undefined) filters.type_name = input.type_name;
  return filters;
}

function buildAircraftWhere(filters: {
  status?: AircraftStatus;
  type_id?: string;
  type_name?: string;
}): Prisma.AircraftWhereInput {
  return {
    ...(filters.status !== undefined ? { status: filters.status } : {}),
    ...(filters.type_id !== undefined ? { type_id: filters.type_id } : {}),
    ...(filters.type_name !== undefined
      ? { type: { name: { equals: filters.type_name, mode: 'insensitive' }, delete_date: null } }
      : {}),
  };
}

export const aircraftService = {
  async list(query: AircraftListQuery) {
    const where = buildAircraftWhere(pickAircraftFilters(query));
    const { skip, take, orderBy } = toPrismaList(query, 'update_date');
    const [data, total] = await prisma.$transaction([
      prisma.aircraft.findMany({ where, skip, take, orderBy, include: aircraftTypeInclude }),
      prisma.aircraft.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  /** All aircraft of a given type (contract list shape; optional status filter). */
  async listByTypeId(typeId: string, filters: { status?: AircraftStatus } = {}) {
    await ensureTypeActive(typeId);
    return prisma.aircraft.findMany({
      where: buildAircraftWhere(pickAircraftFilters({ type_id: typeId, status: filters.status })),
      orderBy: { update_date: 'desc' },
      include: aircraftTypeInclude,
    });
  },

  /**
   * All aircraft with each one's latest position. The latest position is the
   * most-recent `aircraft_path_history` row per aircraft (`DISTINCT ON`), joined
   * in memory; aircraft with no telemetry come back with a null position.
   */
  async live(status?: AircraftStatus): Promise<Array<{ aircraft: AircraftWithType; latest: LatestPosition | null }>> {
    const aircraft = await prisma.aircraft.findMany({
      where: status !== undefined ? { status } : {},
      include: aircraftTypeInclude,
    });
    if (aircraft.length === 0) return [];
    const latestRows = await prisma.$queryRaw<Array<{ aircraft_id: string } & LatestPosition>>`
      SELECT DISTINCT ON (aircraft_id) aircraft_id, location, update_date
      FROM aircraft_path_history
      ORDER BY aircraft_id, update_date DESC
    `;
    const latestByAircraft = new Map(latestRows.map((r) => [r.aircraft_id, r]));
    return aircraft.map((a) => ({ aircraft: a, latest: latestByAircraft.get(a.id) ?? null }));
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
