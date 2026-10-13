import Teacher from '../../models/Teacher.js';
import MentorGroup from '../../models/MentorGroup.js';
import User from '../../models/User.js';

export const listTeachers = async (query = {}) => {
  const filter = {};
  if (query.department) {
    filter.department = query.department;
  }

  const teachers = await Teacher.find(filter)
    .populate('user', 'name email phone isActive profileImage')
    .populate('department', 'name code')
    .sort({ designation: 1 });

  // Enrich with active TG mentor group info
  const enriched = await Promise.all(
    teachers.map(async (t) => {
      const activeGroup = await MentorGroup.findOne({ tg: t._id, isActive: true });
      return {
        ...t.toObject(),
        isTG: Boolean(activeGroup),
        mentorGroupId: activeGroup ? activeGroup._id : null,
      };
    })
  );

  return enriched;
};

export default {
  listTeachers,
};
