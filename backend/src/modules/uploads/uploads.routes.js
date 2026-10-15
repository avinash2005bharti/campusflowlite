import { Router } from 'express';
import multer from 'multer';
import uploadsController from './uploads.controller.js';
import auth from '../../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(auth);

router.post('/', upload.single('file'), uploadsController.uploadDirect);
router.post('/direct', upload.single('file'), uploadsController.uploadDirect);
router.get('/auth', uploadsController.getAuth);
router.post('/verify', uploadsController.verify);
router.get('/signed-url', uploadsController.getSignedUrl);
router.delete('/:fileId', uploadsController.deleteUpload);

export default router;

