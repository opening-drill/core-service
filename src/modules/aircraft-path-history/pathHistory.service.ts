import { Prisma } from '@prisma/client';

import { toGeoJsonInput } from '../../geo/geo.js';
import { prisma } from '../../lib/prisma.js';
import { buildListResult, toPrismaList } from '../../lib/query.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { PathHistoryCreate, PathHistoryListQuery } from './pathHistory.schema.js';

async function ensureAircraft(aircraftId: string): Promise<void> {
  const aircraft = await prisma.aircraft.findUnique({ where: { id: aircraftId }, select: { id: true } });
  if (!aircraft) throw new HttpError(404, 'Aircraft not found');
}

export const pathHistoryService = {
  async list(aircraftId: string, query: PathHistoryListQuery) {
    await ensureAircraft(aircraftId);
    const dateFilter: Prisma.DateTimeFilter = {
      ...(query.from !== undefined ? { gte: query.from } : {}),
      ...(query.to !== undefined ? { lte: query.to } : {}),
    };
    const where: Prisma.AircraftPathHistoryWhereInput = {
      aircraft_id: aircraftId,
      ...(query.from !== undefined || query.to !== undefined ? { update_date: dateFilter } : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'update_date');
    const [data, total] = await prisma.$transaction([
      prisma.aircraftPathHistory.findMany({ where, skip, take, orderBy }),
      prisma.aircraftPathHistory.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async create(aircraftId: string, input: PathHistoryCreate) {
    await ensureAircraft(aircraftId);
    return prisma.aircraftPathHistory.create({
      data: {
        aircraft_id: aircraftId,
        location: toGeoJsonInput(input.location),
        altitude: input.altitude,
        horizontal_speed_mps: input.horizontal_speed_mps,
        vertical_speed_mps: input.vertical_speed_mps,
        heading_degrees: input.heading_degrees,
        position_accuracy_m: input.position_accuracy_m,
      },
    });
  },

  /** Latest position by most-recent update_date. */
  async latest(aircraftId: string) {
    await ensureAircraft(aircraftId);
    const row = await prisma.aircraftPathHistory.findFirst({
      where: { aircraft_id: aircraftId },
      orderBy: { update_date: 'desc' },
    });
    if (!row) throw new HttpError(404, 'No path history for this aircraft');
    return row;
  },
};
