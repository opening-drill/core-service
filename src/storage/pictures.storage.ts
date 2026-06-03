/**
 * Picture storage — object-storage concerns for event PNGs.
 *
 * Uploads use a two-phase, pre-signed flow so bytes never transit the API:
 *   1. `createUploadUrl` returns a pre-signed PUT URL + the `s3_object_id`
 *      (key) and `s3_bucket_id` (bucket) the client should record.
 *   2. The client PUTs the file directly to S3/MinIO.
 *   3. The pictures service persists a `picture` row from those identifiers.
 * Downloads are served via short-lived pre-signed GET URLs.
 *
 * DB persistence lives in the pictures service; this module is storage-only.
 */
import { randomUUID } from 'node:crypto';

import { getPresignedGetUrl, getPresignedPutUrl, requireS3Env } from '../lib/s3.js';

export interface UploadUrl {
  uploadUrl: string;
  s3_object_id: string;
  s3_bucket_id: string;
  expiresIn: number;
}

export interface DownloadUrl {
  downloadUrl: string;
  expiresIn: number;
}

/** Builds a collision-free object key that preserves the original file name. */
function buildObjectKey(fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `pictures/${randomUUID()}/${safeName}`;
}

/** Creates a pre-signed PUT URL and the identifiers to persist afterwards. */
export async function createUploadUrl(
  fileName: string,
  contentType: string,
): Promise<UploadUrl> {
  const cfg = requireS3Env();
  const key = buildObjectKey(fileName);
  const uploadUrl = await getPresignedPutUrl(key, contentType);
  return {
    uploadUrl,
    s3_object_id: key,
    s3_bucket_id: cfg.bucket,
    expiresIn: cfg.presignExpirySeconds,
  };
}

/** Creates a short-lived pre-signed GET URL for an existing object. */
export async function createDownloadUrl(objectKey: string): Promise<DownloadUrl> {
  const cfg = requireS3Env();
  const downloadUrl = await getPresignedGetUrl(objectKey);
  return { downloadUrl, expiresIn: cfg.presignExpirySeconds };
}
