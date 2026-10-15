import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import corsOptions from './config/cors.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Ensure all models are registered
import './models/index.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import sectionsRoutes from './modules/users/sections.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import teachersRoutes from './modules/teachers/teachers.routes.js';
import mentorshipRoutes from './modules/mentorship/mentorship.routes.js';
import considerationsRoutes from './modules/considerations/considerations.routes.js';
import leavesRoutes from './modules/leaves/leaves.routes.js';
import uploadsRoutes from './modules/uploads/uploads.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import noticesRoutes from './modules/notices/notices.routes.js';
import { dashboardRouter, reportsRouter } from './modules/reports/reports.routes.js';
import importRoutes from './modules/import/import.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(generalLimiter);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint (Phase 1 Acceptance: GET /api/v1/health returns 200)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CampusFlow Lite API',
    version: '1.0.0',
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CampusFlow Lite API',
    version: '1.0.0',
    documentation: '/api/v1',
  });
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/sections', sectionsRoutes);
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/teachers', teachersRoutes);
app.use('/api/v1/mentor-groups', mentorshipRoutes);
app.use('/api/v1/considerations', considerationsRoutes);
app.use('/api/v1/leaves', leavesRoutes);
app.use('/api/v1/uploads', uploadsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/notices', noticesRoutes);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/audit', auditRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
