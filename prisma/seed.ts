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
import crypto from 'crypto';
import { PermissionType } from '@prisma/client';

import { hashPassword } from '../src/lib/password.js';
import { prisma } from '../src/lib/prisma.js';

function deterministicUuid(name: string): string {
  const hash = crypto.createHash('sha256').update(name).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-');
}

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

  // C2 WAR ROOM SYSTEM - MASSIVE AIRCRAFT & TELEMETRY HISTORY SEED
  const now = new Date();
  const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const aircraftTypes = [
    { id: 'F15I_RAAM', name: 'F-15I רעם', price: 14850, velocity_kmh: 2575.42, payload_kg: 11115.55 },
    { id: 'F35I_ADIR', name: 'F-35I אדיר', price: 21900, velocity_kmh: 1931.21, payload_kg: 8164.66 },
    { id: 'F16I_SUFA', name: 'F-16I סופה', price: 9450, velocity_kmh: 2414.08, payload_kg: 5896.72 },
    { id: 'HERON_TP_EITAN', name: 'Heron TP איתן', price: 4120, velocity_kmh: 407.45, payload_kg: 2687.23 },
    { id: 'HERMES_900_KOCHAV', name: 'Hermes 900 כוכב', price: 2480, velocity_kmh: 222.41, payload_kg: 348.55 },
    { id: 'HERMES_450_ZIK', name: 'Hermes 450 זיק', price: 1150, velocity_kmh: 176.28, payload_kg: 178.44 },
    { id: 'MATRICE_300_STRIKE', name: 'Matrice 300 תוקף', price: 295, velocity_kmh: 82.83, payload_kg: 2.65 }
  ];

  for (const type of aircraftTypes) {
    const uuid = deterministicUuid(type.id);
    await prisma.aircraftType.upsert({
      where: { id: uuid },
      update: {},
      create: {
        id: uuid,
        name: type.name,
        price: type.price,
        velocity_kmh: type.velocity_kmh,
        payload_kg: type.payload_kg,
        create_date: date30DaysAgo,
      }
    });
  }

  const aircraftData = [
    { id: '201', type_id: 'F15I_RAAM', status: 'FREE', msAgo: 14 * 60 * 1000 },
    { id: '204', type_id: 'F15I_RAAM', status: 'FREE', msAgo: 3 * 60 * 60 * 1000 },
    { id: '212', type_id: 'F15I_RAAM', status: 'BUSY', msAgo: 42 * 60 * 1000 },
    { id: '241', type_id: 'F15I_RAAM', status: 'FREE', msAgo: 8 * 60 * 60 * 1000 },
    { id: '265', type_id: 'F15I_RAAM', status: 'BROKEN', msAgo: 5 * 60 * 60 * 1000 },
    { id: '901', type_id: 'F35I_ADIR', status: 'FREE', msAgo: 4 * 60 * 60 * 1000 },
    { id: '903', type_id: 'F35I_ADIR', status: 'BUSY', msAgo: 48 * 60 * 1000 },
    { id: '909', type_id: 'F35I_ADIR', status: 'FREE', msAgo: 1 * 60 * 60 * 1000 },
    { id: '914', type_id: 'F35I_ADIR', status: 'BUSY', msAgo: 5 * 60 * 1000 },
    { id: '104', type_id: 'F16I_SUFA', status: 'FREE', msAgo: 3 * 60 * 60 * 1000 },
    { id: '107', type_id: 'F16I_SUFA', status: 'FREE', msAgo: 53 * 60 * 1000 },
    { id: '115', type_id: 'F16I_SUFA', status: 'BUSY', msAgo: 22 * 60 * 1000 },
    { id: '402', type_id: 'F16I_SUFA', status: 'FREE', msAgo: 9 * 60 * 60 * 1000 },
    { id: '459', type_id: 'F16I_SUFA', status: 'BUSY', msAgo: 31 * 60 * 1000 },
    { id: '803', type_id: 'F16I_SUFA', status: 'BROKEN', msAgo: 2 * 24 * 60 * 60 * 1000 },

    { id: '815', type_id: 'HERON_TP_EITAN', status: 'FREE', msAgo: 5 * 60 * 60 * 1000 },
    { id: '818', type_id: 'HERON_TP_EITAN', status: 'BUSY', msAgo: 1 * 60 * 60 * 1000 },
    { id: '840', type_id: 'HERON_TP_EITAN', status: 'BUSY', msAgo: 2 * 60 * 60 * 1000 },
    { id: '310', type_id: 'HERMES_900_KOCHAV', status: 'FREE', msAgo: 6 * 60 * 60 * 1000 },
    { id: '325', type_id: 'HERMES_900_KOCHAV', status: 'BUSY', msAgo: 2 * 60 * 60 * 1000 },
    { id: '352', type_id: 'HERMES_900_KOCHAV', status: 'BUSY', msAgo: 1 * 60 * 60 * 1000 },
    { id: '401', type_id: 'HERMES_450_ZIK', status: 'BUSY', msAgo: 55 * 60 * 1000 },
    { id: '415', type_id: 'HERMES_450_ZIK', status: 'FREE', msAgo: 2 * 60 * 60 * 1000 },
    { id: '441', type_id: 'HERMES_450_ZIK', status: 'BUSY', msAgo: 18 * 60 * 1000 },

    { id: 'DRN-A101', type_id: 'MATRICE_300_STRIKE', status: 'FREE', msAgo: 4 * 60 * 60 * 1000 },
    { id: 'DRN-A103', type_id: 'MATRICE_300_STRIKE', status: 'BUSY', msAgo: 35 * 60 * 1000 },
    { id: 'DRN-B203', type_id: 'MATRICE_300_STRIKE', status: 'BROKEN', msAgo: 6 * 60 * 60 * 1000 },
    { id: 'DRN-B205', type_id: 'MATRICE_300_STRIKE', status: 'BUSY', msAgo: 14 * 60 * 1000 },
    { id: 'DRN-C302', type_id: 'MATRICE_300_STRIKE', status: 'BUSY', msAgo: 41 * 60 * 1000 }
  ];

  for (const ac of aircraftData) {
    const uuid = deterministicUuid(ac.id);
    const typeUuid = deterministicUuid(ac.type_id);
    await prisma.aircraft.upsert({
      where: { id: uuid },
      update: {},
      create: {
        id: uuid,
        type_id: typeUuid,
        status: ac.status as any,
        update_date: new Date(now.getTime() - ac.msAgo),
      }
    });
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
