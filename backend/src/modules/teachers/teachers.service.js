import Teacher from '../../models/Teacher.js';
import MentorGroup from '../../models/MentorGroup.js';
import User from '../../models/User.js';
import Department from '../../models/Department.js';
import Section from '../../models/Section.js';

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
      const activeGroup = await MentorGroup.findOne({ tg: t._id, isActive: true })
        .populate('section', 'name code year semester')
        .populate({
          path: 'students',
          select: 'section',
          populate: { path: 'section', select: 'name code year semester' },
        });

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
    })
  );

  return enriched;
};

export default {
  listTeachers,
};
