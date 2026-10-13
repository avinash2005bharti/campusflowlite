import { getIO } from './index.js';

export const emitToUser = (userId, event, payload) => {
  const io = getIO();
  if (io) {
    io.to(`user_${userId}`).emit(event, payload);
  }
};

export const emitToRole = (role, event, payload) => {
  const io = getIO();
  if (io) {
    io.to(`role_${role}`).emit(event, payload);
  }
};

export const emitToTG = (teacherId, event, payload) => {
  const io = getIO();
  if (io) {
    io.to(`tg_${teacherId}`).emit(event, payload);
  }
};

export const emitNotification = (userId, notification) => {
  emitToUser(userId, 'new_notification', {
    id: notification._id || notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    link: notification.link,
    createdAt: notification.createdAt || new Date(),
  });
};

export const emitRequestUpdated = (rooms, payload) => {
  const io = getIO();
  if (!io) return;

  // rooms is an array of room names like ['user_123', 'role_HOD', 'tg_456']
  rooms.forEach((room) => {
    io.to(room).emit('request_updated', payload);
  });
};

export const emitQueueChanged = (scope, kind) => {
  const io = getIO();
  if (!io) return;

  if (scope === 'HOD') {
    io.to('role_HOD').to('role_ADMIN').emit('queue_changed', { kind, scope: 'HOD' });
  } else if (scope === 'TG') {
    io.emit('queue_changed', { kind, scope: 'TG' });
  }
};

export default {
  emitToUser,
  emitToRole,
  emitToTG,
  emitNotification,
  emitRequestUpdated,
  emitQueueChanged,
};
