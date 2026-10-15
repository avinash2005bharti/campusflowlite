import User from '../../models/User.js';
import Student from '../../models/Student.js';
import Teacher from '../../models/Teacher.js';
import Section from '../../models/Section.js';
import Notification from '../../models/Notification.js';
import ApiError from '../../utils/ApiError.js';
import { sendTemporaryPasswordEmail } from '../../utils/sendEmail.js';
import { emitNotification } from '../../sockets/emitters.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

export const listUsers = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.role) {
    filter.role = query.role.toUpperCase();
  }
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return {
    users,
    meta: buildPaginationMeta(total, page, limit),
  };
};

export const createUser = async (data) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict(`User with email '${data.email}' already exists`);
  }

  const password = data.password || 'Welcome@123';
  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role: data.role,
    phone: data.phone,
    mustChangePassword: true,
    isActive: true,
  });

  return { user, tempPassword: password };
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  let profile = null;
  if (user.role === 'STUDENT') {
    profile = await Student.findOne({ user: user._id }).populate('department section mentorGroup');
  } else if (user.role === 'TEACHER' || user.role === 'HOD') {
    profile = await Teacher.findOne({ user: user._id }).populate('department');
  }

  return { user, profile };
};

export const updateUser = async (id, updates) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const allowedFields = ['name', 'phone', 'role', 'isActive'];
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      user[field] = updates[field];
    }
  });

  await user.save();
  return user;
};

export const resetPassword = async (id, customPassword = null) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const newPassword = customPassword || 'Reset@' + Math.floor(1000 + Math.random() * 9000);
  user.passwordHash = await User.hashPassword(newPassword);
  user.mustChangePassword = true;
  await user.save();

  // Send temporary password to student via email
  if (user.email) {
    try {
      await sendTemporaryPasswordEmail(user.email, newPassword, user.name);
    } catch (err) {
      console.error('[Send Temp Password Email Error]:', err.message);
    }
  }

  // Create in-app notification
  try {
    const notif = await Notification.create({
      user: user._id,
      title: 'Password Reset by Department',
      message: `Your account password was reset by administration. Your temporary password was emailed to ${user.email}.`,
      type: 'SYSTEM',
      link: '/student/profile',
    });
    emitNotification(user._id.toString(), notif);
  } catch (err) {
    // Ignore notification error if offline
  }

  return { message: 'Password reset successfully', tempPassword: newPassword };
};

export const updateStatus = async (id, isActive) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.isActive = Boolean(isActive);
  await user.save();
  return user;
};

export default {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  resetPassword,
  updateStatus,
};
