import MentorGroup from '../../models/MentorGroup.js';
import Student from '../../models/Student.js';
import Teacher from '../../models/Teacher.js';
import ApiError from '../../utils/ApiError.js';

export const listMentorGroups = async (query = {}) => {
  const filter = {};
  if (query.department) filter.department = query.department;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true' || query.isActive === true;

  return MentorGroup.find(filter)
    .populate('department', 'name code')
    .populate({
      path: 'tg',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate({
      path: 'students',
      populate: [
        { path: 'user', select: 'name email phone' },
        { path: 'section', select: 'name code' },
      ],
    })
    .sort({ createdAt: -1 });
};

export const createMentorGroup = async ({ department, tgId, academicYear, studentIds = [] }) => {
  const teacher = await Teacher.findById(tgId);
  if (!teacher) {
    throw ApiError.notFound('Teacher (TG) not found');
  }

  // Check if students are already in an active mentor group
  if (studentIds.length > 0) {
    const conflictingStudents = await Student.find({
      _id: { $in: studentIds },
      mentorGroup: { $ne: null },
    }).populate('user', 'name');

    if (conflictingStudents.length > 0) {
      const names = conflictingStudents.map((s) => s.user?.name || s.rollNumber).join(', ');
      throw ApiError.conflict(`The following student(s) already belong to an active mentor group: ${names}`);
    }
  }

  const group = await MentorGroup.create({
    department,
    tg: teacher._id,
    academicYear,
    students: studentIds,
    isActive: true,
  });

  // Sync Student.mentorGroup
  if (studentIds.length > 0) {
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { mentorGroup: group._id } }
    );
  }

  return group;
};

export const updateMentorGroupStudents = async (groupId, { addStudentIds = [], removeStudentIds = [] }) => {
  const group = await MentorGroup.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Mentor group not found');
  }

  // Check if any students to add are already in another active group
  if (addStudentIds.length > 0) {
    const conflicting = await Student.find({
      _id: { $in: addStudentIds },
      mentorGroup: { $exists: true, $ne: null, $ne: group._id },
    }).populate('user', 'name');

    if (conflicting.length > 0) {
      const names = conflicting.map((s) => s.user?.name || s.rollNumber).join(', ');
      throw ApiError.conflict(`Student(s) already belong to another active mentor group: ${names}`);
    }
  }

  // Add students
  if (addStudentIds.length > 0) {
    const currentSet = new Set(group.students.map((s) => s.toString()));
    addStudentIds.forEach((id) => currentSet.add(id.toString()));
    group.students = Array.from(currentSet);

    await Student.updateMany(
      { _id: { $in: addStudentIds } },
      { $set: { mentorGroup: group._id } }
    );
  }

  // Remove students
  if (removeStudentIds.length > 0) {
    const removeSet = new Set(removeStudentIds.map((id) => id.toString()));
    group.students = group.students.filter((s) => !removeSet.has(s.toString()));

    await Student.updateMany(
      { _id: { $in: removeStudentIds }, mentorGroup: group._id },
      { $set: { mentorGroup: null } }
    );
  }

  await group.save();

  return MentorGroup.findById(group._id)
    .populate('department', 'name code')
    .populate({
      path: 'tg',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate({
      path: 'students',
      populate: [
        { path: 'user', select: 'name email phone' },
        { path: 'section', select: 'name code' },
      ],
    });
};

export const getMyCohort = async (teacherId) => {
  if (!teacherId) {
    throw ApiError.forbidden('You are not assigned as a TG or teacher');
  }

  const group = await MentorGroup.findOne({ tg: teacherId, isActive: true })
    .populate('department', 'name code')
    .populate({
      path: 'tg',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate({
      path: 'students',
      populate: [
        { path: 'user', select: 'name email phone' },
        { path: 'section', select: 'name code' },
      ],
    });

  if (!group) {
    throw ApiError.notFound('No active mentor group found for your account');
  }

  return group;
};

export default {
  listMentorGroups,
  createMentorGroup,
  updateMentorGroupStudents,
  getMyCohort,
};
