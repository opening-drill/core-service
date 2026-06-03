import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireEdit, requireView } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { picturesController } from './pictures.controller.js';
import {
  pictureCreateSchema,
  pictureIdParamSchema,
  pictureListQuerySchema,
  pictureUploadIntentSchema,
} from './pictures.schema.js';

export const picturesRouter = Router();

picturesRouter.post(
  '/upload-intent',
  requireEdit,
  validate({ body: pictureUploadIntentSchema }),
  asyncHandler(picturesController.uploadIntent),
);
picturesRouter.get('/', requireView, validate({ query: pictureListQuerySchema }), asyncHandler(picturesController.list));
picturesRouter.post('/', requireEdit, validate({ body: pictureCreateSchema }), asyncHandler(picturesController.create));
picturesRouter.get(
  '/:id/download-url',
  requireView,
  validate({ params: pictureIdParamSchema }),
  asyncHandler(picturesController.downloadUrl),
);
picturesRouter.get('/:id', requireView, validate({ params: pictureIdParamSchema }), asyncHandler(picturesController.getById));
picturesRouter.delete('/:id', requireEdit, validate({ params: pictureIdParamSchema }), asyncHandler(picturesController.remove));
