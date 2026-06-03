import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { picturesService } from './pictures.service.js';
import type { PictureUploadFields } from './pictures.schema.js';
import { pictureListQuerySchema, pictureUrlQuerySchema } from './pictures.schema.js';
import {
  toContractDownloadUrl,
  toContractPicture,
  toContractPictureRef,
} from './pictures.serialize.js';

export const picturesController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await picturesService.list(getQuery(req, pictureListQuerySchema)));
  },

  /** GET /api/storage/pictures/:picture_id — image ref for AI. */
  async getById(req: Request, res: Response): Promise<void> {
    res.json(toContractPictureRef(await picturesService.getById(getParam(req, 'id'))));
  },

  /**
   * POST /api/storage/pictures — single-request multipart upload. Receives the
   * binary (`file`), uploads it to S3 server-side, and persists the row.
   */
  async create(req: Request, res: Response): Promise<void> {
    const file = req.file;
    if (!file) throw new HttpError(400, 'Missing file (multipart field "file")');
    const { file_name } = req.body as PictureUploadFields;
    const picture = await picturesService.upload({
      buffer: file.buffer,
      fileName: file_name ?? file.originalname,
      contentType: file.mimetype || 'application/octet-stream',
    });
    res.status(201).json(toContractPicture(picture));
  },

  /** GET /api/storage/pictures/:picture_id/url — presigned URL for the UI. */
  async downloadUrl(req: Request, res: Response): Promise<void> {
    const { expires } = getQuery(req, pictureUrlQuerySchema);
    res.json(toContractDownloadUrl(await picturesService.getDownloadUrl(getParam(req, 'id'), expires)));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await picturesService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
