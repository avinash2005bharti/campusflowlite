import { Router } from 'express';
import usersController from './users.controller.js';
import auth from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';

const router = Router();

// All routes require authentication
router.use(auth);

// ADMIN and HOD have full user management access
router.get('/', authorize('ADMIN', 'HOD'), usersController.listUsers);
router.post('/', authorize('ADMIN', 'HOD'), usersController.createUser);
router.get('/:id', authorize('ADMIN', 'HOD', 'TG'), usersController.getUserById);
router.patch('/:id', authorize('ADMIN', 'HOD'), usersController.updateUser);
// TG can reset passwords for their mentees, ADMIN/HOD for any user
router.post('/:id/reset-password', authorize('ADMIN', 'HOD', 'TG'), usersController.resetPassword);
router.patch('/:id/status', authorize('ADMIN', 'HOD'), usersController.updateStatus);

export default router;
