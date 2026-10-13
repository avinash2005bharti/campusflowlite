import importService from './import.service.js';
import { sendSuccess } from '../../utils/response.js';
import asyncHandler from '../../utils/asyncHandler.js';
import ApiError from '../../utils/ApiError.js';

export const getTemplate = asyncHandler(async (req, res) => {
  return importService.generateTemplate(req.params.type, res);
});

export const importStudents = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload an Excel (.xlsx) file');
  }
  const result = await importService.importStudents(req.file.buffer);
  return sendSuccess(res, result);
});

export const importTeachers = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload an Excel (.xlsx) file');
  }
  const result = await importService.importTeachers(req.file.buffer);
  return sendSuccess(res, result);
});

export default {
  getTemplate,
  importStudents,
  importTeachers,
};
