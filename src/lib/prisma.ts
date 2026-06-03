import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { env, isProduction } from '../config/env.js';

// Setup singleton PrismaClient for Prisma 7 with driver adapter.
// Importing `env` first ensures any local .env file has been loaded before the
// connection string is resolved.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

const connectionString =
  env.DATABASE_URL
if (isProduction) {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };

/**
 * GeoJSON Zod schemas & types live in `src/geo/geo.ts` (the single source of
 * truth, RFC 7946 with WGS84 bounds). Re-exported here for backward
 * compatibility with earlier imports.
 */
export {
  GeoJsonPointSchema,
  GeoJsonPolygonSchema,
  type GeoJsonPoint,
  type GeoJsonPolygon,
} from '../geo/geo.js';
