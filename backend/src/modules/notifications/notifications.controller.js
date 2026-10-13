import notificationsService from './notifications.service.js';
import { sendSuccess } from '../../utils/response.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationsService.getUserNotifications(req.user.id, req.query);
  return sendSuccess(res, result.notifications, result.meta);
});

export const markRead = asyncHandler(async (req, res) => {
  const notif = await notificationsService.markAsRead(req.params.id, req.user.id);
  return sendSuccess(res, notif);
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationsService.markAllAsRead(req.user.id);
  return sendSuccess(res, result);
});

export default {
  getNotifications,
  markRead,
  markAllRead,
};
