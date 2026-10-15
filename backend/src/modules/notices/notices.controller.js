import noticesService from './notices.service.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';

export const createNotice = asyncHandler(async (req, res) => {
  const notice = await noticesService.createNotice(req.body, req.user);
  return sendSuccess(res, notice, null, 201);
});

export const getNotices = asyncHandler(async (req, res) => {
  const notices = await noticesService.getNotices(req.query, req.user);
  return sendSuccess(res, notices);
});

export const deleteNotice = asyncHandler(async (req, res) => {
  const result = await noticesService.deleteNotice(req.params.id, req.user);
  return sendSuccess(res, result);
});

export default {
  createNotice,
  getNotices,
  deleteNotice,
};
