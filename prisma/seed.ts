/**
 * Seed: baseline RBAC data so the service is usable immediately.
 *
 * Idempotent — safe to re-run. Creates:
 *   - both PermissionType rows (VIEW, EDIT)
 *   - an `admin` role (VIEW + EDIT) and a `viewer` role (VIEW)
 *   - an `admin` user (password bcrypt-hashed)
 *
 * Override the admin credentials with SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD.
 */
import { PermissionType } from '@prisma/client';

import { hashPassword } from '../src/lib/password.js';
import { prisma } from '../src/lib/prisma.js';

/** Finds an active role by name or creates it (role.name has no DB unique). */
async function ensureRole(name: string): Promise<string> {
  const existing = await prisma.role.findFirst({ where: { name, delete_date: null } });
  if (existing) return existing.id;
  const created = await prisma.role.create({ data: { name } });
  return created.id;
}

async function ensureRolePermission(roleId: string, permission: PermissionType): Promise<void> {
  const existing = await prisma.rolePermission.findFirst({
    where: { role_id: roleId, permission, delete_date: null },
  });
  if (!existing) {
    await prisma.rolePermission.create({ data: { role_id: roleId, permission } });
  }
}

async function main(): Promise<void> {
  // Permissions (PK is the enum value).
  for (const permission of [PermissionType.VIEW, PermissionType.EDIT]) {
    await prisma.permission.upsert({
      where: { permission },
      update: { delete_date: null },
      create: { permission },
    });
  }

  // Roles + their permissions.
  const adminRoleId = await ensureRole('admin');
  await ensureRolePermission(adminRoleId, PermissionType.VIEW);
  await ensureRolePermission(adminRoleId, PermissionType.EDIT);

  const viewerRoleId = await ensureRole('viewer');
  await ensureRolePermission(viewerRoleId, PermissionType.VIEW);

  // Admin user.
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234';
  const hashed = await hashPassword(password);
  const admin = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { full_name: 'Administrator', username, password: hashed },
  });

  const adminAssignment = await prisma.userRole.findFirst({
    where: { user_id: admin.id, role_id: adminRoleId, delete_date: null },
  });
  if (!adminAssignment) {
    await prisma.userRole.create({ data: { user_id: admin.id, role_id: adminRoleId } });
  }

  process.stdout.write(`Seed complete. Admin user: "${username}".\n`);
}

main()
  .catch((err: unknown) => {
    process.stderr.write(`Seed failed: ${String(err)}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
