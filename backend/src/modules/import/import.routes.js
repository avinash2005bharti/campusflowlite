import { Router } from 'express';
import multer from 'multer';
import importController from './import.controller.js';
import auth from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = Router();

router.use(auth, authorize('ADMIN'));

router.get('/template/:type', importController.getTemplate);
router.post('/students', upload.single('file'), importController.importStudents);
router.post('/teachers', upload.single('file'), importController.importTeachers);

export default router;
