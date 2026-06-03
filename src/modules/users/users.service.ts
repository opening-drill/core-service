import { Prisma } from '@prisma/client';

import { env } from '../../config/env.js';
import { hashPassword } from '../../lib/password.js';
import { prisma } from '../../lib/prisma.js';
import { buildListResult, softDeleteWhere, toPrismaList } from '../../lib/query.js';
import { withPrismaErrors } from '../../lib/prismaErrors.js';
import { resolveUsernameToId } from '../../lib/userIdentity.js';
import { loadUserPermissions } from '../../middleware/authorize.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { userRolesService } from '../user-roles/userRoles.service.js';
import type { UserCreate, UserListQuery, UserSignup, UserUpdate } from './users.schema.js';

/** Fetches a user's active role names + lowercased permissions by internal id. */
async function loadRolesAndPermissions(
  userId: string,
): Promise<{ roles: string[]; permissions: string[] }> {
  const roleRows = await prisma.userRole.findMany({
    where: { user_id: userId, delete_date: null, role: { delete_date: null } },
    select: { role: { select: { name: true } } },
  });
  const permissions = await loadUserPermissions(userId);
  return {
    roles: roleRows.map((r) => r.role.name),
    permissions: [...permissions].map((p) => p.toLowerCase()),
  };
}

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

  /**
   * POST /api/users/signup — creates a user and assigns a role so the account
   * is stored for reference; API access uses `X-Api-Key` only.
   */
  async signup(input: UserSignup) {
    const user = await this.create({
      full_name: input.full_name,
      username: input.username,
      password: input.password,
    });

    const roleInput =
      input.role_id !== undefined
        ? { role_id: input.role_id }
        : { role_name: input.role_name ?? env.SIGNUP_DEFAULT_ROLE_NAME };

    await userRolesService.assign(user.username, roleInput);
    const { roles, permissions } = await loadRolesAndPermissions(user.id);

    return {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      user_id: user.username,
      roles,
      permissions,
    };
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

  /** GET /api/users/:user_id/permissions — roles & permissions for a user. */
  async permissions(
    username: string,
  ): Promise<{ user_id: string; roles: string[]; permissions: string[] }> {
    const userId = await resolveUsernameToId(username);
    const { roles, permissions } = await loadRolesAndPermissions(userId);
    return { user_id: username, roles, permissions };
  },

  /** POST /api/users/auth — confirms `X-Api-Key` was accepted by middleware. */
  async verifyApiKey(): Promise<{ valid: true }> {
    return { valid: true };
  },
};
