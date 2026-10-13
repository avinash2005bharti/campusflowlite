import { Router } from 'express';
import mentorshipService from './mentorship.service.js';
import auth from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const router = Router();

router.use(auth);

// TG views their own cohort
router.get(
  '/mine',
  authorize('TG'),
  asyncHandler(async (req, res) => {
    const cohort = await mentorshipService.getMyCohort(req.user.teacherId);
    return sendSuccess(res, cohort);
  })
);

// HOD and Admin management
router.get(
  '/',
  authorize('HOD', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const groups = await mentorshipService.listMentorGroups(req.query);
    return sendSuccess(res, groups);
  })
);

router.post(
  '/',
  authorize('HOD', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const group = await mentorshipService.createMentorGroup(req.body);
    return sendCreated(res, group);
  })
);

router.put(
  '/:id/students',
  authorize('HOD', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const updated = await mentorshipService.updateMentorGroupStudents(req.params.id, req.body);
    return sendSuccess(res, updated);
  })
);

export default router;
