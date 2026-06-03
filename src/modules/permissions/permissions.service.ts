import { PermissionType } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, softDeleteWhere, toPrismaList } from '../../lib/query.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { PermissionListQuery } from './permissions.schema.js';

export const permissionsService = {
  async list(query: PermissionListQuery) {
    const where = softDeleteWhere(query.include_deleted);
    const { skip, take, orderBy } = toPrismaList(query, 'create_date');
    const [data, total] = await prisma.$transaction([
      prisma.permission.findMany({ where, skip, take, orderBy }),
      prisma.permission.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getByPermission(permission: PermissionType) {
    const row = await prisma.permission.findFirst({ where: { permission, delete_date: null } });
    if (!row) throw new HttpError(404, 'Permission not found');
    return row;
  },

  async create(permission: PermissionType) {
    const active = await prisma.permission.findFirst({
      where: { permission, delete_date: null },
      select: { permission: true },
    });
    if (active) throw new HttpError(409, 'Permission already exists', undefined, 'Conflict');

    // The enum value is the PK, so a soft-deleted row must be reactivated.
    return prisma.permission.upsert({
      where: { permission },
      update: { delete_date: null, create_date: new Date() },
      create: { permission },
    });
  },

  async remove(permission: PermissionType) {
    const result = await prisma.permission.updateMany({
      where: { permission, delete_date: null },
      data: { delete_date: new Date() },
    });
    if (result.count === 0) throw new HttpError(404, 'Permission not found');
  },
};
