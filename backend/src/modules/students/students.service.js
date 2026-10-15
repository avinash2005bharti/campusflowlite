import mongoose from 'mongoose';
import Student from '../../models/Student.js';
import User from '../../models/User.js';
import Section from '../../models/Section.js';
import Department from '../../models/Department.js';
import MentorGroup from '../../models/MentorGroup.js';
import Teacher from '../../models/Teacher.js';
import ConsiderationRequest from '../../models/ConsiderationRequest.js';
import LeaveApplication from '../../models/LeaveApplication.js';
import Notification from '../../models/Notification.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

export const listStudents = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.section) {
    filter.section = query.section;
  }
  if (query.semester) {
    const semNum = parseInt(String(query.semester).replace(/\D/g, ''), 10);
    if (!isNaN(semNum)) {
      const matchingSections = await Section.find({ semester: semNum }).select('_id');
      filter.section = { $in: matchingSections.map((s) => s._id) };
    }
  }
  if (query.department) {
    filter.department = query.department;
  }
  if (query.mentor) {
    filter.mentorGroup = query.mentor;
  }

  // If search query is provided, search rollNumber, enrollmentNumber or matching user IDs
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    const matchingUsers = await User.find({
      role: 'STUDENT',
      $or: [{ name: searchRegex }, { email: searchRegex }],
    }).select('_id');

    filter.$or = [
      { rollNumber: searchRegex },
      { enrollmentNumber: searchRegex },
      { user: { $in: matchingUsers.map((u) => u._id) } },
    ];
  }

  const fetchAll = query.all === 'true' || query.limit === 'all';
  const queryLimit = fetchAll ? 0 : limit;
  const querySkip = fetchAll ? 0 : skip;

  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate('user', 'name email phone isActive profileImage')
      .populate('department', 'name code')
      .populate('section', 'name code year semester')
      .populate({
        path: 'mentorGroup',
        select: 'academicYear isActive tg',
        populate: {
          path: 'tg',
          populate: { path: 'user', select: 'name email phone' },
        },
      })
      .skip(querySkip)
      .limit(queryLimit)
      .sort({ rollNumber: 1 }),
    Student.countDocuments(filter),
  ]);

  return {
    students,
    meta: buildPaginationMeta(total, page, fetchAll ? total : limit),
  };
};

export const getStudentById = async (id) => {
  return Student.findById(id)
    .populate('user', 'name email phone isActive profileImage')
    .populate('department', 'name code')
    .populate('section', 'name code year semester')
    .populate({
      path: 'mentorGroup',
      populate: {
        path: 'tg',
        populate: { path: 'user', select: 'name email phone' },
      },
    });
};

export const updateStudent = async (id, data) => {
  const student = await Student.findById(id);
  if (!student) {
    throw new Error('Student not found');
  }

  if (data.name || data.phone || data.status !== undefined || data.email) {
    const user = await User.findById(student.user);
    if (user) {
      if (data.name) user.name = data.name.trim();
      if (data.phone !== undefined) user.phone = data.phone ? data.phone.trim() : null;
      if (data.email) user.email = data.email.trim().toLowerCase();
      if (data.status !== undefined) {
        user.isActive = data.status === 'ACTIVE' || data.status === true;
      }
      await user.save();
    }
  }

  if (data.rollNumber) {
    student.rollNumber = data.rollNumber.trim().toUpperCase();
  }

  // Update Semester if provided
  if (data.semester !== undefined && data.semester !== null) {
    const semNum = parseInt(String(data.semester).replace(/\D/g, ''), 10);
    if (!isNaN(semNum) && semNum >= 1 && semNum <= 8) {
      student.semester = semNum;
    }
  }

  // Update Section if provided
  if (data.section) {
    let resolvedSection = null;
    const isObjectId = mongoose.Types.ObjectId.isValid(data.section) && /^[0-9a-fA-F]{24}$/.test(String(data.section));
    if (isObjectId) {
      resolvedSection = await Section.findById(data.section);
    }

    if (!resolvedSection) {
      const rawSec = String(data.section).trim();
      const secLetterMatch = rawSec.match(/([A-D])/i);
      const letter = secLetterMatch ? secLetterMatch[1].toUpperCase() : 'B';
      const targetSem = student.semester || 5;

      resolvedSection = await Section.findOne({
        semester: targetSem,
        $or: [
          { code: `CSE-${letter}` },
          { name: `Section ${letter}` },
          { code: new RegExp(letter, 'i') },
          { name: new RegExp(letter, 'i') },
        ],
      });

      if (!resolvedSection) {
        resolvedSection = await Section.findOne({
          $or: [
            { code: `CSE-${letter}` },
            { name: `Section ${letter}` },
          ],
        });
      }
    }

    if (resolvedSection) {
      student.section = resolvedSection._id;

      // Automatically reassign student to the appointed Tutor Guardian / MentorGroup of the new section
      const activeMentorGroup = await MentorGroup.findOne({
        section: resolvedSection._id,
        isActive: true,
      });

      if (activeMentorGroup) {
        // Remove from previous mentor group if any
        if (student.mentorGroup && student.mentorGroup.toString() !== activeMentorGroup._id.toString()) {
          await MentorGroup.findByIdAndUpdate(student.mentorGroup, { $pull: { students: student._id } });
        }
        student.mentorGroup = activeMentorGroup._id;
        await MentorGroup.findByIdAndUpdate(activeMentorGroup._id, { $addToSet: { students: student._id } });
      }
    }
  }

  if (data.mentorGroup !== undefined) {
    student.mentorGroup = data.mentorGroup;
  }

  await student.save();
  return getStudentById(student._id);
};

export const deleteStudent = async (id) => {
  const student = await Student.findById(id);
  if (!student) {
    throw new Error('Student not found');
  }
  const userId = student.user;

  // SEC-06 Cascade cleanup
  await ConsiderationRequest.deleteMany({ student: id });
  await LeaveApplication.deleteMany({ student: id });
  await MentorGroup.updateMany(
    { students: id },
    { $pull: { students: id } }
  );
  if (userId) {
    await Notification.deleteMany({ user: userId });
  }

  await Student.findByIdAndDelete(id);
  if (userId) {
    await User.findByIdAndDelete(userId);
  }
  return { message: 'Student deleted successfully' };
};

export default {
  listStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
