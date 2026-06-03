import { Prisma } from '@prisma/client';

import { hashPassword } from '../../lib/password.js';
import { prisma } from '../../lib/prisma.js';
import { buildListResult, softDeleteWhere, toPrismaList } from '../../lib/query.js';
import { withPrismaErrors } from '../../lib/prismaErrors.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { UserCreate, UserListQuery, UserUpdate } from './users.schema.js';

/** Public user projection — never exposes the password hash. */
const publicSelect = {
  id: true,
  full_name: true,
  username: true,
  create_date: true,
  delete_date: true,
} satisfies Prisma.UserSelect;

async function findActiveOrThrow(id: string): Promise<void> {
  const existing = await prisma.user.findFirst({
    where: { id, delete_date: null },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, 'User not found');
}

export const usersService = {
  async list(query: UserListQuery) {
    const where: Prisma.UserWhereInput = {
      ...softDeleteWhere(query.include_deleted),
      ...(query.username !== undefined
        ? { username: { contains: query.username, mode: 'insensitive' } }
        : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'create_date');
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({ where, skip, take, orderBy, select: publicSelect }),
      prisma.user.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, delete_date: null },
      select: publicSelect,
    });
    if (!user) throw new HttpError(404, 'User not found');
    return user;
  },

  async create(input: UserCreate) {
    const password = await hashPassword(input.password);
    return withPrismaErrors(
      () =>
        prisma.user.create({
          data: { full_name: input.full_name, username: input.username, password },
          select: publicSelect,
        }),
      { conflict: 'Username already taken' },
    );
  },

  async update(id: string, input: UserUpdate) {
    await findActiveOrThrow(id);
    const data: Prisma.UserUpdateInput = {
      ...(input.full_name !== undefined ? { full_name: input.full_name } : {}),
      ...(input.password !== undefined ? { password: await hashPassword(input.password) } : {}),
    };
    return prisma.user.update({ where: { id }, data, select: publicSelect });
  },

  async remove(id: string) {
    await findActiveOrThrow(id);
    await prisma.user.update({ where: { id }, data: { delete_date: new Date() } });
  },
};
