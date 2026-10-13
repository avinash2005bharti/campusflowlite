import mongoose from 'mongoose';
import env from '../config/env.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Section from '../models/Section.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import MentorGroup from '../models/MentorGroup.js';
import HodAppointment from '../models/HodAppointment.js';
import ConsiderationRequest from '../models/ConsiderationRequest.js';
import LeaveApplication from '../models/LeaveApplication.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import RefreshToken from '../models/RefreshToken.js';
import { getTodayIST } from '../utils/dates.js';

export const runSeed = async () => {
  try {
    const mongoUri = env.MONGODB_URI;
    if (!mongoUri || mongoUri.includes('<username>') || mongoUri.includes('<password>')) {
      console.error('❌ Please set a valid MONGODB_URI/MONGO_URI before running seed.');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoUri);

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany(),
      Department.deleteMany(),
      Section.deleteMany(),
      Teacher.deleteMany(),
      Student.deleteMany(),
      MentorGroup.deleteMany(),
      HodAppointment.deleteMany(),
      ConsiderationRequest.deleteMany(),
      LeaveApplication.deleteMany(),
      Notification.deleteMany(),
      AuditLog.deleteMany(),
      RefreshToken.deleteMany(),
    ]);

    // 1. Department
    const cseDept = await Department.create({
      name: 'Computer Science and Engineering',
      code: 'CSE',
    });
    console.log('🏛️ Created Department: CSE');

    // 2. Sections
    const secA = await Section.create({
      department: cseDept._id,
      year: 2,
      semester: 4,
      name: 'A',
      code: 'CSE-4A',
    });

    const secB = await Section.create({
      department: cseDept._id,
      year: 2,
      semester: 4,
      name: 'B',
      code: 'CSE-4B',
    });
    console.log('📚 Created Sections: CSE-4A, CSE-4B');

    // Default password hash
    const defaultPasswordHash = await User.hashPassword('Password@123');

    // 3. Admin
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@campusflow.edu',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      phone: '9876543210',
      mustChangePassword: false,
      isActive: true,
    });

    // 4. HOD
    const hodUser = await User.create({
      name: 'Dr. Rajesh Sharma (HOD)',
      email: 'hod@campusflow.edu',
      passwordHash: defaultPasswordHash,
      role: 'HOD',
      phone: '9876543211',
      mustChangePassword: false,
      isActive: true,
    });

    const hodTeacher = await Teacher.create({
      user: hodUser._id,
      department: cseDept._id,
      designation: 'Professor & Head of Department',
      employeeId: 'EMP_HOD_01',
    });

    await HodAppointment.create({
      department: cseDept._id,
      teacher: hodTeacher._id,
      startDate: new Date('2024-01-01'),
      isActive: true,
    });
    console.log('👨‍🏫 Created Admin & HOD');

    // 5. Teachers (2 will be TGs, 1 regular)
    const tg1User = await User.create({
      name: 'Prof. Ananya Verma',
      email: 'ananya.tg@campusflow.edu',
      passwordHash: defaultPasswordHash,
      role: 'TEACHER',
      phone: '9876543212',
      mustChangePassword: false,
      isActive: true,
    });
    const tg1Teacher = await Teacher.create({
      user: tg1User._id,
      department: cseDept._id,
      designation: 'Associate Professor',
      employeeId: 'EMP_CSE_101',
    });

    const tg2User = await User.create({
      name: 'Prof. Vikram Rao',
      email: 'vikram.tg@campusflow.edu',
      passwordHash: defaultPasswordHash,
      role: 'TEACHER',
      phone: '9876543213',
      mustChangePassword: false,
      isActive: true,
    });
    const tg2Teacher = await Teacher.create({
      user: tg2User._id,
      department: cseDept._id,
      designation: 'Assistant Professor',
      employeeId: 'EMP_CSE_102',
    });

    const teacher3User = await User.create({
      name: 'Prof. Kavita Sen',
      email: 'kavita.teacher@campusflow.edu',
      passwordHash: defaultPasswordHash,
      role: 'TEACHER',
      phone: '9876543214',
      mustChangePassword: false,
      isActive: true,
    });
    const teacher3 = await Teacher.create({
      user: teacher3User._id,
      department: cseDept._id,
      designation: 'Assistant Professor',
      employeeId: 'EMP_CSE_103',
    });
    console.log('👩‍🏫 Created 3 Teachers (Prof. Ananya, Prof. Vikram, Prof. Kavita)');

    // 6. Mentor Groups
    const groupA = await MentorGroup.create({
      department: cseDept._id,
      tg: tg1Teacher._id,
      academicYear: '2025-2026',
      students: [],
      isActive: true,
    });

    const groupB = await MentorGroup.create({
      department: cseDept._id,
      tg: tg2Teacher._id,
      academicYear: '2025-2026',
      students: [],
      isActive: true,
    });

    // 7. 10 Students (5 in Sec A, 5 in Sec B)
    const studentData = [
      { name: 'Aarav Patel', email: 'aarav@campusflow.edu', roll: '24CSE001', sec: secA, group: groupA },
      { name: 'Diya Sharma', email: 'diya@campusflow.edu', roll: '24CSE002', sec: secA, group: groupA },
      { name: 'Ishaan Verma', email: 'ishaan@campusflow.edu', roll: '24CSE003', sec: secA, group: groupA },
      { name: 'Ananya Nair', email: 'ananya.student@campusflow.edu', roll: '24CSE004', sec: secA, group: groupA },
      { name: 'Rohan Mehra', email: 'rohan@campusflow.edu', roll: '24CSE005', sec: secA, group: groupA },
      { name: 'Sneha Gupta', email: 'sneha@campusflow.edu', roll: '24CSE006', sec: secB, group: groupB },
      { name: 'Kabir Khan', email: 'kabir@campusflow.edu', roll: '24CSE007', sec: secB, group: groupB },
      { name: 'Pooja Reddy', email: 'pooja@campusflow.edu', roll: '24CSE008', sec: secB, group: groupB },
      { name: 'Aditya Joshi', email: 'aditya@campusflow.edu', roll: '24CSE009', sec: secB, group: groupB },
      { name: 'Meera Iyer', email: 'meera@campusflow.edu', roll: '24CSE010', sec: secB, group: groupB },
    ];

    const createdStudents = [];
    const groupAStudentIds = [];
    const groupBStudentIds = [];

    for (let i = 0; i < studentData.length; i++) {
      const s = studentData[i];
      const u = await User.create({
        name: s.name,
        email: s.email,
        passwordHash: defaultPasswordHash,
        role: 'STUDENT',
        phone: `98765432${20 + i}`,
        mustChangePassword: false,
        isActive: true,
      });

      const studentDoc = await Student.create({
        user: u._id,
        department: cseDept._id,
        section: s.sec._id,
        rollNumber: s.roll,
        enrollmentYear: 2024,
        guardianName: `Guardian of ${s.name}`,
        guardianPhone: `98111222${30 + i}`,
        mentorGroup: s.group._id,
      });

      createdStudents.push({ user: u, student: studentDoc });

      if (s.sec._id.equals(secA._id)) {
        groupAStudentIds.push(studentDoc._id);
      } else {
        groupBStudentIds.push(studentDoc._id);
      }
    }

    groupA.students = groupAStudentIds;
    await groupA.save();

    groupB.students = groupBStudentIds;
    await groupB.save();

    console.log('🎓 Created 10 Students and assigned to Mentor Groups A & B');

    // 8. Sample Consideration Request (Aarav -> TG Ananya)
    const aarav = createdStudents[0];
    const today = getTodayIST();
    await ConsiderationRequest.create({
      student: aarav.student._id,
      tg: tg1Teacher._id,
      eventTitle: 'Smart India Hackathon 2026 Grand Finale',
      eventType: 'HACKATHON',
      organizer: 'Ministry of Education & AICTE',
      venue: 'New Delhi Tech Hub',
      startDate: today,
      endDate: today,
      requestedPeriods: 6,
      description: 'Participated in the 36-hour national hackathon finals.',
      attachments: [
        {
          fileId: 'sih-cert-001',
          filePath: `/campusflow/considerations/${aarav.user._id}/sih-certificate.pdf`,
          name: 'SIH_Selection_Letter.pdf',
          mimeType: 'application/pdf',
          size: 145000,
          uploadedAt: new Date(),
        },
      ],
      status: 'PENDING',
      history: [
        {
          status: 'PENDING',
          actor: aarav.user._id,
          actorRole: 'STUDENT',
          remarks: 'Submitted consideration request',
          at: new Date(),
          via: 'MANUAL',
        },
      ],
    });

    // 9. Sample Leave Application (Sneha -> TG Vikram)
    const sneha = createdStudents[5];
    await LeaveApplication.create({
      applicant: sneha.user._id,
      applicantRole: 'STUDENT',
      student: sneha.student._id,
      tg: tg2Teacher._id,
      leaveType: 'CASUAL',
      startDate: today,
      endDate: today,
      totalDays: 1,
      reason: 'Attending family wedding ceremony out of town.',
      attachments: [],
      status: 'PENDING',
      history: [
        {
          status: 'PENDING',
          actor: sneha.user._id,
          actorRole: 'STUDENT',
          remarks: 'Leave application submitted',
          at: new Date(),
          via: 'MANUAL',
        },
      ],
    });

    console.log('\n=============================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('-------------------------------------------------------------');
    console.log('Default Password for all accounts: Password@123');
    console.log('Credentials:');
    console.log('  👑 ADMIN:   admin@campusflow.edu');
    console.log('  🏛️ HOD:     hod@campusflow.edu');
    console.log('  👩‍🏫 TG 1:    ananya.tg@campusflow.edu (Cohort CSE-4A)');
    console.log('  👨‍🏫 TG 2:    vikram.tg@campusflow.edu (Cohort CSE-4B)');
    console.log('  🧑‍🏫 Teacher: kavita.teacher@campusflow.edu');
    console.log('  🎓 Student: aarav@campusflow.edu (Roll 24CSE001, Sec A)');
    console.log('  🎓 Student: sneha@campusflow.edu (Roll 24CSE006, Sec B)');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
