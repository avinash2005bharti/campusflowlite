import { Router } from 'express';
import Section from '../../models/Section.js';
import Department from '../../models/Department.js';
import auth from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import ApiError from '../../utils/ApiError.js';

const router = Router();

router.use(auth, authorize('HOD', 'ADMIN'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.department) {
      filter.department = req.query.department;
    }
    const sections = await Section.find(filter).populate('department').sort({ code: 1 });
    return sendSuccess(res, sections);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { department, year, semester, name, code } = req.body;
    if (!department || !year || !semester || !name || !code) {
      throw ApiError.badRequest('Missing required section fields: department, year, semester, name, code');
    }

    const deptDoc = await Department.findById(department);
    if (!deptDoc) {
      throw ApiError.notFound('Department not found');
    }

    const existing = await Section.findOne({ code: code.toUpperCase() });
    if (existing) {
      throw ApiError.conflict(`Section with code '${code}' already exists`);
    }

    const section = await Section.create({
      department,
      year,
      semester,
      name,
      code: code.toUpperCase(),
    });

    return sendCreated(res, section);
  })
);

export default router;
