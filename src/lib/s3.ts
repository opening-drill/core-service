/**
 * S3 / MinIO client (AWS SDK v3) plus pre-signed URL helpers.
 *
 * Configuration comes from `config/env.ts`. S3 vars are optional so the service
 * boots without storage; `requireS3Env()` enforces presence the first time a
 * picture endpoint needs object storage.
 */
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';

interface ResolvedS3Config {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  presignExpirySeconds: number;
}

/** Throws 500 unless all required S3 settings are present. */
export function requireS3Env(): ResolvedS3Config {
  const missing: string[] = [];
  if (!env.S3_BUCKET) missing.push('S3_BUCKET');
  if (!env.S3_ACCESS_KEY_ID) missing.push('S3_ACCESS_KEY_ID');
  if (!env.S3_SECRET_ACCESS_KEY) missing.push('S3_SECRET_ACCESS_KEY');
  if (missing.length > 0) {
    throw new HttpError(
      500,
      `Object storage is not configured (missing: ${missing.join(', ')})`,
      undefined,
      'StorageNotConfigured',
    );
  }
  return {
    bucket: env.S3_BUCKET as string,
    region: env.S3_REGION,
    ...(env.S3_ENDPOINT !== undefined ? { endpoint: env.S3_ENDPOINT } : {}),
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    accessKeyId: env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY as string,
    presignExpirySeconds: env.S3_PRESIGN_EXPIRY_SECONDS,
  };
}

const globalForS3 = globalThis as unknown as { s3Client: S3Client | undefined };

/** Lazily-constructed singleton S3 client. */
export function getS3Client(): S3Client {
  if (!globalForS3.s3Client) {
    const cfg = requireS3Env();
    globalForS3.s3Client = new S3Client({
      region: cfg.region,
      forcePathStyle: cfg.forcePathStyle,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
      ...(cfg.endpoint !== undefined ? { endpoint: cfg.endpoint } : {}),
    });
  }
  return globalForS3.s3Client;
}

/** Pre-signed PUT URL the client uses to upload object bytes directly. */
export async function getPresignedPutUrl(key: string, contentType: string): Promise<string> {
  const cfg = requireS3Env();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: cfg.presignExpirySeconds });
}

/** Pre-signed GET URL for downloading an object. */
export async function getPresignedGetUrl(key: string): Promise<string> {
  const cfg = requireS3Env();
  const command = new GetObjectCommand({ Bucket: cfg.bucket, Key: key });
  return getSignedUrl(getS3Client(), command, { expiresIn: cfg.presignExpirySeconds });
}

/** Returns true if the object exists in the bucket. */
export async function objectExists(key: string): Promise<boolean> {
  const cfg = requireS3Env();
  try {
    await getS3Client().send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}
