import { Router } from 'express';
import auditService from './audit.service.js';
import auth from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

router.use(auth, authorize('HOD', 'ADMIN'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await auditService.getAuditLogs(req.query);
    return sendSuccess(res, result.logs, result.meta);
  })
);

export default router;
