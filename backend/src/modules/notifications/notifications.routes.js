import { Router } from 'express';
import notificationsController from './notifications.controller.js';
import auth from '../../middleware/auth.js';

const router = Router();

// Public or authenticated helper endpoints
router.get('/consideration-window', notificationsController.getConsiderationWindow);
router.get('/vapid-public-key', notificationsController.getVapidPublicKey);

router.use(auth);

// Authenticated notification routes
router.get('/', notificationsController.getNotifications);
router.patch('/read-all', notificationsController.markAllRead);
router.patch('/:id/read', notificationsController.markRead);

// Web Push subscription endpoints
router.post('/push-subscribe', notificationsController.subscribePush);
router.post('/push-unsubscribe', notificationsController.unsubscribePush);

// Manual trigger for attendance reminder (testing/admin)
router.post('/send-reminder-now', notificationsController.sendReminderNow);

export default router;

