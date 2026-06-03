import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';

interface RoleAssignmentView {
  role_id: string;
  name: string;
  assigned_at: Date;
}

async function ensureUserActive(userId: string): Promise<void> {
  const user = await prisma.user.findFirst({ where: { id: userId, delete_date: null }, select: { id: true } });
  if (!user) throw new HttpError(404, 'User not found');
}

async function ensureRoleActive(roleId: string): Promise<{ name: string }> {
  const role = await prisma.role.findFirst({
    where: { id: roleId, delete_date: null },
    select: { name: true },
  });
  if (!role) throw new HttpError(404, 'Role not found');
  return role;
}

export const userRolesService = {
  async list(userId: string): Promise<RoleAssignmentView[]> {
    await ensureUserActive(userId);
    const assignments = await prisma.userRole.findMany({
      where: { user_id: userId, delete_date: null, role: { delete_date: null } },
      select: { role_id: true, create_date: true, role: { select: { name: true } } },
      orderBy: { create_date: 'desc' },
    });
    return assignments.map((a) => ({ role_id: a.role_id, name: a.role.name, assigned_at: a.create_date }));
  },

  async assign(userId: string, roleId: string): Promise<RoleAssignmentView> {
    await ensureUserActive(userId);
    const role = await ensureRoleActive(roleId);

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

    return { role_id: row.role_id, name: role.name, assigned_at: row.create_date };
  },

  async remove(userId: string, roleId: string): Promise<void> {
    const result = await prisma.userRole.updateMany({
      where: { user_id: userId, role_id: roleId, delete_date: null },
      data: { delete_date: new Date() },
    });
    if (result.count === 0) throw new HttpError(404, 'Role assignment not found');
  },
};
