import { Prisma } from '@prisma/client';

import { toGeoJsonInput } from '../../geo/geo.js';
import { prisma } from '../../lib/prisma.js';
import { buildListResult, toPrismaList } from '../../lib/query.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type {
  AircraftPathQuery,
  AircraftTrackQuery,
  PathHistoryBatch,
  PathHistoryCreate,
  PathHistoryListQuery,
} from './pathHistory.schema.js';

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

  /** Path history up to a point (`?limit=` / `?until=`), newest first. */
  async path(aircraftId: string, query: AircraftPathQuery) {
    await ensureAircraft(aircraftId);
    return prisma.aircraftPathHistory.findMany({
      where: {
        aircraft_id: aircraftId,
        ...(query.until !== undefined ? { update_date: { lte: query.until } } : {}),
      },
      orderBy: { update_date: 'desc' },
      ...(query.limit !== undefined ? { take: query.limit } : {}),
    });
  },

  /** Full track over a time window (`?from=&to=`) for debrief, oldest first. */
  async track(aircraftId: string, query: AircraftTrackQuery) {
    await ensureAircraft(aircraftId);
    const range: Prisma.DateTimeFilter = {
      ...(query.from !== undefined ? { gte: query.from } : {}),
      ...(query.to !== undefined ? { lte: query.to } : {}),
    };
    return prisma.aircraftPathHistory.findMany({
      where: {
        aircraft_id: aircraftId,
        ...(query.from !== undefined || query.to !== undefined ? { update_date: range } : {}),
      },
      orderBy: { update_date: 'asc' },
    });
  },

  /**
   * Bulk position write (contract `pathHistory.insertBatch`). Intended for the
   * pool/streaming path; exposed as a service method (and a thin REST endpoint).
   */
  async insertBatch(points: PathHistoryBatch): Promise<{ inserted: number }> {
    const result = await prisma.aircraftPathHistory.createMany({
      data: points.map((p) => ({
        aircraft_id: p.aircraft_id,
        location: toGeoJsonInput(p.location),
        altitude: p.altitude ?? null,
        horizontal_speed_mps: p.horizontal_speed_mps ?? null,
        vertical_speed_mps: p.vertical_speed_mps ?? null,
        heading_degrees: p.heading_degrees ?? null,
        position_accuracy_m: p.position_accuracy_m ?? null,
        ...(p.update_date !== undefined ? { update_date: p.update_date } : {}),
      })),
    });
    return { inserted: result.count };
  },
};
