import { Router } from 'express';
import uploadsController from './uploads.controller.js';
import auth from '../../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/auth', uploadsController.getAuth);
router.post('/verify', uploadsController.verify);
router.get('/signed-url', uploadsController.getSignedUrl);
router.delete('/:fileId', uploadsController.deleteUpload);

export default router;
