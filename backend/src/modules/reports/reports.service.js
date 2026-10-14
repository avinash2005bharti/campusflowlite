import ExcelJS from 'exceljs';
import ConsiderationRequest from '../../models/ConsiderationRequest.js';
import LeaveApplication from '../../models/LeaveApplication.js';
import Student from '../../models/Student.js';
import Teacher from '../../models/Teacher.js';
import MentorGroup from '../../models/MentorGroup.js';
import User from '../../models/User.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { getTodayIST } from '../../utils/dates.js';

export const getDashboardSummary = async (user) => {
  const role = user.role;
  const todayIST = getTodayIST();

  if (role === 'STUDENT') {
    const student = await Student.findOne({ user: user.id });
    const studentId = student?._id;

    const [
      totalConsiderations,
      pendingConsiderations,
      approvedConsiderations,
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
    ] = await Promise.all([
      ConsiderationRequest.countDocuments({ student: studentId }),
      ConsiderationRequest.countDocuments({ student: studentId, status: 'PENDING' }),
      ConsiderationRequest.countDocuments({ student: studentId, status: 'APPROVED_BY_HOD' }),
      LeaveApplication.countDocuments({ applicant: user._id }),
      LeaveApplication.countDocuments({ applicant: user._id, status: 'PENDING' }),
      LeaveApplication.countDocuments({ applicant: user._id, status: { $in: ['APPROVED_BY_HOD', 'APPROVED'] } }),
    ]);

    return {
      role: 'STUDENT',
      considerations: {
        total: totalConsiderations,
        pending: pendingConsiderations,
        approved: approvedConsiderations,
      },
      leaves: {
        total: totalLeaves,
        pending: pendingLeaves,
        approved: approvedLeaves,
      },
    };
  }

  if (user.isTG) {
    const teacherId = user.teacherId;
    const [
      pendingConsiderations,
      pendingLeaves,
      mentorGroup,
    ] = await Promise.all([
      ConsiderationRequest.countDocuments({ tg: teacherId, status: 'PENDING' }),
      LeaveApplication.countDocuments({ tg: teacherId, status: 'PENDING', applicantRole: 'STUDENT' }),
      MentorGroup.findOne({ tg: teacherId, isActive: true }),
    ]);

    return {
      role: 'TG',
      pendingConsiderations,
      pendingLeaves,
      totalMentees: mentorGroup?.students?.length || 0,
    };
  }

  if (role === 'HOD' || role === 'ADMIN') {
    const [
      pendingConsiderations,
      escalatedConsiderations,
      pendingStudentLeaves,
      escalatedLeaves,
      pendingFacultyLeaves,
      pendingHodLeaves,
      onLeaveTodayCount,
    ] = await Promise.all([
      ConsiderationRequest.countDocuments({ status: 'RECOMMENDED_BY_TG' }),
      ConsiderationRequest.countDocuments({ status: 'PENDING', escalated: true }),
      LeaveApplication.countDocuments({ applicantRole: 'STUDENT', status: 'RECOMMENDED_BY_TG' }),
      LeaveApplication.countDocuments({ applicantRole: 'STUDENT', status: 'PENDING', escalated: true }),
      LeaveApplication.countDocuments({ applicantRole: 'TEACHER', status: 'PENDING' }),
      LeaveApplication.countDocuments({ applicantRole: 'HOD', status: 'PENDING' }),
      LeaveApplication.countDocuments({
        applicantRole: 'TEACHER',
        status: 'APPROVED',
        startDate: { $lte: todayIST },
        endDate: { $gte: todayIST },
      }),
    ]);

    return {
      role,
      considerationsQueue: pendingConsiderations + escalatedConsiderations,
      escalatedConsiderations,
      studentLeavesQueue: pendingStudentLeaves + escalatedLeaves,
      escalatedLeaves,
      facultyLeavesQueue: pendingFacultyLeaves,
      hodLeavesQueue: pendingHodLeaves,
      facultyOnLeaveToday: onLeaveTodayCount,
    };
  }

  // Teacher fallback
  const [myLeavesTotal, myLeavesPending] = await Promise.all([
    LeaveApplication.countDocuments({ applicant: user._id }),
    LeaveApplication.countDocuments({ applicant: user._id, status: 'PENDING' }),
  ]);

  return {
    role: 'TEACHER',
    leaves: {
      total: myLeavesTotal,
      pending: myLeavesPending,
    },
  };
};

