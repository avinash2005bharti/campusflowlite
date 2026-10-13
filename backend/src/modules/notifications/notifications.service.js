import Notification from '../../models/Notification.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import ApiError from '../../utils/ApiError.js';

export const getUserNotifications = async (userId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user: userId };

  if (query.unread === 'true' || query.unread === true) {
    filter.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  meta.unreadCount = unreadCount;

  return {
    notifications,
    meta,
  };
};

export const markAsRead = async (id, userId) => {
  const notification = await Notification.findOne({ _id: id, user: userId });
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return { modifiedCount: result.modifiedCount };
};

export default {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
