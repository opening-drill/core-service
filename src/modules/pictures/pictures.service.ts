import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, toPrismaList } from '../../lib/query.js';
import { withPrismaErrors } from '../../lib/prismaErrors.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { createDownloadUrl, createUploadUrl, type DownloadUrl, type UploadUrl } from '../../storage/pictures.storage.js';
import type { PictureCreate, PictureListQuery, PictureUploadIntent } from './pictures.schema.js';

export const picturesService = {
  async list(query: PictureListQuery) {
    const where: Prisma.PictureWhereInput = {
      ...(query.file_name !== undefined
        ? { file_name: { contains: query.file_name, mode: 'insensitive' } }
        : {}),
    };
    const { skip, take, orderBy } = toPrismaList(query, 'uploaded_at');
    const [data, total] = await prisma.$transaction([
      prisma.picture.findMany({ where, skip, take, orderBy }),
      prisma.picture.count({ where }),
    ]);
    return buildListResult(data, { page: query.page, limit: query.limit, total });
  },

  async getById(id: string) {
    const picture = await prisma.picture.findUnique({ where: { id } });
    if (!picture) throw new HttpError(404, 'Picture not found');
    return picture;
  },

  /** Phase 1: hand the client a pre-signed PUT URL + the identifiers to record. */
  async createUploadIntent(input: PictureUploadIntent): Promise<UploadUrl> {
    return createUploadUrl(input.file_name, input.content_type);
  },

  /** Phase 3: persist the picture row after the client uploaded the bytes. */
  async confirm(input: PictureCreate) {
    return prisma.picture.create({
      data: {
        file_name: input.file_name,
        s3_object_id: input.s3_object_id,
        s3_bucket_id: input.s3_bucket_id,
      },
    });
  },

  async getDownloadUrl(id: string): Promise<DownloadUrl> {
    const picture = await this.getById(id);
    return createDownloadUrl(picture.s3_object_id);
  },

  async remove(id: string) {
    // Hard delete (no delete_date). RESTRICT from event / ai_analysis → 409.
    await withPrismaErrors(() => prisma.picture.delete({ where: { id } }), {
      notFound: 'Picture not found',
      conflict: 'Cannot delete picture: it is referenced by events or analyses',
    });
  },
};
