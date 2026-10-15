import Teacher from '../../models/Teacher.js';
import MentorGroup from '../../models/MentorGroup.js';
import User from '../../models/User.js';
import Department from '../../models/Department.js';
import Section from '../../models/Section.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

export const listTeachers = async (query = {}) => {
  const filter = {};
  if (query.department) {
    filter.department = query.department;
  }

  const isPaginated = query.page !== undefined || query.limit !== undefined;
  const { page, limit, skip } = parsePagination(query);

  let teachersQuery = Teacher.find(filter)
    .populate('user', 'name email phone isActive profileImage')
    .populate('department', 'name code')
    .sort({ designation: 1 });

  let total = 0;
  if (isPaginated) {
    total = await Teacher.countDocuments(filter);
    teachersQuery = teachersQuery.skip(skip).limit(limit);
  }

  const teachers = await teachersQuery;

  // PERF-02: Single bulk query for active MentorGroups instead of N+1 queries
  const teacherIds = teachers.map((t) => t._id);
  const activeGroups = await MentorGroup.find({
    tg: { $in: teacherIds },
    isActive: true,
  })
    .populate('section', 'name code year semester')
    .populate({
      path: 'students',
      select: 'section',
      populate: { path: 'section', select: 'name code year semester' },
    });

  const groupMap = new Map();
  for (const group of activeGroups) {
    if (group.tg) {
      groupMap.set(group.tg.toString(), group);
    }
  }

  const enriched = teachers.map((t) => {
    const activeGroup = groupMap.get(t._id.toString()) || null;
    let mentoredSection = null;
    if (activeGroup) {
      if (activeGroup.section) {
        const sem = activeGroup.section.semester || activeGroup.semester;
        const code = activeGroup.section.code || activeGroup.section.name;
        mentoredSection = sem ? `Semester ${sem} • ${code}` : code;
      } else if (activeGroup.students?.length > 0 && activeGroup.students[0].section) {
        const sec = activeGroup.students[0].section;
        mentoredSection = `Semester ${sec.semester || 5} • ${sec.code || sec.name}`;
      } else if (activeGroup.semester) {
        mentoredSection = `Semester ${activeGroup.semester}`;
      }
    }

    return {
      ...t.toObject(),
      isTG: Boolean(activeGroup),
      mentorGroupId: activeGroup ? activeGroup._id : null,
      activeGroup: activeGroup ? activeGroup.toObject() : null,
      mentoredSection,
    };
  });

  if (isPaginated) {
    return {
      teachers: enriched,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  return enriched;
};

export const updateTeacher = async (id, updateData = {}) => {
  const teacher = await Teacher.findById(id).populate('user');
  if (!teacher) {
    const error = new Error('Faculty member not found');
    error.statusCode = 404;
    throw error;
  }

  if (updateData.employeeId) teacher.employeeId = updateData.employeeId.trim();
  if (updateData.designation) teacher.designation = updateData.designation.trim();
  if (updateData.specialization !== undefined) teacher.specialization = updateData.specialization.trim();
  await teacher.save();

  if (teacher.user) {
    if (updateData.name) teacher.user.name = updateData.name.trim();
    if (updateData.email) teacher.user.email = updateData.email.trim().toLowerCase();
    if (updateData.phone !== undefined) teacher.user.phone = updateData.phone.trim();
    if (updateData.status) {
      teacher.user.isActive = updateData.status === 'ACTIVE';
    }
    await teacher.user.save();
  }

  // Handle TG toggle if explicitly false
  if (updateData.isTG === false) {
    await MentorGroup.updateMany({ tg: teacher._id }, { isActive: false });
  }

  return teacher;
};

export default {
  listTeachers,
  updateTeacher,
};
