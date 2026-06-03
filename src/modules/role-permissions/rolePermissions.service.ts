import { PermissionType } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';

interface PermissionAssignmentView {
  permission: PermissionType;
  assigned_at: Date;
}

async function ensureRoleActive(roleId: string): Promise<void> {
  const role = await prisma.role.findFirst({ where: { id: roleId, delete_date: null }, select: { id: true } });
  if (!role) throw new HttpError(404, 'Role not found');
}

async function ensurePermissionActive(permission: PermissionType): Promise<void> {
  const row = await prisma.permission.findFirst({
    where: { permission, delete_date: null },
    select: { permission: true },
  });
  if (!row) throw new HttpError(404, 'Permission not found');
}

export const rolePermissionsService = {
  async list(roleId: string): Promise<PermissionAssignmentView[]> {
    await ensureRoleActive(roleId);
    const rows = await prisma.rolePermission.findMany({
      where: { role_id: roleId, delete_date: null, permission_ref: { delete_date: null } },
      select: { permission: true, create_date: true },
      orderBy: { create_date: 'desc' },
    });
    return rows.map((r) => ({ permission: r.permission, assigned_at: r.create_date }));
  },

  async assign(roleId: string, permission: PermissionType): Promise<PermissionAssignmentView> {
    await ensureRoleActive(roleId);
    await ensurePermissionActive(permission);

    const active = await prisma.rolePermission.findFirst({
      where: { role_id: roleId, permission, delete_date: null },
      select: { id: true },
    });
    if (active) throw new HttpError(409, 'Permission already assigned to role', undefined, 'Conflict');

    const deleted = await prisma.rolePermission.findFirst({
      where: { role_id: roleId, permission, delete_date: { not: null } },
      select: { id: true },
      orderBy: { create_date: 'desc' },
    });

    const row = deleted
      ? await prisma.rolePermission.update({
          where: { id: deleted.id },
          data: { delete_date: null, create_date: new Date() },
          select: { permission: true, create_date: true },
        })
      : await prisma.rolePermission.create({
          data: { role_id: roleId, permission },
          select: { permission: true, create_date: true },
        });

    return { permission: row.permission, assigned_at: row.create_date };
  },

  async remove(roleId: string, permission: PermissionType): Promise<void> {
    const result = await prisma.rolePermission.updateMany({
      where: { role_id: roleId, permission, delete_date: null },
      data: { delete_date: new Date() },
    });
    if (result.count === 0) throw new HttpError(404, 'Permission assignment not found');
  },
};
