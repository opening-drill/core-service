/**
 * Object storage — Google Cloud Storage (ADC) or S3/MinIO (static keys).
 *
 * When `GCS_BUCKET` is set, uses Application Default Credentials:
 * - Local: `gcloud auth application-default login`
 * - GCP (Cloud Run, GCE, GKE): runtime service account via metadata server
 *
 * When only `S3_*` is set, uses the AWS SDK (MinIO or AWS) with access keys.
 *
 * Configuration comes from `config/env.ts`. Storage vars are optional so the
 * service boots without object storage; `requireS3Env()` enforces presence the
 * first time a picture endpoint needs it.
 */
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Storage } from '@google-cloud/storage';

import { env } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';

type StorageBackend = 'gcs' | 's3';

interface ResolvedStorageConfig {
  backend: StorageBackend;
  bucket: string;
  presignExpirySeconds: number;
  /** S3-only */
  region?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
  /** GCS-only */
  projectId?: string;
}

function resolveBackend(): StorageBackend | undefined {
  if (env.GCS_BUCKET) return 'gcs';
  if (env.S3_BUCKET) return 's3';
  return undefined;
}

/** Throws 500 unless object storage is configured for the active backend. */
export function requireS3Env(): ResolvedStorageConfig {
  const backend = resolveBackend();
  if (!backend) {
    throw new HttpError(
      500,
      'Object storage is not configured (set GCS_BUCKET or S3_BUCKET with credentials)',
      undefined,
      'StorageNotConfigured',
    );
  }

  if (backend === 'gcs') {
    return {
      backend: 'gcs',
      bucket: env.GCS_BUCKET as string,
      presignExpirySeconds: env.GCS_PRESIGN_EXPIRY_SECONDS,
      ...(env.GCS_PROJECT_ID !== undefined ? { projectId: env.GCS_PROJECT_ID } : {}),
    };
  }

  const missing: string[] = [];
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
    backend: 's3',
    bucket: env.S3_BUCKET as string,
    region: env.S3_REGION,
    presignExpirySeconds: env.S3_PRESIGN_EXPIRY_SECONDS,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    accessKeyId: env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY as string,
    ...(env.S3_ENDPOINT !== undefined ? { endpoint: env.S3_ENDPOINT } : {}),
  };
}

const globalForStorage = globalThis as unknown as {
  gcsClient: Storage | undefined;
  s3Client: S3Client | undefined;
};

function getGcsClient(): Storage {
  if (!globalForStorage.gcsClient) {
    const cfg = requireS3Env();
    globalForStorage.gcsClient = new Storage(
      cfg.projectId !== undefined ? { projectId: cfg.projectId } : {},
    );
  }
  return globalForStorage.gcsClient;
}

/** Lazily-constructed singleton S3 client (MinIO / AWS only). */
export function getS3Client(): S3Client {
  const cfg = requireS3Env();
  if (cfg.backend !== 's3') {
    throw new HttpError(500, 'S3 client is not configured (GCS_BUCKET is set)', undefined, 'StorageNotConfigured');
  }
  if (!globalForStorage.s3Client) {
    globalForStorage.s3Client = new S3Client({
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: { accessKeyId: cfg.accessKeyId!, secretAccessKey: cfg.secretAccessKey! },
      ...(cfg.endpoint !== undefined ? { endpoint: cfg.endpoint } : {}),
    });
  }
  return globalForStorage.s3Client;
}

/**
 * Uploads object bytes server-side to the configured bucket.
 * Returns the bucket the object was written to (not caller-overridable).
 */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  const cfg = requireS3Env();
  if (cfg.backend === 'gcs') {
    await getGcsClient().bucket(cfg.bucket).file(key).save(body, {
      contentType,
      resumable: false,
    });
    return cfg.bucket;
  }

  await getS3Client().send(
    new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: body, ContentType: contentType }),
  );
  return cfg.bucket;
}

/**
 * Signed GET URL for downloading an object. `expiresIn` (seconds) overrides
 * the configured default when the caller passes one (contract `?expires=`).
 */
export async function getPresignedGetUrl(key: string, expiresIn?: number): Promise<string> {
  const cfg = requireS3Env();
  const expirySeconds = expiresIn ?? cfg.presignExpirySeconds;

  if (cfg.backend === 'gcs') {
    const [url] = await getGcsClient()
      .bucket(cfg.bucket)
      .file(key)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expirySeconds * 1000,
      });
    return url;
  }

  const command = new GetObjectCommand({ Bucket: cfg.bucket, Key: key });
  return getSignedUrl(getS3Client(), command, { expiresIn: expirySeconds });
}

/** Returns true if the object exists in the bucket. */
export async function objectExists(key: string): Promise<boolean> {
  const cfg = requireS3Env();

  if (cfg.backend === 'gcs') {
    const [exists] = await getGcsClient().bucket(cfg.bucket).file(key).exists();
    return exists;
  }

  try {
    await getS3Client().send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}
