import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, softDeleteWhere, toPrismaList } from '../../lib/query.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { RoleCreate, RoleListQuery, RoleUpdate } from './roles.schema.js';

/** Enforces role-name uniqueness among active roles (no DB unique constraint). */
async function assertNameAvailable(name: string, exceptId?: string): Promise<void> {
  const clash = await prisma.role.findFirst({
    where: {
      name,
      delete_date: null,
      ...(exceptId !== undefined ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (clash) throw new HttpError(409, 'Role name already in use', undefined, 'Conflict');
}

async function findActiveOrThrow(id: string): Promise<void> {
  const existing = await prisma.role.findFirst({ where: { id, delete_date: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, 'Role not found');
}

export const rolesService = {
  async list(query: RoleListQuery) {
    const where: Prisma.RoleWhereInput = {
      ...softDeleteWhere(query.include_deleted),
      ...(query.name !== undefined ? { name: { contains: query.name, mode: 'insensitive' } } : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'create_date');
    const [data, total] = await prisma.$transaction([
      prisma.role.findMany({ where, skip, take, orderBy }),
      prisma.role.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const role = await prisma.role.findFirst({ where: { id, delete_date: null } });
    if (!role) throw new HttpError(404, 'Role not found');
    return role;
  },

  async create(input: RoleCreate) {
    await assertNameAvailable(input.name);
    return prisma.role.create({ data: { name: input.name } });
  },

  async update(id: string, input: RoleUpdate) {
    await findActiveOrThrow(id);
    if (input.name !== undefined) await assertNameAvailable(input.name, id);
    const data: Prisma.RoleUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
    };
    return prisma.role.update({ where: { id }, data });
  },

  async remove(id: string) {
    await findActiveOrThrow(id);
    await prisma.role.update({ where: { id }, data: { delete_date: new Date() } });
  },
};
