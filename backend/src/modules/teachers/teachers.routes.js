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
    const teachers = await teachersService.listTeachers(req.query);
    return sendSuccess(res, teachers);
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

export default router;
