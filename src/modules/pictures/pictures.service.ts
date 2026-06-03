import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { buildListResult, toPrismaList } from '../../lib/query.js';
import { withPrismaErrors } from '../../lib/prismaErrors.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { createDownloadUrl, uploadPicture, type DownloadUrl } from '../../storage/pictures.storage.js';
import type { PictureListQuery } from './pictures.schema.js';

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

  /** Uploads the bytes to S3 server-side and persists the picture row. */
  async upload(input: { buffer: Buffer; fileName: string; contentType: string }) {
    const uploaded = await uploadPicture(input);
    return prisma.picture.create({
      data: {
        file_name: uploaded.file_name,
        s3_object_id: uploaded.s3_object_id,
        s3_bucket_id: uploaded.s3_bucket_id,
      },
    });
  },

  async getDownloadUrl(id: string, expiresIn?: number): Promise<DownloadUrl> {
    const picture = await this.getById(id);
    return createDownloadUrl(picture.s3_object_id, expiresIn);
  },

  async remove(id: string) {
    // Hard delete (no delete_date). RESTRICT from event / ai_analysis → 409.
    await withPrismaErrors(() => prisma.picture.delete({ where: { id } }), {
      notFound: 'Picture not found',
      conflict: 'Cannot delete picture: it is referenced by events or analyses',
    });
  },
};
