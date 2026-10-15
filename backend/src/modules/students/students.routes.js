import { Router } from 'express';
import studentsService from './students.service.js';
import auth from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

// HOD, Admin, TG, and Students can list and view students
router.get(
  '/',
  auth,
  authorize('HOD', 'ADMIN', 'TG', 'STUDENT'),
  asyncHandler(async (req, res) => {
    const result = await studentsService.listStudents(req.query);
    return sendSuccess(res, result.students, result.meta);
  })
);

router.get(
  '/:id',
  auth,
  authorize('HOD', 'ADMIN', 'TG'),
  asyncHandler(async (req, res) => {
    const student = await studentsService.getStudentById(req.params.id);
    return sendSuccess(res, student);
  })
);

router.patch(
  '/:id',
  auth,
  authorize('HOD', 'ADMIN', 'TG'),
  asyncHandler(async (req, res) => {
    const student = await studentsService.updateStudent(req.params.id, req.body);
    return sendSuccess(res, student);
  })
);

router.delete(
  '/:id',
  auth,
  authorize('HOD', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await studentsService.deleteStudent(req.params.id);
    return sendSuccess(res, result);
  })
);

export default router;
