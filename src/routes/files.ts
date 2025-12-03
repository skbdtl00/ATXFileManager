import { Router } from 'express';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fileController from '../controllers/fileController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { uploadLimiter } from '../middleware/rateLimiter';
import { config } from '../config/env';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.storage.tempPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.storage.maxFileSize,
  },
});

// All routes require authentication
router.use(authenticate);

// File operations
router.post('/upload', uploadLimiter, upload.single('file'), fileController.uploadFile);

router.get('/', fileController.getFiles);

router.get('/search', fileController.searchFiles);

router.get('/:id', validate([param('id').isUUID()]), fileController.getFile);

router.get('/:id/download', validate([param('id').isUUID()]), fileController.downloadFile);

router.post(
  '/folder',
  validate([
    body('name').notEmpty().isLength({ max: 255 }),
    body('parentId').optional().isUUID(),
  ]),
  fileController.createFolder
);

router.patch(
  '/:id/rename',
  validate([
    param('id').isUUID(),
    body('name').notEmpty().isLength({ max: 255 }),
  ]),
  fileController.renameFile
);

router.delete('/:id', validate([param('id').isUUID()]), fileController.deleteFile);

router.post(
  '/:id/move',
  validate([
    param('id').isUUID(),
    body('targetParentId').isUUID(),
  ]),
  fileController.moveFile
);

router.post(
  '/:id/copy',
  validate([
    param('id').isUUID(),
    body('targetParentId').isUUID(),
  ]),
  fileController.copyFile
);

router.post('/:id/star', validate([param('id').isUUID()]), fileController.starFile);

router.get('/:id/size', validate([param('id').isUUID()]), fileController.getFolderSize);

// Tags
router.get('/:id/tags', validate([param('id').isUUID()]), fileController.getTags);

router.post(
  '/:id/tags',
  validate([
    param('id').isUUID(),
    body('tag').notEmpty().isLength({ max: 100 }),
  ]),
  fileController.addTag
);

router.delete(
  '/:id/tags/:tag',
  validate([param('id').isUUID(), param('tag').notEmpty()]),
  fileController.removeTag
);

export default router;
