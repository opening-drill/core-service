/**
 * Picture storage — object-storage concerns for event PNGs.
 *
 * Uploads are a single request: the API receives the binary, writes it to
 * object storage server-side (`uploadPicture`), and the pictures service
 * persists a `picture` row from the returned identifiers. Downloads are served
 * via short-lived signed GET URLs (GCS or S3/MinIO).
 *
 * DB persistence lives in the pictures service; this module is storage-only.
 */
import { randomUUID } from 'node:crypto';

import { getPresignedGetUrl, putObject, requireS3Env } from '../lib/s3.js';

export interface UploadedPicture {
  s3_object_id: string;
  s3_bucket_id: string;
  file_name: string;
}

export interface DownloadUrl {
  downloadUrl: string;
  object_key: string;
  expiresIn: number;
}

/** Builds a collision-free object key that preserves the original file name. */
function buildObjectKey(fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `pictures/${randomUUID()}/${safeName}`;
}

/**
 * Uploads the bytes server-side to the configured bucket and returns the
 * identifiers to persist. The destination bucket is server-controlled only.
 */
export async function uploadPicture(input: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}): Promise<UploadedPicture> {
  const key = buildObjectKey(input.fileName);
  const bucket = await putObject(key, input.buffer, input.contentType);
  return { s3_object_id: key, s3_bucket_id: bucket, file_name: input.fileName };
}

/**
 * Creates a short-lived pre-signed GET URL for an existing object. `expiresIn`
 * (seconds) overrides the configured default (contract `?expires=`).
 */
export async function createDownloadUrl(
  objectKey: string,
  expiresIn?: number,
): Promise<DownloadUrl> {
  const cfg = requireS3Env();
  const effectiveExpiry = expiresIn ?? cfg.presignExpirySeconds;
  const downloadUrl = await getPresignedGetUrl(objectKey, effectiveExpiry);
  return { downloadUrl, object_key: objectKey, expiresIn: effectiveExpiry };
}
