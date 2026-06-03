import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';

// Setup singleton PrismaClient for Prisma 7 with driver adapter
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:hashlama020@34.165.129.193:5432/AIrcraft-NP';

if (process.env.NODE_ENV === 'production') {
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
 * GeoJSON Zod Schemas & Types
 * Since location/area columns are stored as JSON in the database,
 * these Zod schemas validate coordinates and structures to comply with the GeoJSON standard (RFC 7946).
 */

export const GeoJsonPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
});

export type GeoJsonPoint = z.infer<typeof GeoJsonPointSchema>;

export const GeoJsonPathSchema = z.array(// TODO: Use for history
  z.tuple([z.number(), z.number()]),
);

export type GeoJsonPath = z.infer<typeof GeoJsonPathSchema>;

export const GeoJsonPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(
    z.array(z.tuple([z.number(), z.number()]))
      .min(3, { message: 'A polygon must have at least 3 coordinates' })
  ),
});

export type GeoJsonPolygon = z.infer<typeof GeoJsonPolygonSchema>;
