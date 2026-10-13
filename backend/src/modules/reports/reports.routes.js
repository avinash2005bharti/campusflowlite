import { Router } from 'express';
import reportsController from './reports.controller.js';
import auth from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';

export const dashboardRouter = Router();
dashboardRouter.get('/summary', auth, reportsController.getDashboardSummary);

export const reportsRouter = Router();
reportsRouter.use(auth, authorize('HOD', 'ADMIN', 'TG'));
reportsRouter.get('/considerations/export', reportsController.exportConsiderations);
reportsRouter.get('/leaves/export', reportsController.exportLeaves);
reportsRouter.get('/considerations', reportsController.getConsiderationsReport);
reportsRouter.get('/leaves', reportsController.getLeavesReport);

export default {
  dashboardRouter,
  reportsRouter,
};
