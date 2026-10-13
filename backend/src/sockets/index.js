import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import corsOptions from '../config/cors.js';

let ioInstance = null;

export const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: corsOptions,
    pingTimeout: 30000,
  });

  // JWT handshake authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.user = decoded; // { id, role, isTG, teacherId, ... }
      next();
    } catch (err) {
      return next(new Error('Invalid or expired socket token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (!user) return;

    // Join user-specific room
    socket.join(`user_${user.id}`);

    // Join role room
    if (user.role) {
      socket.join(`role_${user.role}`);
    }

    // Join TG room if user is a mentor/TG
    if (user.isTG && user.teacherId) {
      socket.join(`tg_${user.teacherId}`);
    }

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => {
  return ioInstance;
};

export default {
  initSocketServer,
  getIO,
};
