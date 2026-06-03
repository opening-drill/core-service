/**
 * Seed: baseline RBAC data + full fleet roster.
 *
 * Idempotent — safe to re-run. Creates:
 *   - both PermissionType rows (VIEW, EDIT)
 *   - an `admin` role (VIEW + EDIT) and a `viewer` role (VIEW)
 *   - an `admin` user (password bcrypt-hashed)
 *   - aircraft types (fighters, helicopters, strategic UAVs, tactical drones, loitering munitions)
 *   - 100+ physical aircraft across the fleet
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
  // ===================================================================
  // RBAC baseline
  // ===================================================================

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

  // ===================================================================
  // 1. Aircraft types — models & technical specs
  // ===================================================================

  const aircraftTypes = [
    // מטוסי קרב כבדים ורב-משימתיים
    { id: 'F15I_RAAM',            name: 'F-15I רעם',                  price: 14850, velocity_kmh: 2575.42, payload_kg: 11115.55 },
    { id: 'F35I_ADIR',            name: 'F-35I אדיר',                 price: 21900, velocity_kmh: 1931.18, payload_kg: 8164.66 },
    { id: 'F16I_SUFA',            name: 'F-16I סופה',                 price: 9450,  velocity_kmh: 2414.05, payload_kg: 5896.82 },
    // מסוקי קרב וסער
    { id: 'APACHE_AH64',          name: 'Apache AH-64 פתן',           price: 11250, velocity_kmh: 265.45,  payload_kg: 771.12 },
    { id: 'CH54_YASUR',           name: 'CH-53 Yasur יסעור',          price: 8350,  velocity_kmh: 314.85,  payload_kg: 5443.11 },
    { id: 'BLACKHAWK_YANSHUF',    name: 'UH-60 Black Hawk ינשוף',     price: 5420,  velocity_kmh: 294.32,  payload_kg: 1197.48 },
    // כטב"מים אסטרטגיים וטקטיים
    { id: 'HERON_TP_EITAN',       name: 'Heron TP איתן',              price: 4120,  velocity_kmh: 407.55,  payload_kg: 2687.22 },
    { id: 'HERMES_900_KOCHAV',    name: 'Hermes 900 כוכב',            price: 2480,  velocity_kmh: 222.38,  payload_kg: 348.54 },
    { id: 'HERMES_450_ZIK',       name: 'Hermes 450 זיק',             price: 1150,  velocity_kmh: 176.25,  payload_kg: 178.44 },
    { id: 'ORBITER_4',            name: 'Orbiter 4 טקטי',             price: 680,   velocity_kmh: 129.64,  payload_kg: 11.85 },
    // רחפנים מחומשים, טקטיים וחימוש משוטט
    { id: 'MATRICE_300_STRIKE',   name: 'Matrice 300 תוקף',           price: 295,   velocity_kmh: 82.85,   payload_kg: 2.65 },
    { id: 'DJI_AGRAS_HEAVY',      name: 'DJI Agras נשיאה כבדה',       price: 415,   velocity_kmh: 64.22,   payload_kg: 39.45 },
    { id: 'FPV_RACING_BOMB',      name: 'FPV קוואד מתאבד',            price: 125,   velocity_kmh: 142.74,  payload_kg: 1.15 },
    { id: 'HAROP_LOITERING',      name: 'Harop חימוש משוטט',          price: 3150,  velocity_kmh: 416.35,  payload_kg: 22.88 },
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
      }
    });
  }

  // ===================================================================
  // 2. Physical aircraft in the field — 100+ airframes
  // ===================================================================

  type AcStatus = 'BUSY' | 'FREE';

  const aircraftData: { id: string; type_id: string; status: AcStatus }[] = [
    // צי מטוסי קרב (מזהי זנב תלת-ספרתיים)
    { id: '201',  type_id: 'F15I_RAAM',  status: 'BUSY' },
    { id: '204',  type_id: 'F15I_RAAM',  status: 'FREE' },
    { id: '212',  type_id: 'F15I_RAAM',  status: 'FREE' },
    { id: '219',  type_id: 'F15I_RAAM',  status: 'BUSY' },
    { id: '901',  type_id: 'F35I_ADIR',  status: 'BUSY' },
    { id: '903',  type_id: 'F35I_ADIR',  status: 'FREE' },
    { id: '908',  type_id: 'F35I_ADIR',  status: 'FREE' },
    { id: '911',  type_id: 'F35I_ADIR',  status: 'BUSY' },
    { id: '925',  type_id: 'F35I_ADIR',  status: 'FREE' },
    { id: '402',  type_id: 'F16I_SUFA',  status: 'FREE' },
    { id: '415',  type_id: 'F16I_SUFA',  status: 'BUSY' },
    { id: '451',  type_id: 'F16I_SUFA',  status: 'FREE' },
    { id: '478',  type_id: 'F16I_SUFA',  status: 'FREE' },
    { id: '499',  type_id: 'F16I_SUFA',  status: 'BUSY' },

    // צי מסוקים
    { id: '104',  type_id: 'APACHE_AH64',       status: 'FREE' },
    { id: '112',  type_id: 'APACHE_AH64',       status: 'BUSY' },
    { id: '128',  type_id: 'APACHE_AH64',       status: 'FREE' },
    { id: '302',  type_id: 'CH54_YASUR',         status: 'FREE' },
    { id: '317',  type_id: 'CH54_YASUR',         status: 'BUSY' },
    { id: '339',  type_id: 'CH54_YASUR',         status: 'FREE' },
    { id: '505',  type_id: 'BLACKHAWK_YANSHUF',  status: 'FREE' },
    { id: '514',  type_id: 'BLACKHAWK_YANSHUF',  status: 'BUSY' },
    { id: '522',  type_id: 'BLACKHAWK_YANSHUF',  status: 'FREE' },
    { id: '541',  type_id: 'BLACKHAWK_YANSHUF',  status: 'FREE' },

    // צי כטב"מים אסטרטגיים וטקטיים (קידומות UAV)
    { id: 'UAV-E01',  type_id: 'HERON_TP_EITAN',     status: 'BUSY' },
    { id: 'UAV-E02',  type_id: 'HERON_TP_EITAN',     status: 'FREE' },
    { id: 'UAV-E03',  type_id: 'HERON_TP_EITAN',     status: 'FREE' },
    { id: 'UAV-K11',  type_id: 'HERMES_900_KOCHAV',  status: 'FREE' },
    { id: 'UAV-K12',  type_id: 'HERMES_900_KOCHAV',  status: 'BUSY' },
    { id: 'UAV-K13',  type_id: 'HERMES_900_KOCHAV',  status: 'FREE' },
    { id: 'UAV-K14',  type_id: 'HERMES_900_KOCHAV',  status: 'FREE' },
    { id: 'UAV-Z21',  type_id: 'HERMES_450_ZIK',     status: 'BUSY' },
    { id: 'UAV-Z22',  type_id: 'HERMES_450_ZIK',     status: 'FREE' },
    { id: 'UAV-Z23',  type_id: 'HERMES_450_ZIK',     status: 'FREE' },
    { id: 'UAV-Z24',  type_id: 'HERMES_450_ZIK',     status: 'BUSY' },
    { id: 'UAV-Z25',  type_id: 'HERMES_450_ZIK',     status: 'FREE' },
    { id: 'UAV-O41',  type_id: 'ORBITER_4',          status: 'FREE' },
    { id: 'UAV-O42',  type_id: 'ORBITER_4',          status: 'FREE' },
    { id: 'UAV-O43',  type_id: 'ORBITER_4',          status: 'BUSY' },

    // נחיל רחפנים טקטיים ומחומשים (קידומות DRN)
    { id: 'DRN-M101',  type_id: 'MATRICE_300_STRIKE',  status: 'FREE' },
    { id: 'DRN-M102',  type_id: 'MATRICE_300_STRIKE',  status: 'BUSY' },
    { id: 'DRN-M103',  type_id: 'MATRICE_300_STRIKE',  status: 'FREE' },
    { id: 'DRN-M104',  type_id: 'MATRICE_300_STRIKE',  status: 'FREE' },
    { id: 'DRN-M105',  type_id: 'MATRICE_300_STRIKE',  status: 'BUSY' },
    { id: 'DRN-M106',  type_id: 'MATRICE_300_STRIKE',  status: 'FREE' },
    { id: 'DRN-M107',  type_id: 'MATRICE_300_STRIKE',  status: 'FREE' },
    { id: 'DRN-M108',  type_id: 'MATRICE_300_STRIKE',  status: 'FREE' },
    { id: 'DRN-H201',  type_id: 'DJI_AGRAS_HEAVY',     status: 'FREE' },
    { id: 'DRN-H202',  type_id: 'DJI_AGRAS_HEAVY',     status: 'BUSY' },
    { id: 'DRN-H203',  type_id: 'DJI_AGRAS_HEAVY',     status: 'FREE' },
    { id: 'DRN-H204',  type_id: 'DJI_AGRAS_HEAVY',     status: 'FREE' },

    // גל רחפני FPV מהירים/מתאבדים
    { id: 'FPV-A01',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-A02',  type_id: 'FPV_RACING_BOMB',  status: 'BUSY' },
    { id: 'FPV-A03',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-A04',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-A05',  type_id: 'FPV_RACING_BOMB',  status: 'BUSY' },
    { id: 'FPV-A06',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-A07',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-A08',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-A09',  type_id: 'FPV_RACING_BOMB',  status: 'BUSY' },
    { id: 'FPV-A10',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-B01',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-B02',  type_id: 'FPV_RACING_BOMB',  status: 'BUSY' },
    { id: 'FPV-B03',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-B04',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-B05',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-B06',  type_id: 'FPV_RACING_BOMB',  status: 'BUSY' },
    { id: 'FPV-B07',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-B08',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-B09',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-B10',  type_id: 'FPV_RACING_BOMB',  status: 'BUSY' },
    { id: 'FPV-C01',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-C02',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-C03',  type_id: 'FPV_RACING_BOMB',  status: 'BUSY' },
    { id: 'FPV-C04',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-C05',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-C06',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-C07',  type_id: 'FPV_RACING_BOMB',  status: 'BUSY' },
    { id: 'FPV-C08',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-C09',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },
    { id: 'FPV-C10',  type_id: 'FPV_RACING_BOMB',  status: 'FREE' },

    // משוטטים אסטרטגיים (מזהי HAR)
    { id: 'HAR-01',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
    { id: 'HAR-02',  type_id: 'HAROP_LOITERING',  status: 'BUSY' },
    { id: 'HAR-03',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
    { id: 'HAR-04',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
    { id: 'HAR-05',  type_id: 'HAROP_LOITERING',  status: 'BUSY' },
    { id: 'HAR-06',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
    { id: 'HAR-07',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
    { id: 'HAR-08',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
    { id: 'HAR-09',  type_id: 'HAROP_LOITERING',  status: 'BUSY' },
    { id: 'HAR-10',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
    { id: 'HAR-11',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
    { id: 'HAR-12',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
    { id: 'HAR-13',  type_id: 'HAROP_LOITERING',  status: 'BUSY' },
    { id: 'HAR-14',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
    { id: 'HAR-15',  type_id: 'HAROP_LOITERING',  status: 'FREE' },
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
        status: ac.status,
      }
    });
  }

  process.stdout.write(`Seed complete. Admin user: "${username}". Aircraft types: ${aircraftTypes.length}. Aircraft: ${aircraftData.length}.\n`);
}

main()
  .catch((err: unknown) => {
    process.stderr.write(`Seed failed: ${String(err)}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
