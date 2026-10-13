import { Router } from 'express';
import usersController from './users.controller.js';
import auth from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';

const router = Router();

// All routes require ADMIN or HOD role (TG can also trigger password reset)
router.use(auth, authorize('ADMIN', 'HOD', 'TG'));

router.get('/', usersController.listUsers);
router.post('/', usersController.createUser);
router.get('/:id', usersController.getUserById);
router.patch('/:id', usersController.updateUser);
router.post('/:id/reset-password', usersController.resetPassword);
router.patch('/:id/status', usersController.updateStatus);

export default router;
