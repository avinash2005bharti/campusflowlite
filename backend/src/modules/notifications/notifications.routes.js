import { Router } from 'express';
import notificationsController from './notifications.controller.js';
import auth from '../../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', notificationsController.getNotifications);
router.patch('/read-all', notificationsController.markAllRead);
router.patch('/:id/read', notificationsController.markRead);

export default router;