const formatStatus = (status) => {
  const map = {
    PENDING: 'Pending',
    RECOMMENDED_BY_TG: 'Recommended by TG',
    APPROVED_BY_HOD: 'Approved by HOD',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    REJECTED_BY_HOD: 'Rejected by HOD',
    REJECTED_BY_TG: 'Rejected by TG',
    CANCELLED: 'Cancelled',
  };
  return map[status] || status || 'Pending';
};

export const getConsiderationsReport = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.status) filter.status = query.status.toUpperCase();
  if (query.type && query.type !== 'ALL') filter.eventType = query.type.toUpperCase();
  if (query.from && query.to) {
    filter.startDate = { $gte: query.from, $lte: query.to };
  } else if (query.from) {
    filter.startDate = { $gte: query.from };
  } else if (query.to) {
    filter.startDate = { $lte: query.to };
  }

  const [requests, total] = await Promise.all([
    ConsiderationRequest.find(filter)
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'section', select: 'name code year semester' },
          { path: 'department', select: 'name code' },
        ],
      })
      .populate({ path: 'tg', populate: { path: 'user', select: 'name email phone' } })
      .populate('hodReview.reviewedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    ConsiderationRequest.countDocuments(filter),
  ]);

  return {
    requests,
    meta: buildPaginationMeta(total, page, limit),
  };
};

export const getLeavesReport = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.status) filter.status = query.status.toUpperCase();
  if (query.role) filter.applicantRole = query.role.toUpperCase();
  if (query.type && query.type !== 'ALL') filter.leaveType = query.type.toUpperCase();
  if (query.from && query.to) {
    filter.startDate = { $gte: query.from, $lte: query.to };
  } else if (query.from) {
    filter.startDate = { $gte: query.from };
  } else if (query.to) {
    filter.startDate = { $lte: query.to };
  }

  const [leaves, total] = await Promise.all([
    LeaveApplication.find(filter)
      .populate('applicant', 'name email role phone')
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'section', select: 'name code year semester' },
          { path: 'department', select: 'name code' },
        ],
      })
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name email phone' } })
      .populate({ path: 'tg', populate: { path: 'user', select: 'name email phone' } })
      .populate('finalReview.reviewedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    LeaveApplication.countDocuments(filter),
  ]);

  return {
    leaves,
    meta: buildPaginationMeta(total, page, limit),
  };
};

