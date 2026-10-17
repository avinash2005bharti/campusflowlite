import { Router } from 'express';
import teachersService from './teachers.service.js';
import auth from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

router.get(
  '/',
  auth,
  authorize('HOD', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await teachersService.listTeachers(req.query);
    if (result && result.teachers) {
      return sendSuccess(res, result.teachers, result.meta);
    }
    return sendSuccess(res, result);
  })
);

router.patch(
  '/:id',
  auth,
  authorize('HOD', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const teacher = await teachersService.updateTeacher(req.params.id, req.body);
    return sendSuccess(res, teacher, 'Faculty updated successfully');
  })
);

router.delete(
  '/:id',
  auth,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await teachersService.deleteTeacher(req.params.id);
    return sendSuccess(res, result);
  })
);

export default router;
