import { existsSync } from 'node:fs';

import { z } from 'zod';

// Load a local .env file when present (development). In containers / production
// configuration comes from the real environment, so a missing file is fine.
// Uses Node's native loader (no dependency); guarded for older runtimes.
if (typeof process.loadEnvFile === 'function' && existsSync('.env')) {
  process.loadEnvFile('.env');
}

/**
 * Typed, zod-validated environment configuration.
 * Parsing happens once at module load — the process fails fast on boot if
 * anything required is missing or malformed.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // Datasource — required from M2 onward, optional during the M1 skeleton so
  // the service can boot and serve /health without a database.
  DATABASE_URL: z.string().url().optional(),

  // Authentication / password hashing.
  // `bcrypt` hashes new passwords and verifies via bcrypt, transparently
  // falling back to a constant-time plain compare for legacy plaintext rows.
  // `plain` forces plaintext comparison (only for an inherited dataset).
  PASSWORD_HASH_MODE: z.enum(['bcrypt', 'plain']).default('bcrypt'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  // S3 / MinIO object storage (picture upload/download via pre-signed URLs).
  // Optional so the skeleton boots without storage; `requireS3Env()` enforces
  // presence at the point of use (see src/lib/s3.ts).
  S3_ENDPOINT: z.string().url().optional(), // set for MinIO; omit for real AWS
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true), // MinIO needs path-style
  S3_PRESIGN_EXPIRY_SECONDS: z.coerce.number().int().positive().default(900),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    // Use stderr directly: the logger depends on this config, so it may not
    // exist yet when env validation fails.
    process.stderr.write(`Invalid environment configuration:\n${issues}\n`);
    process.exit(1);
  }
  return parsed.data;
}

export const env: Env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
