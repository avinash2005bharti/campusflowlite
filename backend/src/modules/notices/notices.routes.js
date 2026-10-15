import { Router } from 'express';
import noticesController from './notices.controller.js';
import auth from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';

const router = Router();

router.use(auth);

// All authenticated users can view notices
router.get('/', noticesController.getNotices);

// HOD and ADMIN can send notices (and faculty if needed)
router.post(
  '/',
  authorize('HOD', 'ADMIN', 'TEACHER'),
  noticesController.createNotice
);

// HOD, ADMIN, or Notice Author can delete notice
router.delete(
  '/:id',
  authorize('HOD', 'ADMIN', 'TEACHER'),
  noticesController.deleteNotice
);

export default router;
