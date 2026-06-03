import { Router } from 'express';
import multer from 'multer';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { picturesController } from './pictures.controller.js';
import {
  pictureIdParamSchema,
  pictureListQuerySchema,
  pictureUploadFieldsSchema,
  pictureUrlQuerySchema,
} from './pictures.schema.js';

export const picturesRouter = Router();

// Single-request upload: keep the file in memory (we stream it straight to S3),
// capped to guard against oversized payloads transiting the API.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

picturesRouter.get('/', requireView, validate({ query: pictureListQuerySchema }), asyncHandler(picturesController.list));
picturesRouter.post(
  '/',
  requireEdit,
  upload.single('file'),
  validate({ body: pictureUploadFieldsSchema }),
  asyncHandler(picturesController.create),
);
picturesRouter.get(
  '/:id/url',
  requireView,
  validate({ params: pictureIdParamSchema, query: pictureUrlQuerySchema }),
  asyncHandler(picturesController.downloadUrl),
);
picturesRouter.get('/:id', requireView, validate({ params: pictureIdParamSchema }), asyncHandler(picturesController.getById));
picturesRouter.delete('/:id', requireEdit, validate({ params: pictureIdParamSchema }), asyncHandler(picturesController.remove));
