/**
 * Live-data contract serializers for pictures. Maps internal `Picture` rows and
 * storage results to the contract's `/api/storage/pictures` shapes.
 */
import type { Picture } from '@prisma/client';

import type { DownloadUrl } from '../../storage/pictures.storage.js';

/** POST /api/storage/pictures (confirm) response. */
export function toContractPicture(p: Picture): {
  picture_id: string;
  object_key: string;
  bucket: string;
  file_name: string;
  uploaded_at: Date;
} {
  return {
    picture_id: p.id,
    object_key: p.s3_object_id,
    bucket: p.s3_bucket_id,
    file_name: p.file_name,
    uploaded_at: p.uploaded_at,
  };
}

/** GET /api/storage/pictures/:picture_id — image ref for AI. */
export function toContractPictureRef(p: Picture): {
  picture_id: string;
  image_path: string;
  object_key: string;
  bucket: string;
} {
  return {
    picture_id: p.id,
    image_path: `s3://${p.s3_bucket_id}/${p.s3_object_id}`,
    object_key: p.s3_object_id,
    bucket: p.s3_bucket_id,
  };
}

/** GET /api/storage/pictures/:picture_id/url — presigned URL for the UI. */
export function toContractDownloadUrl(d: DownloadUrl): {
  image_url: string;
  object_key: string;
  expires_at: string;
} {
  return {
    image_url: d.downloadUrl,
    object_key: d.object_key,
    expires_at: new Date(Date.now() + d.expiresIn * 1000).toISOString(),
  };
}
