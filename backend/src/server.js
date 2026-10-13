import http from 'node:http';
import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import { initSocketServer } from './sockets/index.js';
import { initEscalationJob } from './jobs/escalation.job.js';

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize Socket.IO
  initSocketServer(httpServer);

  // Initialize Escalation Cron Job
  initEscalationJob();

  const PORT = env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 CampusFlow Lite Backend running on port ${PORT}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Base API: http://localhost:${PORT}/api/v1`);
    console.log(`📋 Health:   http://localhost:${PORT}/api/v1/health`);
    console.log(`==================================================\n`);
  });
};

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
