import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, softDeleteWhere, toPrismaList } from '../../lib/query.js';
import { withPrismaErrors } from '../../lib/prismaErrors.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { EventCreate, EventListQuery, EventUpdate } from './events.schema.js';

/** Relations returned by getById; user is projected to omit the password. */
const detailInclude = {
  user: { select: { id: true, full_name: true, username: true, create_date: true, delete_date: true } },
  target: true,
  aircraft: true,
  picture: true,
  ai_recommendation: true,
} satisfies Prisma.EventInclude;

async function ensureUser(id: string): Promise<void> {
  const row = await prisma.user.findFirst({ where: { id, delete_date: null }, select: { id: true } });
  if (!row) throw new HttpError(404, 'User not found');
}
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
    const where: Prisma.EventWhereInput = {
      ...softDeleteWhere(query.include_deleted),
      ...(query.user_id !== undefined ? { user_id: query.user_id } : {}),
      ...(query.target_id !== undefined ? { target_id: query.target_id } : {}),
      ...(query.aircraft_id !== undefined ? { aircraft_id: query.aircraft_id } : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'create_date');
    const [data, total] = await prisma.$transaction([
      prisma.event.findMany({ where, skip, take, orderBy }),
      prisma.event.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const event = await prisma.event.findFirst({ where: { id, delete_date: null }, include: detailInclude });
    if (!event) throw new HttpError(404, 'Event not found');
    return event;
  },

  async create(input: EventCreate) {
    await ensureUser(input.user_id);
    await ensureTarget(input.target_id);
    await ensurePicture(input.picture_id);
    if (input.aircraft_id) await ensureAircraft(input.aircraft_id);
    if (input.ai_recommendation_id) await ensureRecommendation(input.ai_recommendation_id);

    const data: Prisma.EventUncheckedCreateInput = {
      user_id: input.user_id,
      target_id: input.target_id,
      picture_id: input.picture_id,
      ...(input.aircraft_id ? { aircraft_id: input.aircraft_id } : {}),
      ...(input.ai_recommendation_id ? { ai_recommendation_id: input.ai_recommendation_id } : {}),
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
    return withPrismaErrors(() => prisma.event.update({ where: { id }, data, include: detailInclude }), {
      conflict: 'That AI recommendation is already linked to another event',
    });
  },

  async remove(id: string) {
    await findActiveOrThrow(id);
    await prisma.event.update({ where: { id }, data: { delete_date: new Date() } });
  },
};
