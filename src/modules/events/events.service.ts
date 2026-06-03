import { AircraftStatus, Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, softDeleteWhere, toPrismaList } from '../../lib/query.js';
import { withPrismaErrors } from '../../lib/prismaErrors.js';
import { resolveUsernameToId } from '../../lib/userIdentity.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { EventCreate, EventListQuery, EventUpdate } from './events.schema.js';
import {
  aiContextAircraftInclude,
  aiContextEventInclude,
  eventDetailInclude,
  eventListInclude,
} from './events.serialize.js';

async function ensureTarget(id: string): Promise<void> {
  const row = await prisma.target.findFirst({ where: { id, delete_date: null }, select: { id: true } });
  if (!row) throw new HttpError(404, 'Target not found');
}
async function ensurePicture(id: string): Promise<void> {
  const row = await prisma.picture.findUnique({ where: { id }, select: { id: true } });
  if (!row) throw new HttpError(404, 'Picture not found');
}
async function ensureAircraft(id: string): Promise<void> {
  const row = await prisma.aircraft.findUnique({ where: { id }, select: { id: true } });
  if (!row) throw new HttpError(404, 'Aircraft not found');
}
async function ensureRecommendation(id: string): Promise<void> {
  const row = await prisma.aiRecommendation.findUnique({ where: { id }, select: { id: true } });
  if (!row) throw new HttpError(404, 'AI recommendation not found');
}

async function findActiveOrThrow(id: string): Promise<void> {
  const existing = await prisma.event.findFirst({ where: { id, delete_date: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, 'Event not found');
}

export const eventsService = {
  async list(query: EventListQuery) {
    // The contract user_id filter is a username; resolve it to the internal UUID.
    const userId = query.user_id !== undefined ? await resolveUsernameToId(query.user_id) : undefined;
    const dateRange =
      query.from !== undefined || query.to !== undefined
        ? {
            create_date: {
              ...(query.from !== undefined ? { gte: query.from } : {}),
              ...(query.to !== undefined ? { lte: query.to } : {}),
            },
          }
        : {};
    const where: Prisma.EventWhereInput = {
      ...softDeleteWhere(query.include_deleted),
      ...(userId !== undefined ? { user_id: userId } : {}),
      ...(query.target_id !== undefined ? { target_id: query.target_id } : {}),
      ...(query.aircraft_id !== undefined ? { aircraft_id: query.aircraft_id } : {}),
      ...dateRange,
    };
    const { skip, take, orderBy } = toPrismaList(query, 'create_date');
    const [data, total] = await prisma.$transaction([
      prisma.event.findMany({ where, skip, take, orderBy, include: eventListInclude }),
      prisma.event.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const event = await prisma.event.findFirst({ where: { id, delete_date: null }, include: eventDetailInclude });
    if (!event) throw new HttpError(404, 'Event not found');
    return event;
  },

  /** Bundled context for the AI dispatch recommendation (free aircraft only). */
  async getAiContext(id: string) {
    const event = await prisma.event.findFirst({
      where: { id, delete_date: null },
      include: aiContextEventInclude,
    });
    if (!event) throw new HttpError(404, 'Event not found');
    const aircrafts = await prisma.aircraft.findMany({
      where: { status: AircraftStatus.FREE },
      include: aiContextAircraftInclude,
    });
    return { event, aircrafts };
  },

  async create(input: EventCreate) {
    const userId = await resolveUsernameToId(input.user_id);
    await ensureTarget(input.target_id);
    await ensurePicture(input.picture_id);
    if (input.aircraft_id) await ensureAircraft(input.aircraft_id);
    if (input.ai_recommendation_id) await ensureRecommendation(input.ai_recommendation_id);

    const data: Prisma.EventUncheckedCreateInput = {
      user_id: userId,
      target_id: input.target_id,
      picture_id: input.picture_id,
      ...(input.aircraft_id ? { aircraft_id: input.aircraft_id } : {}),
      ...(input.ai_recommendation_id ? { ai_recommendation_id: input.ai_recommendation_id } : {}),
      ...(input.create_date ? { create_date: input.create_date } : {}),
    };
    return withPrismaErrors(() => prisma.event.create({ data }), {
      conflict: 'That AI recommendation is already linked to another event',
    });
  },

  async update(id: string, input: EventUpdate) {
    await findActiveOrThrow(id);
    if (input.target_id !== undefined) await ensureTarget(input.target_id);
    if (input.picture_id !== undefined) await ensurePicture(input.picture_id);
    if (input.aircraft_id) await ensureAircraft(input.aircraft_id);
    if (input.ai_recommendation_id) await ensureRecommendation(input.ai_recommendation_id);

    const data: Prisma.EventUncheckedUpdateInput = {
      ...(input.target_id !== undefined ? { target_id: input.target_id } : {}),
      ...(input.picture_id !== undefined ? { picture_id: input.picture_id } : {}),
      ...(input.aircraft_id !== undefined ? { aircraft_id: input.aircraft_id } : {}),
      ...(input.ai_recommendation_id !== undefined ? { ai_recommendation_id: input.ai_recommendation_id } : {}),
    };
    return withPrismaErrors(() => prisma.event.update({ where: { id }, data }), {
      conflict: 'That AI recommendation is already linked to another event',
    });
  },

  async remove(id: string) {
    await findActiveOrThrow(id);
    await prisma.event.update({ where: { id }, data: { delete_date: new Date() } });
  },
};
