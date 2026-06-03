import { prisma } from '../../lib/prisma.js';
import { resolveUsernameToId } from '../../lib/userIdentity.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { UserRoleCreate } from './userRoles.schema.js';

interface RoleAssignmentView {
  role_id: string;
  name: string;
  assigned_at: Date;
}

/** Contract assign result (POST /api/users/:user_id/roles). */
interface RoleAssignmentResult {
  user_id: string;
  role_id: string;
  created_at: Date;
}

async function ensureRoleActive(roleId: string): Promise<void> {
  const role = await prisma.role.findFirst({ where: { id: roleId, delete_date: null }, select: { id: true } });
  if (!role) throw new HttpError(404, 'Role not found');
}

async function resolveRoleNameToId(name: string): Promise<string> {
  const role = await prisma.role.findFirst({ where: { name, delete_date: null }, select: { id: true } });
  if (!role) throw new HttpError(404, `Role ${name} not found`);
  return role.id;
}

export const userRolesService = {
  async list(username: string): Promise<RoleAssignmentView[]> {
    const userId = await resolveUsernameToId(username);
    const assignments = await prisma.userRole.findMany({
      where: { user_id: userId, delete_date: null, role: { delete_date: null } },
      select: { role_id: true, create_date: true, role: { select: { name: true } } },
      orderBy: { create_date: 'desc' },
    });
    return assignments.map((a) => ({ role_id: a.role_id, name: a.role.name, assigned_at: a.create_date }));
  },

  async assign(username: string, input: UserRoleCreate): Promise<RoleAssignmentResult> {
    const userId = await resolveUsernameToId(username);
    let roleId: string;
    if (input.role_id !== undefined) {
      await ensureRoleActive(input.role_id);
      roleId = input.role_id;
    } else {
      roleId = await resolveRoleNameToId(input.role_name as string);
    }

    const active = await prisma.userRole.findFirst({
      where: { user_id: userId, role_id: roleId, delete_date: null },
      select: { id: true },
    });
    if (active) throw new HttpError(409, 'Role already assigned to user', undefined, 'Conflict');

    // Reactivate a previously soft-deleted assignment instead of inserting a duplicate.
    const deleted = await prisma.userRole.findFirst({
      where: { user_id: userId, role_id: roleId, delete_date: { not: null } },
      select: { id: true },
      orderBy: { create_date: 'desc' },
    });

    const row = deleted
      ? await prisma.userRole.update({
          where: { id: deleted.id },
          data: { delete_date: null, create_date: new Date() },
          select: { role_id: true, create_date: true },
        })
      : await prisma.userRole.create({
          data: { user_id: userId, role_id: roleId },
          select: { role_id: true, create_date: true },
        });

    return { user_id: username, role_id: row.role_id, created_at: row.create_date };
  },

  async remove(username: string, roleId: string): Promise<void> {
    const userId = await resolveUsernameToId(username);
    const result = await prisma.userRole.updateMany({
      where: { user_id: userId, role_id: roleId, delete_date: null },
      data: { delete_date: new Date() },
    });
    if (result.count === 0) throw new HttpError(404, 'Role assignment not found');
  },
};
