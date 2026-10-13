import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';
import User from '../../models/User.js';
import Student from '../../models/Student.js';
import Teacher from '../../models/Teacher.js';
import MentorGroup from '../../models/MentorGroup.js';
import RefreshToken from '../../models/RefreshToken.js';
import Department from '../../models/Department.js';
import Section from '../../models/Section.js';

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateAccessToken = (user, extraClaims = {}) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      ...extraClaims,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL }
  );
};

const createRefreshTokenRecord = async (userId, userAgent = null, ip = null) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user: userId,
    tokenHash,
    expiresAt,
    userAgent,
    ip,
  });

  return rawToken;
};

export const login = async ({ email, password, userAgent, ip }) => {
  const user = await User.findOne({ email, isActive: true }).select('+passwordHash');
  if (!user) {
    throw ApiError.badRequest('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.badRequest('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  // Resolve TG & Profile details
  let isTG = false;
  let mentorGroupId = null;
  let profile = null;

  if (user.role === 'TEACHER' || user.role === 'HOD') {
    const teacher = await Teacher.findOne({ user: user._id }).populate('department');
    if (teacher) {
      profile = teacher;
      const group = await MentorGroup.findOne({ tg: teacher._id, isActive: true });
      if (group) {
        isTG = true;
        mentorGroupId = group._id.toString();
      }
    }
  } else if (user.role === 'STUDENT') {
    const student = await Student.findOne({ user: user._id })
      .populate('department')
      .populate('section')
      .populate({
        path: 'mentorGroup',
        populate: { path: 'tg', populate: { path: 'user', select: 'name email phone' } },
      });
    profile = student;
    if (student?.mentorGroup) {
      mentorGroupId = student.mentorGroup._id.toString();
    }
  }

  const accessToken = generateAccessToken(user, {
    isTG,
    teacherId: user.role === 'TEACHER' || user.role === 'HOD' ? profile?._id?.toString() : undefined,
  });
  const refreshToken = await createRefreshTokenRecord(user._id, userAgent, ip);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      isTG,
      mentorGroupId,
      profile,
    },
    accessToken,
    refreshToken,
  };
};

export const rotateRefreshToken = async (rawRefreshToken, userAgent, ip) => {
  if (!rawRefreshToken) {
    throw ApiError.unauthenticated('Refresh token required');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc) {
    throw ApiError.unauthenticated('Invalid refresh token');
  }

  // Token reuse detection: if token is already revoked, suspect token theft! Revoke all tokens for this user.
  if (tokenDoc.revokedAt) {
    await RefreshToken.updateMany({ user: tokenDoc.user }, { revokedAt: new Date() });
    throw ApiError.forbidden('Refresh token reuse detected. Please log in again.');
  }

  if (tokenDoc.expiresAt < new Date()) {
    throw ApiError.unauthenticated('Refresh token expired');
  }

  // Revoke current token
  tokenDoc.revokedAt = new Date();
  await tokenDoc.save();

  // Find user
  const user = await User.findById(tokenDoc.user);
  if (!user || !user.isActive) {
    throw ApiError.unauthenticated('User not found or inactive');
  }

  // Determine TG status
  let isTG = false;
  let teacherId = null;
  if (user.role === 'TEACHER' || user.role === 'HOD') {
    const teacher = await Teacher.findOne({ user: user._id });
    if (teacher) {
      teacherId = teacher._id.toString();
      const group = await MentorGroup.findOne({ tg: teacher._id, isActive: true });
      if (group) isTG = true;
    }
  }

  const newAccessToken = generateAccessToken(user, { isTG, teacherId });
  const newRefreshToken = await createRefreshTokenRecord(user._id, userAgent, ip);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (rawRefreshToken) => {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshToken.updateOne({ tokenHash }, { revokedAt: new Date() });
  }
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password does not match');
  }

  user.passwordHash = await User.hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();

  // Revoke other refresh tokens on password change
  await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
};

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw ApiError.unauthenticated('User not found');
  }

  let profile = null;
  let isTG = false;
  let mentorGroupId = null;

  if (user.role === 'TEACHER' || user.role === 'HOD') {
    const teacher = await Teacher.findOne({ user: user._id }).populate('department');
    if (teacher) {
      profile = teacher;
      const group = await MentorGroup.findOne({ tg: teacher._id, isActive: true }).populate('department');
      if (group) {
        isTG = true;
        mentorGroupId = group._id.toString();
      }
    }
  } else if (user.role === 'STUDENT') {
    const student = await Student.findOne({ user: user._id })
      .populate('department')
      .populate('section')
      .populate({
        path: 'mentorGroup',
        populate: { path: 'tg', populate: { path: 'user', select: 'name email phone' } },
      });
    profile = student;
    if (student?.mentorGroup) {
      mentorGroupId = student.mentorGroup._id.toString();
    }
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    phone: user.phone,
    profileImage: user.profileImage,
    isTG,
    mentorGroupId,
    profile,
  };
};

