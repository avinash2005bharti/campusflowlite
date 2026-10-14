import ConsiderationRequest from '../../models/ConsiderationRequest.js';
import Student from '../../models/Student.js';
import Teacher from '../../models/Teacher.js';
import MentorGroup from '../../models/MentorGroup.js';
import User from '../../models/User.js';
import Notification from '../../models/Notification.js';
import AuditLog from '../../models/AuditLog.js';
import ApiError from '../../utils/ApiError.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { isEndDateGteStartDate, rangesOverlap } from '../../utils/dates.js';
import { emitNotification, emitRequestUpdated, emitQueueChanged } from '../../sockets/emitters.js';

export const resolveStudentTG = async (student) => {
  if (student.mentorGroup) {
    const group = await MentorGroup.findById(student.mentorGroup);
    if (group && group.isActive) {
      return group.tg;
    }
  }

  // 1. Peer in same section
  if (student.section) {
    const peer = await Student.findOne({
      section: student.section,
      mentorGroup: { $ne: null },
      _id: { $ne: student._id },
    });
    if (peer?.mentorGroup) {
      const group = await MentorGroup.findById(peer.mentorGroup);
      if (group && group.isActive) {
        student.mentorGroup = group._id;
        await student.save();
        if (!group.students.some((sId) => sId.toString() === student._id.toString())) {
          group.students.push(student._id);
          await group.save();
        }
        return group.tg;
      }
    }
  }

  // 2. Department active mentor group
  if (student.department) {
    const deptGroup = await MentorGroup.findOne({
      department: student.department,
      isActive: true,
    });
    if (deptGroup) {
      student.mentorGroup = deptGroup._id;
      await student.save();
      if (!deptGroup.students.some((sId) => sId.toString() === student._id.toString())) {
        deptGroup.students.push(student._id);
        await deptGroup.save();
      }
      return deptGroup.tg;
    }
  }

  // 3. Fallback to any active mentor group
  const anyGroup = await MentorGroup.findOne({ isActive: true });
  if (anyGroup) {
    student.mentorGroup = anyGroup._id;
    await student.save();
    if (!anyGroup.students.some((sId) => sId.toString() === student._id.toString())) {
      anyGroup.students.push(student._id);
      await anyGroup.save();
    }
    return anyGroup.tg;
  }

  return null;
};

export const createConsideration = async (user, data) => {
  if (user.role !== 'STUDENT') {
    throw ApiError.forbidden('Only students can submit consideration requests');
  }

  const student = await Student.findOne({ user: user.id });
  if (!student) {
    throw ApiError.notFound('Student profile not found');
  }

  if (!isEndDateGteStartDate(data.startDate, data.endDate)) {
    throw ApiError.badRequest('End date must be on or after start date');
  }

  // Check for duplicate / overlapping request with same eventTitle in non-terminal state
  const activeRequests = await ConsiderationRequest.find({
    student: student._id,
    eventTitle: { $regex: new RegExp(`^${data.eventTitle.trim()}$`, 'i') },
    status: { $in: ['PENDING', 'RECOMMENDED_BY_TG', 'APPROVED_BY_HOD'] },
  });

  for (const existing of activeRequests) {
    if (rangesOverlap(data.startDate, data.endDate, existing.startDate, existing.endDate)) {
      throw ApiError.conflict(
        `An active consideration request for event '${data.eventTitle}' already exists in an overlapping date range`
      );
    }
  }

  // Derive TG from student's active MentorGroup or auto-resolve
  const tgTeacherId = await resolveStudentTG(student);

  const now = new Date();
  const request = await ConsiderationRequest.create({
    student: student._id,
    tg: tgTeacherId,
    eventTitle: data.eventTitle,
    eventType: data.eventType,
    organizer: data.organizer,
    venue: data.venue,
    startDate: data.startDate,
    endDate: data.endDate,
    requestedPeriods: data.requestedPeriods,
    selectedPeriods: data.selectedPeriods || [],
    periodTiming: data.periodTiming || '',
    description: data.description,
    attachments: data.attachments || [],
    status: 'PENDING',
    history: [
      {
        status: 'PENDING',
        actor: user._id,
        actorRole: 'STUDENT',
        remarks: 'Application submitted',
        at: now,
        via: 'MANUAL',
      },
    ],
  });

  // Audit log
  await AuditLog.create({
    actor: user._id,
    action: 'CREATE_CONSIDERATION',
    entityType: 'ConsiderationRequest',
    entityId: request._id,
    after: request.toObject(),
  });

  // Notifications
  if (tgTeacherId) {
    const tgTeacher = await Teacher.findById(tgTeacherId).populate('user');
    if (tgTeacher?.user) {
      const notif = await Notification.create({
        user: tgTeacher.user._id,
        title: 'New Consideration Request',
        message: `${user.name} submitted an attendance consideration request for "${data.eventTitle}".`,
        type: 'CONSIDERATION',
        link: `/tg/considerations/${request._id}`,
      });
      emitNotification(tgTeacher.user._id.toString(), notif);
      emitQueueChanged('TG', 'CONSIDERATION');
    }
  } else {
    // If no TG assigned, notify HODs
    const hodUsers = await User.find({ role: { $in: ['HOD', 'ADMIN'] }, isActive: true });
    for (const hod of hodUsers) {
      const notif = await Notification.create({
        user: hod._id,
        title: 'New Consideration Request (No TG Assigned)',
        message: `${user.name} submitted a consideration request requiring direct review.`,
        type: 'CONSIDERATION',
        link: `/hod/considerations/${request._id}`,
      });
      emitNotification(hod._id.toString(), notif);
    }
    emitQueueChanged('HOD', 'CONSIDERATION');
  }

  return request;
};

