import cron from 'node-cron';
import env from '../config/env.js';

let cronTask = null;

/**
 * Runs the escalation scan logic.
 * Finds PENDING consideration requests and student leaves older than ESCALATION_HOURS
 * or where the TG is currently on approved leave.
 * @param {Date|null} mockClock - Optional clock override for testing
 */
export const runEscalationScan = async (mockClock = null) => {
  try {
    // Dynamic import to avoid circular dependency before models are loaded
    const { default: ConsiderationRequest } = await import('../models/ConsiderationRequest.js');
    const { default: LeaveApplication } = await import('../models/LeaveApplication.js');
    const { default: User } = await import('../models/User.js');
    const { default: Notification } = await import('../models/Notification.js');
    const { default: AuditLog } = await import('../models/AuditLog.js');
    const { emitNotification, emitQueueChanged } = await import('../sockets/emitters.js');
    const { getTodayIST } = await import('../utils/dates.js');

    const now = mockClock || new Date();
    const escalationHours = env.ESCALATION_HOURS || 48;
    const thresholdTime = new Date(now.getTime() - escalationHours * 60 * 60 * 1000);
    const todayIST = getTodayIST();

    // 1. Find all active faculty leaves approved for today
    const activeFacultyLeaves = await LeaveApplication.find({
      applicantRole: 'TEACHER',
      status: 'APPROVED',
      startDate: { $lte: todayIST },
      endDate: { $gte: todayIST },
    }).select('teacher');

    const absentTeacherIds = activeFacultyLeaves.map((l) => l.teacher.toString());

    // 2. Scan Consideration Requests
    const pendingConsiderations = await ConsiderationRequest.find({
      status: 'PENDING',
      escalated: false,
      $or: [
        { createdAt: { $lte: thresholdTime } },
        { tg: { $in: absentTeacherIds } },
      ],
    }).populate('student tg');

    for (const req of pendingConsiderations) {
      req.escalated = true;
      req.escalatedAt = now;
      req.history.push({
        status: 'PENDING',
        actor: null,
        actorRole: 'SYSTEM',
        remarks: 'Escalated to HOD due to 48-hour TG inactivity or TG leave',
        at: now,
        via: 'ESCALATION',
      });
      await req.save();

      // Find HOD users to notify
      const hodUsers = await User.find({ role: { $in: ['HOD', 'ADMIN'] }, isActive: true });
      for (const hod of hodUsers) {
        const notif = await Notification.create({
          user: hod._id,
          title: 'Consideration Request Escalated',
          message: `Request for "${req.eventTitle}" was escalated to your queue.`,
          type: 'ESCALATION',
          link: `/hod/considerations/${req._id}`,
          isRead: false,
        });
        emitNotification(hod._id.toString(), notif);
      }

      await AuditLog.create({
        actor: null,
        action: 'ESCALATE_CONSIDERATION',
        entityType: 'ConsiderationRequest',
        entityId: req._id,
        after: { escalated: true, escalatedAt: now },
      });
    }

    // 3. Scan Student Leaves
    const pendingLeaves = await LeaveApplication.find({
      applicantRole: 'STUDENT',
      status: 'PENDING',
      escalated: false,
      $or: [
        { createdAt: { $lte: thresholdTime } },
        { tg: { $in: absentTeacherIds } },
      ],
    }).populate('student tg');

    for (const leave of pendingLeaves) {
      leave.escalated = true;
      leave.escalatedAt = now;
      leave.history.push({
        status: 'PENDING',
        actor: null,
        actorRole: 'SYSTEM',
        remarks: 'Escalated to HOD due to 48-hour TG inactivity or TG leave',
        at: now,
        via: 'ESCALATION',
      });
      await leave.save();

      const hodUsers = await User.find({ role: { $in: ['HOD', 'ADMIN'] }, isActive: true });
      for (const hod of hodUsers) {
        const notif = await Notification.create({
          user: hod._id,
          title: 'Leave Application Escalated',
          message: `Student leave application was escalated to your queue.`,
          type: 'ESCALATION',
          link: `/hod/leaves/${leave._id}`,
          isRead: false,
        });
        emitNotification(hod._id.toString(), notif);
      }

      await AuditLog.create({
        actor: null,
        action: 'ESCALATE_LEAVE',
        entityType: 'LeaveApplication',
        entityId: leave._id,
        after: { escalated: true, escalatedAt: now },
      });
    }

    if (pendingConsiderations.length > 0 || pendingLeaves.length > 0) {
      emitQueueChanged('HOD', 'ESCALATION');
      console.log(`[EscalationJob] Escalated ${pendingConsiderations.length} considerations and ${pendingLeaves.length} leaves.`);
    }
  } catch (error) {
    console.error('[EscalationJob] Error running escalation scan:', error.message);
  }
};

export const initEscalationJob = () => {
  // Run once every hour at minute 0
  cronTask = cron.schedule('0 * * * *', () => {
    runEscalationScan();
  });
  console.log('⏰ Escalation cron job scheduled (hourly)');
  return cronTask;
};

export default {
  initEscalationJob,
  runEscalationScan,
};
