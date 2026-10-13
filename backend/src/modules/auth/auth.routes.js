import { Router } from 'express';
import authController from './auth.controller.js';
import { loginSchema, changePasswordSchema } from './auth.schema.js';
import { validateBody } from '../../middleware/validate.js';
import auth from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';

const router = Router();

router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/register/student', authLimiter, authController.registerStudent);
router.post('/register/teacher', authLimiter, authController.registerTeacher);
router.post('/register-student', authLimiter, authController.registerStudent);
router.post('/register-teacher', authLimiter, authController.registerTeacher);
router.post('/refresh', authController.refresh);
router.post('/logout', auth, authController.logout);
router.post('/change-password', auth, validateBody(changePasswordSchema), authController.changePassword);
router.get('/me', auth, authController.getMe);

export default router;