export const registerStudent = async ({
  name,
  email,
  password,
  rollNumber,
  enrollment_no,
  year,
  semester,
  section,
  batch,
  phone,
  enrollmentYear,
}) => {
  const normEmail = (email || '').toLowerCase().trim();
  if (!normEmail) {
    throw ApiError.badRequest('Valid email address is required');
  }

  const existingUser = await User.findOne({ email: normEmail });
  if (existingUser) {
    throw ApiError.conflict(`User with email '${normEmail}' already exists`);
  }

  const roll = (rollNumber || enrollment_no || '').trim().toUpperCase();
  if (!roll) {
    throw ApiError.badRequest('Roll Number / Enrollment Number is required');
  }

  const existingStudent = await Student.findOne({ rollNumber: roll });
  if (existingStudent) {
    throw ApiError.conflict(`Student with Roll Number '${roll}' already exists`);
  }

  // Resolve Department (default to CSE)
  let dept = await Department.findOne({ code: 'CSE' });
  if (!dept) {
    dept = await Department.findOne();
    if (!dept) {
      dept = await Department.create({ name: 'Computer Science & Engineering', code: 'CSE' });
    }
  }

  // Resolve Section (find by code or name or create)
  const secName = (section || 'A').toUpperCase();
  let sec = await Section.findOne({
    department: dept._id,
    $or: [{ name: `Section ${secName}` }, { code: `CSE-${secName}` }, { name: secName }],
  });

  if (!sec) {
    sec = await Section.create({
      department: dept._id,
      year: year ? parseInt(year) || 3 : 3,
      semester: semester ? parseInt(semester) || 5 : 5,
      name: `Section ${secName}`,
      code: `CSE-${secName}`,
    });
  }

  const passwordHash = await User.hashPassword(password || 'Password@123');
  const user = await User.create({
    name: (name || 'Student').trim(),
    email: normEmail,
    passwordHash,
    role: 'STUDENT',
    phone: phone ? phone.trim() : null,
    isActive: true,
    mustChangePassword: false,
  });

  const parsedEnrollYear = enrollmentYear
    ? parseInt(enrollmentYear)
    : batch && batch.includes('-')
    ? parseInt(batch.split('-')[0]) || 2022
    : new Date().getFullYear() - 2;

  const student = await Student.create({
    user: user._id,
    department: dept._id,
    section: sec._id,
    rollNumber: roll,
    enrollmentYear: parsedEnrollYear,
  });

  return {
    message: 'Student account registered successfully! You can now sign in.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    student: {
      id: student._id,
      rollNumber: student.rollNumber,
    },
  };
};

export const registerTeacher = async ({
  name,
  email,
  password,
  employeeId,
  designation,
  specialization,
  phone,
}) => {
  const normEmail = (email || '').toLowerCase().trim();
  if (!normEmail) {
    throw ApiError.badRequest('Valid email address is required');
  }

  const existingUser = await User.findOne({ email: normEmail });
  if (existingUser) {
    throw ApiError.conflict(`User with email '${normEmail}' already exists`);
  }

  const empId = (employeeId || `EMP_${Date.now().toString().slice(-6)}`).trim().toUpperCase();
  const existingTeacher = await Teacher.findOne({ employeeId: empId });
  if (existingTeacher) {
    throw ApiError.conflict(`Teacher with Employee ID '${empId}' already exists`);
  }

  let dept = await Department.findOne({ code: 'CSE' });
  if (!dept) {
    dept = await Department.findOne();
    if (!dept) {
      dept = await Department.create({ name: 'Computer Science & Engineering', code: 'CSE' });
    }
  }

  const passwordHash = await User.hashPassword(password || 'Password@123');
  const user = await User.create({
    name: (name || 'Faculty Member').trim(),
    email: normEmail,
    passwordHash,
    role: 'TEACHER',
    phone: phone ? phone.trim() : null,
    isActive: true,
    mustChangePassword: false,
  });

  const teacher = await Teacher.create({
    user: user._id,
    department: dept._id,
    employeeId: empId,
    designation: designation || 'Assistant Professor',
  });

  return {
    message: 'Faculty account registered successfully! You can now sign in.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    teacher: {
      id: teacher._id,
      employeeId: teacher.employeeId,
    },
  };
};

export default {
  login,
  rotateRefreshToken,
  logout,
  changePassword,
  getMe,
  registerStudent,
  registerTeacher,
};
