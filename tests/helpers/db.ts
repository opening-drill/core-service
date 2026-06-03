/**
 * Integration-test database helpers.
 *
 * SAFETY: these refuse to operate unless DATABASE_URL points at a dedicated
 * test database. The known shared/production host is hard-blocked so a stray
 * `npm test` can never truncate live data. Integration tests should guard with
 * `describe.skipIf(!hasTestDb)` (or `it.skipIf`).
 */
import { PrismaClient, PermissionType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { hashPassword } from '../../src/lib/password.js';

const PROD_HOST_MARKER = '34.165.129.193';

const dbUrl = process.env.DATABASE_URL;

/** True only when a dedicated, non-production test database is configured. */
export const hasTestDb: boolean =
  typeof dbUrl === 'string' && dbUrl.length > 0 && !dbUrl.includes(PROD_HOST_MARKER);

let client: PrismaClient | undefined;

/** Lazily builds a Prisma client bound to the test database. */
export function testPrisma(): PrismaClient {
  if (!hasTestDb || !dbUrl) {
    throw new Error('Refusing to use the database: DATABASE_URL is not a dedicated test DB.');
  }
  if (!client) {
    const pool = new Pool({ connectionString: dbUrl });
    client = new PrismaClient({ adapter: new PrismaPg(pool) });
  }
  return client;
}

const TABLES = [
  'event',
  'ai_recommendation',
  'ai_analysis',
  'aircraft_path_history',
  'aircraft',
  'aircraft_type',
  'target',
  'polygon',
  'picture',
  'role_permission',
  'user_role',
  'permission',
  'role',
  '"user"',
];

/** Truncates every table (FK-safe via CASCADE) and resets identity sequences. */
export async function resetDatabase(): Promise<void> {
  const prisma = testPrisma();
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => (t.startsWith('"') ? t : `"${t}"`)).join(', ')} RESTART IDENTITY CASCADE`,
  );
}

export interface SeededRbac {
  adminUsername: string;
  adminPassword: string;
  viewerUsername: string;
  viewerPassword: string;
  adminRoleId: string;
  viewerRoleId: string;
}

/** Seeds permissions, admin/viewer roles + users. Returns known credentials. */
export async function seedTestRbac(): Promise<SeededRbac> {
  const prisma = testPrisma();
  for (const permission of [PermissionType.VIEW, PermissionType.EDIT]) {
    await prisma.permission.create({ data: { permission } });
  }
  const adminRole = await prisma.role.create({ data: { name: 'admin' } });
  await prisma.rolePermission.createMany({
    data: [
      { role_id: adminRole.id, permission: PermissionType.VIEW },
      { role_id: adminRole.id, permission: PermissionType.EDIT },
    ],
  });
  const viewerRole = await prisma.role.create({ data: { name: 'viewer' } });
  await prisma.rolePermission.create({
    data: { role_id: viewerRole.id, permission: PermissionType.VIEW },
  });

  const adminUsername = 'admin';
  const adminPassword = 'admin1234';
  const admin = await prisma.user.create({
    data: { full_name: 'Admin', username: adminUsername, password: await hashPassword(adminPassword) },
  });
  await prisma.userRole.create({ data: { user_id: admin.id, role_id: adminRole.id } });

  const viewerUsername = 'viewer';
  const viewerPassword = 'viewer1234';
  const viewer = await prisma.user.create({
    data: { full_name: 'Viewer', username: viewerUsername, password: await hashPassword(viewerPassword) },
  });
  await prisma.userRole.create({ data: { user_id: viewer.id, role_id: viewerRole.id } });

  return {
    adminUsername,
    adminPassword,
    viewerUsername,
    viewerPassword,
    adminRoleId: adminRole.id,
    viewerRoleId: viewerRole.id,
  };
}