export const exportConsiderationsToExcel = async (query, res) => {
  const filter = {};
  if (query.status) filter.status = query.status.toUpperCase();
  if (query.type && query.type !== 'ALL') filter.eventType = query.type.toUpperCase();
  if (query.from && query.to) {
    filter.startDate = { $gte: query.from, $lte: query.to };
  } else if (query.from) {
    filter.startDate = { $gte: query.from };
  } else if (query.to) {
    filter.startDate = { $lte: query.to };
  }

  const requests = await ConsiderationRequest.find(filter)
    .populate({
      path: 'student',
      populate: [
        { path: 'user', select: 'name email phone' },
        { path: 'section', select: 'name code year semester' },
      ],
    })
    .populate({ path: 'tg', populate: { path: 'user', select: 'name email' } })
    .populate('hodReview.reviewedBy', 'name email')
    .sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Considerations');

  worksheet.columns = [
    { header: 'Student Name', key: 'studentName', width: 22 },
    { header: 'Roll Number', key: 'rollNumber', width: 16 },
    { header: 'Section', key: 'section', width: 12 },
    { header: 'Event Title', key: 'eventTitle', width: 28 },
    { header: 'Request Type', key: 'eventType', width: 16 },
    { header: 'Start Date', key: 'startDate', width: 14 },
    { header: 'End Date', key: 'endDate', width: 14 },
    { header: 'Requested Periods', key: 'requestedPeriods', width: 18 },
    { header: 'Approved Periods', key: 'approvedPeriods', width: 18 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Reason / Description', key: 'reason', width: 32 },
    { header: 'Tutor Guardian (TG)', key: 'tgName', width: 20 },
    { header: 'Final Approver', key: 'finalReviewer', width: 20 },
    { header: 'Decision Date', key: 'decisionDate', width: 16 },
  ];

  // Header styling
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E7FF' },
  };

  requests.forEach((req) => {
    worksheet.addRow({
      studentName: req.student?.user?.name || req.student?.rollNumber || 'Student',
      rollNumber: req.student?.rollNumber || 'Not provided',
      section: req.student?.section?.code || req.student?.section?.name || 'Not provided',
      eventTitle: req.eventTitle,
      eventType: req.eventType,
      startDate: req.startDate,
      endDate: req.endDate,
      requestedPeriods: req.requestedPeriods,
      approvedPeriods: req.hodReview?.approvedPeriods || req.approvedPeriods || 0,
      status: formatStatus(req.status),
      reason: req.description || req.reason || 'Not provided',
      tgName: req.tg?.user?.name || req.tg?.designation || 'Not assigned',
      finalReviewer: req.hodReview?.reviewedBy?.name || 'HOD Office',
      decisionDate: req.hodReview?.reviewedAt ? req.hodReview.reviewedAt.toISOString().slice(0, 10) : 'Pending',
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="considerations-report-${Date.now()}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
};

export const exportLeavesToExcel = async (query, res) => {
  const filter = {};
  if (query.status) filter.status = query.status.toUpperCase();
  if (query.role) filter.applicantRole = query.role.toUpperCase();
  if (query.type && query.type !== 'ALL') filter.leaveType = query.type.toUpperCase();
  if (query.from && query.to) {
    filter.startDate = { $gte: query.from, $lte: query.to };
  } else if (query.from) {
    filter.startDate = { $gte: query.from };
  } else if (query.to) {
    filter.startDate = { $lte: query.to };
  }

  const leaves = await LeaveApplication.find(filter)
    .populate('applicant', 'name email role phone')
    .populate({
      path: 'student',
      populate: [{ path: 'section', select: 'name code year semester' }],
    })
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name email phone' } })
    .populate({ path: 'tg', populate: { path: 'user', select: 'name email' } })
    .populate('finalReview.reviewedBy', 'name email')
    .sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leave Applications');

  worksheet.columns = [
    { header: 'Applicant Name', key: 'name', width: 22 },
    { header: 'Role', key: 'role', width: 14 },
    { header: 'Leave Type', key: 'leaveType', width: 16 },
    { header: 'Start Date', key: 'startDate', width: 14 },
    { header: 'End Date', key: 'endDate', width: 14 },
    { header: 'Total Days', key: 'totalDays', width: 12 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Reason', key: 'reason', width: 32 },
    { header: 'TG Reviewer', key: 'tgReviewer', width: 20 },
    { header: 'Final Reviewer', key: 'finalReviewer', width: 20 },
    { header: 'Decision Date', key: 'decisionDate', width: 16 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E7FF' },
  };

  leaves.forEach((l) => {
    worksheet.addRow({
      name: l.applicant?.name || (l.applicantRole === 'STUDENT' ? 'Student' : 'Faculty Member'),
      role: l.applicantRole === 'TEACHER' ? 'Faculty' : l.applicantRole,
      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      totalDays: l.totalDays,
      status: formatStatus(l.status),
      reason: l.reason || 'Not provided',
      tgReviewer: l.tg?.user?.name || (l.applicantRole === 'TEACHER' ? 'Direct to HOD' : 'Not assigned'),
      finalReviewer: l.finalReview?.reviewedBy?.name || 'HOD Office',
      decisionDate: l.finalReview?.reviewedAt ? l.finalReview.reviewedAt.toISOString().slice(0, 10) : 'Pending',
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="leaves-report-${Date.now()}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
};

export default {
  getDashboardSummary,
  getConsiderationsReport,
  getLeavesReport,
  exportConsiderationsToExcel,
  exportLeavesToExcel,
};