export const getStudentConsiderations = async (userId, query) => {
  const student = await Student.findOne({ user: userId });
  if (!student) {
    throw ApiError.notFound('Student profile not found');
  }

  const { page, limit, skip } = parsePagination(query);
  const filter = { student: student._id };

  if (query.status) {
    filter.status = query.status.toUpperCase();
  }

  const [requests, total] = await Promise.all([
    ConsiderationRequest.find(filter)
      .populate('tg', 'designation employeeId')
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

export const getTGQueue = async (user, query) => {
  if (!user.isTG || !user.teacherId) {
    throw ApiError.forbidden('Only Tutor Guardians can access this review queue');
  }

  const { page, limit, skip } = parsePagination(query);
  const filter = { tg: user.teacherId };

  if (query.status) {
    filter.status = query.status.toUpperCase();
  } else {
    filter.status = 'PENDING';
  }

  const [requests, total] = await Promise.all([
    ConsiderationRequest.find(filter)
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'section', select: 'name code' },
        ],
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: 1 }),
    ConsiderationRequest.countDocuments(filter),
  ]);

  return {
    requests,
    meta: buildPaginationMeta(total, page, limit),
  };
};

export const getHODQueue = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.all === 'true' || query.status === 'ALL') {
    // Return all department records without restricting to action queue
  } else if (query.status === 'ACTION_NEEDED' || (!query.all && !query.status)) {
    filter.$or = [
      { status: 'RECOMMENDED_BY_TG' },
      { status: 'PENDING', escalated: true },
      { status: 'PENDING', tg: null },
    ];
  } else if (query.status === 'APPROVED' || query.status === 'APPROVED_BY_HOD') {
    filter.status = 'APPROVED_BY_HOD';
  } else if (query.status === 'REJECTED') {
    filter.status = { $in: ['REJECTED', 'REJECTED_BY_HOD', 'REJECTED_BY_TG'] };
  } else if (query.status) {
    filter.status = query.status.toUpperCase();
  }

  if (query.type && query.type !== 'ALL') {
    filter.eventType = query.type.toUpperCase();
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
      .populate({
        path: 'tg',
        populate: { path: 'user', select: 'name email phone' },
      })
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

export const getConsiderationById = async (id, user) => {
  const request = await ConsiderationRequest.findById(id)
    .populate({
      path: 'student',
      populate: [
        { path: 'user', select: 'name email phone profileImage' },
        { path: 'section', select: 'name code year semester' },
        { path: 'department', select: 'name code' },
      ],
    })
    .populate({
      path: 'tg',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate('history.actor', 'name role')
    .populate('tgReview.reviewedBy', 'name role')
    .populate('hodReview.reviewedBy', 'name role');

  if (!request) {
    throw ApiError.notFound('Consideration request not found');
  }

  // Authorization check
  const isOwner = user.role === 'STUDENT' && request.student?.user?._id?.toString() === user.id;
  const isTG = user.isTG && request.tg?._id?.toString() === user.teacherId;
  const isHOD = user.role === 'HOD';
  const isAdmin = user.role === 'ADMIN';

  if (!isOwner && !isTG && !isHOD && !isAdmin) {
    throw ApiError.forbidden('You do not have permission to view this request');
  }

  return request;
};

export const cancelConsideration = async (id, user) => {
  const request = await ConsiderationRequest.findById(id).populate('student');
  if (!request) {
    throw ApiError.notFound('Consideration request not found');
  }

  const studentUserId = request.student?.user?._id?.toString() || request.student?.user?.toString();
  const studentDocId = request.student?._id?.toString() || request.student?.toString();
  const isOwner = (studentUserId && studentUserId === user.id) || 
                  (user.studentId && studentDocId === user.studentId) ||
                  (user.role === 'ADMIN');

  if (!isOwner) {
    throw ApiError.forbidden('You can only cancel your own consideration requests');
  }

  if (request.status !== 'PENDING') {
    throw ApiError.invalidStateTransition(
      `Cannot cancel request in '${request.status}' status. Only PENDING requests can be cancelled.`
    );
  }

  const before = request.toObject();
  const now = new Date();

  request.status = 'CANCELLED';
  request.history.push({
    status: 'CANCELLED',
    actor: user._id,
    actorRole: 'STUDENT',
    remarks: 'Cancelled by student',
    at: now,
    via: 'MANUAL',
  });
  await request.save();

  await AuditLog.create({
    actor: user._id,
    action: 'CANCEL_CONSIDERATION',
    entityType: 'ConsiderationRequest',
    entityId: request._id,
    before,
    after: request.toObject(),
  });

  emitRequestUpdated([`user_${user.id}`, `role_HOD`], {
    kind: 'CONSIDERATION',
    id: request._id,
    status: 'CANCELLED',
  });
  if (request.tg) {
    emitQueueChanged('TG', 'CONSIDERATION');
  }

  return request;
};

export const tgReview = async (id, user, { decision, remarks }) => {
  const request = await ConsiderationRequest.findById(id).populate('student');
  if (!request) {
    throw ApiError.notFound('Consideration request not found');
  }

  if (!user.isTG || !user.teacherId || request.tg?.toString() !== user.teacherId) {
    throw ApiError.forbidden('You are only authorized to review requests from your assigned mentees');
  }

  if (request.status !== 'PENDING') {
    throw ApiError.invalidStateTransition(`Cannot perform TG review on a request in '${request.status}' state`);
  }

  const before = request.toObject();
  const now = new Date();
  const newStatus = decision === 'RECOMMEND' ? 'RECOMMENDED_BY_TG' : 'REJECTED';

  request.status = newStatus;
  request.tgReview = {
    remarks: remarks || '',
    reviewedAt: now,
    reviewedBy: user._id,
  };
  request.history.push({
    status: newStatus,
    actor: user._id,
    actorRole: 'TG',
    remarks: remarks || (decision === 'RECOMMEND' ? 'Recommended by TG' : 'Rejected by TG'),
    at: now,
    via: 'MANUAL',
  });
  await request.save();

  await AuditLog.create({
    actor: user._id,
    action: `TG_${decision}_CONSIDERATION`,
    entityType: 'ConsiderationRequest',
    entityId: request._id,
    before,
    after: request.toObject(),
  });

  // Notify student
  const studentUser = request.student?.user;
  if (studentUser) {
    const notif = await Notification.create({
      user: studentUser,
      title: decision === 'RECOMMEND' ? 'Consideration Recommended' : 'Consideration Rejected by TG',
      message: `Your consideration request for "${request.eventTitle}" was ${newStatus.toLowerCase().replace(/_/g, ' ')}.`,
      type: 'CONSIDERATION',
      link: `/student/considerations/${request._id}`,
    });
    emitNotification(studentUser.toString(), notif);
  }

  // If recommended, notify HOD
  if (decision === 'RECOMMEND') {
    const hodUsers = await User.find({ role: { $in: ['HOD', 'ADMIN'] }, isActive: true });
    for (const hod of hodUsers) {
      const notif = await Notification.create({
        user: hod._id,
        title: 'Consideration Awaiting HOD Approval',
        message: `TG recommended attendance consideration for "${request.eventTitle}".`,
        type: 'CONSIDERATION',
        link: `/hod/considerations/${request._id}`,
      });
      emitNotification(hod._id.toString(), notif);
    }
    emitQueueChanged('HOD', 'CONSIDERATION');
  }

  emitQueueChanged('TG', 'CONSIDERATION');
  emitRequestUpdated([`user_${studentUser}`, 'role_HOD', `tg_${user.teacherId}`], {
    kind: 'CONSIDERATION',
    id: request._id,
    status: newStatus,
  });

  return request;
};

export const hodReview = async (id, user, { decision, remarks, approvedPeriods }) => {
  const request = await ConsiderationRequest.findById(id).populate('student');
  if (!request) {
    throw ApiError.notFound('Consideration request not found');
  }

  // Prevent self-review (applicant == reviewer)
  if (request.student?.user?.toString() === user.id) {
    throw ApiError.forbidden('You cannot review your own request');
  }

  // Allowed transitions: status must be RECOMMENDED_BY_TG, OR request must be escalated, OR unassigned TG pending
  const isEligible =
    request.status === 'RECOMMENDED_BY_TG' ||
    (request.status === 'PENDING' && (request.escalated === true || !request.tg));
  if (!isEligible) {
    throw ApiError.invalidStateTransition(
      `HOD review requires status 'RECOMMENDED_BY_TG' or an escalated/unassigned pending request. Current status: '${request.status}', escalated: ${request.escalated}`
    );
  }

  if (decision === 'APPROVE') {
    if (!approvedPeriods || approvedPeriods < 1 || approvedPeriods > request.requestedPeriods) {
      throw ApiError.badRequest(
        `Approved periods must be between 1 and requested periods (${request.requestedPeriods})`
      );
    }
  }

  const before = request.toObject();
  const now = new Date();
  const newStatus = decision === 'APPROVE' ? 'APPROVED_BY_HOD' : 'REJECTED';

  request.status = newStatus;
  request.hodReview = {
    remarks: remarks || '',
    reviewedAt: now,
    reviewedBy: user._id,
    ...(decision === 'APPROVE' ? { approvedPeriods } : {}),
  };
  request.history.push({
    status: newStatus,
    actor: user._id,
    actorRole: user.role,
    remarks: remarks || (decision === 'APPROVE' ? `Approved with ${approvedPeriods} periods` : 'Rejected by HOD'),
    at: now,
    via: 'MANUAL',
  });
  await request.save();

  await AuditLog.create({
    actor: user._id,
    action: `HOD_${decision}_CONSIDERATION`,
    entityType: 'ConsiderationRequest',
    entityId: request._id,
    before,
    after: request.toObject(),
  });

  // Notify student
  const studentUser = request.student?.user;
  if (studentUser) {
    const notif = await Notification.create({
      user: studentUser,
      title: decision === 'APPROVE' ? 'Consideration Approved by HOD!' : 'Consideration Rejected by HOD',
      message: `Your request for "${request.eventTitle}" was ${newStatus.toLowerCase().replace(/_/g, ' ')}${decision === 'APPROVE' ? ` (${approvedPeriods} periods credited)` : ''}.`,
      type: 'CONSIDERATION',
      link: `/student/considerations/${request._id}`,
    });
    emitNotification(studentUser.toString(), notif);
  }

  // Notify TG
  if (request.tg) {
    const tgTeacher = await Teacher.findById(request.tg).populate('user');
    if (tgTeacher?.user) {
      const notif = await Notification.create({
        user: tgTeacher.user._id,
        title: `HOD Decision: Consideration ${decision}`,
        message: `HOD completed final review on "${request.eventTitle}" (${newStatus}).`,
        type: 'CONSIDERATION',
        link: `/tg/considerations/${request._id}`,
      });
      emitNotification(tgTeacher.user._id.toString(), notif);
    }
  }

  emitQueueChanged('HOD', 'CONSIDERATION');
  emitRequestUpdated([`user_${studentUser}`, 'role_HOD', ...(request.tg ? [`tg_${request.tg}`] : [])], {
    kind: 'CONSIDERATION',
    id: request._id,
    status: newStatus,
  });

  return request;
};

export default {
  createConsideration,
  getStudentConsiderations,
  getTGQueue,
  getHODQueue,
  getConsiderationById,
  cancelConsideration,
  tgReview,
  hodReview,
};
