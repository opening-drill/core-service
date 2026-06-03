import type { Request, Response } from 'express';

import { getParam, getQuery } from '../../middleware/validate.js';
import { picturesService } from './pictures.service.js';
import type { PictureCreate, PictureUploadIntent } from './pictures.schema.js';
import { pictureListQuerySchema } from './pictures.schema.js';

export const picturesController = {
  async list(req: Request, res: Response): Promise<void> {
    res.json(await picturesService.list(getQuery(req, pictureListQuerySchema)));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await picturesService.getById(getParam(req, 'id')));
  },

  async uploadIntent(req: Request, res: Response): Promise<void> {
    res.json(await picturesService.createUploadIntent(req.body as PictureUploadIntent));
  },

  async create(req: Request, res: Response): Promise<void> {
    res.status(201).json(await picturesService.confirm(req.body as PictureCreate));
  },

  async downloadUrl(req: Request, res: Response): Promise<void> {
    res.json(await picturesService.getDownloadUrl(getParam(req, 'id')));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await picturesService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
};
