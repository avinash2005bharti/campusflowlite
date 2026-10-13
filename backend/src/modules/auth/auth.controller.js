import authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import asyncHandler from '../../utils/asyncHandler.js';
import env from '../../config/env.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  path: '/',
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;

  const result = await authService.login({ email, password, userAgent, ip });

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(res, {
    user: result.user,
    accessToken: result.accessToken,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;

  const result = await authService.rotateRefreshToken(rawRefreshToken, userAgent, ip);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(res, {
    accessToken: result.accessToken,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  await authService.logout(rawRefreshToken);
  res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });

  return sendSuccess(res, { message: 'Logged out successfully' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.user.id, currentPassword, newPassword);

  return sendSuccess(res, { message: 'Password changed successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  const me = await authService.getMe(req.user.id);
  return sendSuccess(res, me);
});

export const registerStudent = asyncHandler(async (req, res) => {
  const result = await authService.registerStudent(req.body);
  return sendSuccess(res, result, 201);
});

export const registerTeacher = asyncHandler(async (req, res) => {
  const result = await authService.registerTeacher(req.body);
  return sendSuccess(res, result, 201);
});

export default {
  login,
  refresh,
  logout,
  changePassword,
  getMe,
  registerStudent,
  registerTeacher,
};
