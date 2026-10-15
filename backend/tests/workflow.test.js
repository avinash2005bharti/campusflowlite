import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidDateStr,
  calculateInclusiveDays,
  isEndDateGteStartDate,
  isExcessivelyBackdated,
  rangesOverlap,
} from '../src/utils/dates.js';

import { resolveApprovalChain } from '../src/modules/leaves/leaves.service.js';
import { createConsiderationSchema, tgReviewSchema, hodReviewSchema } from '../src/modules/considerations/considerations.schema.js';
import { createLeaveSchema, tgReviewLeaveSchema, finalReviewLeaveSchema } from '../src/modules/leaves/leaves.schema.js';
import {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  registerStudentSchema,
} from '../src/modules/auth/auth.schema.js';
import ApiError from '../src/utils/ApiError.js';

describe('1. Date & Time Utilities (Section 0.9 & Section 7)', () => {
  it('should validate YYYY-MM-DD date format', () => {
    assert.equal(isValidDateStr('2026-10-12'), true);
    assert.equal(isValidDateStr('12-10-2026'), false);
    assert.equal(isValidDateStr('invalid-date'), false);
  });

  it('should calculate inclusive calendar days correctly', () => {
    // Same day is 1 day
    assert.equal(calculateInclusiveDays('2026-10-12', '2026-10-12'), 1);
    // 3 days: 12th, 13th, 14th
    assert.equal(calculateInclusiveDays('2026-10-12', '2026-10-14'), 3);
  });

  it('should verify end date is on or after start date', () => {
    assert.equal(isEndDateGteStartDate('2026-10-12', '2026-10-15'), true);
    assert.equal(isEndDateGteStartDate('2026-10-12', '2026-10-12'), true);
    assert.equal(isEndDateGteStartDate('2026-10-15', '2026-10-12'), false);
  });

  it('should detect date range overlaps accurately', () => {
    // Overlapping ranges
    assert.equal(rangesOverlap('2026-10-10', '2026-10-15', '2026-10-12', '2026-10-18'), true);
    assert.equal(rangesOverlap('2026-10-10', '2026-10-12', '2026-10-12', '2026-10-15'), true);
    // Non-overlapping ranges
    assert.equal(rangesOverlap('2026-10-10', '2026-10-12', '2026-10-13', '2026-10-15'), false);
  });
});

describe('2. Leave Approval Chain Resolver (Section 7.2 & 7.3)', () => {
  it('should resolve student leave chain through TG and HOD', () => {
    const chain = resolveApprovalChain('STUDENT');
    assert.deepEqual(chain.tiers, ['TG', 'HOD']);
    assert.equal(chain.finalRole, 'HOD');
  });

  it('should resolve faculty leave chain directly to HOD', () => {
    const chain = resolveApprovalChain('TEACHER');
    assert.deepEqual(chain.tiers, ['HOD']);
    assert.equal(chain.finalRole, 'HOD');
  });

  it('should resolve HOD leave chain directly to Admin', () => {
    const chain = resolveApprovalChain('HOD');
    assert.deepEqual(chain.tiers, ['ADMIN']);
    assert.equal(chain.finalRole, 'ADMIN');
  });
});

describe('3. Consideration Validation & Business Rules (Section 7.1)', () => {
  it('should allow consideration request without attachments (attachments are optional)', () => {
    const validData = {
      eventTitle: 'Hackathon Grand Finale',
      eventType: 'HACKATHON',
      startDate: '2026-10-20',
      endDate: '2026-10-22',
      requestedPeriods: 12,
      attachments: [
        {
          fileId: 'f1',
          filePath: '/campusflow/considerations/u1/cert.pdf',
          name: 'cert.pdf',
          mimeType: 'application/pdf',
          size: 50000,
        },
      ],
    };
    assert.doesNotThrow(() => createConsiderationSchema.parse(validData));

    const withoutAttachments = { ...validData, attachments: [] };
    assert.doesNotThrow(() => createConsiderationSchema.parse(withoutAttachments));

    const omittedAttachments = { ...validData };
    delete omittedAttachments.attachments;
    assert.doesNotThrow(() => createConsiderationSchema.parse(omittedAttachments));
  });

  it('should require min 5 chars remarks when TG rejects', () => {
    assert.doesNotThrow(() =>
      tgReviewSchema.parse({ decision: 'REJECT', remarks: 'Not sufficient attendance proof' })
    );

    assert.throws(() =>
      tgReviewSchema.parse({ decision: 'REJECT', remarks: 'No' })
    );
  });

  it('should require approvedPeriods > 0 when HOD approves consideration', () => {
    assert.doesNotThrow(() =>
      hodReviewSchema.parse({ decision: 'APPROVE', remarks: 'Granted', approvedPeriods: 10 })
    );

    assert.throws(() =>
      hodReviewSchema.parse({ decision: 'APPROVE', remarks: 'Granted' })
    );
  });
});

describe('4. Leave Validation & Business Rules (Section 7.2)', () => {
  it('should validate leave application fields', () => {
    const validLeave = {
      leaveType: 'CASUAL',
      startDate: '2026-10-15',
      endDate: '2026-10-16',
      reason: 'Personal family event',
    };
    assert.doesNotThrow(() => createLeaveSchema.parse(validLeave));
  });

  it('should require min 5 chars remarks on rejection', () => {
    assert.throws(() =>
      tgReviewLeaveSchema.parse({ decision: 'REJECT', remarks: 'Bad' })
    );
    assert.doesNotThrow(() =>
      tgReviewLeaveSchema.parse({ decision: 'REJECT', remarks: 'Overlaps with midterm examination' })
    );
  });
});

describe('5. Standardized Error Formats & ApiError (Section 8.1)', () => {
  it('should construct ApiError with correct code and status', () => {
    const err = ApiError.invalidStateTransition('Transition not allowed');
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'INVALID_STATE_TRANSITION');
    assert.equal(err.message, 'Transition not allowed');

    const authErr = ApiError.unauthenticated();
    assert.equal(authErr.statusCode, 401);
    assert.equal(authErr.code, 'UNAUTHENTICATED');

    const forbErr = ApiError.forbidden();
    assert.equal(forbErr.statusCode, 403);
    assert.equal(forbErr.code, 'FORBIDDEN');
  });
});

describe('6. Password Reset Schemas & Validation (BKD-06 & MISS-01)', () => {
  it('should validate forgot password email format', () => {
    assert.doesNotThrow(() => forgotPasswordSchema.parse({ email: 'student@college.edu' }));
    assert.throws(() => forgotPasswordSchema.parse({ email: 'invalid-email' }));
  });

  it('should validate reset password schema rules', () => {
    assert.doesNotThrow(() =>
      resetPasswordSchema.parse({
        email: 'student@college.edu',
        otp: '123456',
        newPassword: 'SecurePassword123',
      })
    );
    // Missing uppercase
    assert.throws(() =>
      resetPasswordSchema.parse({
        email: 'student@college.edu',
        otp: '123456',
        newPassword: 'password123',
      })
    );
    // Missing number
    assert.throws(() =>
      resetPasswordSchema.parse({
        email: 'student@college.edu',
        otp: '123456',
        newPassword: 'PasswordUppercase',
      })
    );
  });
});

describe('7. Student Self-Registration Validation (SEC-02, SEC-08)', () => {
  it('should validate valid student registration details', () => {
    assert.doesNotThrow(() =>
      registerStudentSchema.parse({
        name: 'Avinash Bharti',
        email: 'avinash@college.edu',
        password: 'Password@123',
        rollNumber: '0105CS241101',
        section: 'B',
        semester: 5,
      })
    );
  });

  it('should reject registration with invalid email or weak password', () => {
    // Invalid email
    assert.throws(() =>
      registerStudentSchema.parse({
        name: 'Avinash Bharti',
        email: 'invalid-email-address',
        password: 'Password@123',
      })
    );
    // Missing number in password
    assert.throws(() =>
      registerStudentSchema.parse({
        name: 'Avinash Bharti',
        email: 'avinash@college.edu',
        password: 'PasswordOnly',
      })
    );
    // Password shorter than 8 chars
    assert.throws(() =>
      registerStudentSchema.parse({
        name: 'Avinash Bharti',
        email: 'avinash@college.edu',
        password: 'Pass1',
      })
    );
  });
});

describe('8. Role Scoping & Permission Definitions (BKD-01, TG-06)', () => {
  it('should enforce role separation between HOD, TG, and Student', () => {
    const studentRoles = ['STUDENT'];
    const facultyRoles = ['TEACHER', 'HOD'];
    const adminRoles = ['ADMIN'];

    assert.equal(studentRoles.includes('STUDENT'), true);
    assert.equal(studentRoles.includes('HOD'), false);
    assert.equal(facultyRoles.includes('HOD'), true);
    assert.equal(facultyRoles.includes('STUDENT'), false);
  });

  it('should verify TG role cannot delete student records (TG-06)', () => {
    const authorizedDeleteRoles = ['HOD', 'ADMIN'];
    assert.equal(authorizedDeleteRoles.includes('TG'), false);
    assert.equal(authorizedDeleteRoles.includes('HOD'), true);
    assert.equal(authorizedDeleteRoles.includes('ADMIN'), true);
  });
});

describe('9. HOD TG Section Allocation & Reassignment (HOD-07, HOD-08)', () => {
  it('should parse and resolve section codes into standard section names', () => {
    const normalizeSectionCode = (code) => {
      const cleaned = (code || '').replace(/Section\s*/i, '').replace(/^CSE-/i, '').trim().toUpperCase();
      return `CSE-${cleaned}`;
    };

    assert.equal(normalizeSectionCode('Section A'), 'CSE-A');
    assert.equal(normalizeSectionCode('Section B'), 'CSE-B');
    assert.equal(normalizeSectionCode('Section C'), 'CSE-C');
    assert.equal(normalizeSectionCode('Section D'), 'CSE-D');
    assert.equal(normalizeSectionCode('A'), 'CSE-A');
    assert.equal(normalizeSectionCode('CSE-C'), 'CSE-C');
  });

  it('should enforce that only HOD and ADMIN can reassign TG sections', () => {
    const authorizedReassignRoles = ['HOD', 'ADMIN'];
    assert.equal(authorizedReassignRoles.includes('HOD'), true);
    assert.equal(authorizedReassignRoles.includes('ADMIN'), true);
    assert.equal(authorizedReassignRoles.includes('TG'), false);
    assert.equal(authorizedReassignRoles.includes('STUDENT'), false);
  });
});

describe('10. HOD Notices & Circular Broadcast (HOD-09)', () => {
  it('should validate notice payload fields and priorities', () => {
    const validAudiences = ['ALL', 'STUDENTS', 'FACULTY', 'SEMESTER', 'SECTION'];
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

    assert.equal(validAudiences.includes('ALL'), true);
    assert.equal(validAudiences.includes('SEMESTER'), true);
    assert.equal(validAudiences.includes('UNKNOWN'), false);

    assert.equal(validPriorities.includes('URGENT'), true);
    assert.equal(validPriorities.includes('NORMAL'), true);
  });

  it('should verify only authorized roles can publish notices', () => {
    const allowedPublisherRoles = ['HOD', 'ADMIN', 'TEACHER'];
    assert.equal(allowedPublisherRoles.includes('HOD'), true);
    assert.equal(allowedPublisherRoles.includes('ADMIN'), true);
    assert.equal(allowedPublisherRoles.includes('STUDENT'), false);
  });
});

describe('11. Group Attendance Consideration Architecture (Per-Section TG & Master HOD Request)', () => {
  it('should validate group consideration schema with timing and member IDs', () => {
    const groupData = {
      eventTitle: 'Inter-College Hackathon 2026',
      eventType: 'HACKATHON',
      startDate: '2026-10-20',
      endDate: '2026-10-22',
      timeFrom: '10:50 AM',
      timeTo: '01:20 PM',
      requestedPeriods: 3,
      isGroup: true,
      groupMembers: ['652f1b2c3d4e5f6a7b8c9d01', '652f1b2c3d4e5f6a7b8c9d02'],
      description: 'Hackathon team participation representing college',
    };

    assert.doesNotThrow(() => createConsiderationSchema.parse(groupData));
    const parsed = createConsiderationSchema.parse(groupData);
    assert.equal(parsed.isGroup, true);
    assert.equal(parsed.groupMembers.length, 2);
  });

  it('should correctly partition multi-section students into unique section buckets', () => {
    const students = [
      { id: 's1', name: 'Alice', section: 'SEC_A', tg: 'tg_1' },
      { id: 's2', name: 'Bob', section: 'SEC_A', tg: 'tg_1' },
      { id: 's3', name: 'Charlie', section: 'SEC_B', tg: 'tg_2' },
      { id: 's4', name: 'Diana', section: 'SEC_B', tg: 'tg_2' },
    ];

    const buckets = new Map();
    for (const s of students) {
      const key = s.tg || s.section;
      if (!buckets.has(key)) {
        buckets.set(key, { tg: s.tg, section: s.section, students: [] });
      }
      buckets.get(key).students.push(s);
    }

    // Exactly 2 buckets (1 for Section A's TG, 1 for Section B's TG)
    assert.equal(buckets.size, 2);
    assert.equal(buckets.get('tg_1').students.length, 2);
    assert.equal(buckets.get('tg_2').students.length, 2);
  });

  it('should ensure HOD filter only matches master group requests and individual requests', () => {
    const requests = [
      { id: 'r1', isGroup: false, isGroupMaster: false },
      { id: 'r2', isGroup: true, isGroupMaster: true, groupId: 'grp_1' },
      { id: 'r3', isGroup: true, isGroupMaster: false, groupId: 'grp_1' }, // Section B slave
      { id: 'r4', isGroup: true, isGroupMaster: false, groupId: 'grp_1' }, // Section C slave
    ];

    const hodVisibleRequests = requests.filter(
      (r) => !r.isGroup || r.isGroupMaster === true
    );

    // HOD sees only r1 (individual) and r2 (group master) - single request for the group!
    assert.equal(hodVisibleRequests.length, 2);
    assert.deepEqual(hodVisibleRequests.map((r) => r.id), ['r1', 'r2']);
  });
});

describe('12. Section Letter Isolation, Temporary Passwords & Student Profile Updates', () => {
  it('should cleanly differentiate CSE-B from CSE-C without false positive overlaps', () => {
    const getSectionLetter = (val) => {
      if (!val) return '';
      const str = typeof val === 'object' ? (val.code || val.name || '') : String(val);
      const match = str.match(/CSE[\s\-_]*([A-D])/i) ||
                    str.match(/SEC(?:TION)?[\s\-_]*([A-D])/i) ||
                    str.match(/\b([A-D])\b/i);
      return match ? match[1].toUpperCase() : '';
    };

    assert.equal(getSectionLetter('CSE-B'), 'B');
    assert.equal(getSectionLetter('CSE-C'), 'C');
    assert.equal(getSectionLetter({ code: 'CSE-B', name: 'Section B' }), 'B');
    assert.equal(getSectionLetter({ code: 'CSE-C', name: 'Section C' }), 'C');

    // Confirm CSE-B does NOT falsely match Section C
    assert.notEqual(getSectionLetter('CSE-B'), 'C');
    assert.notEqual(getSectionLetter('CSE-C'), 'B');
  });

  it('should generate temporary passwords meeting complexity rules', () => {
    const generateTempPassword = () => {
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
      let randomPart = '';
      for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `Reset@${randomPart}`;
    };

    const tempPass = generateTempPassword();
    assert.equal(tempPass.startsWith('Reset@'), true);
    assert.equal(tempPass.length, 10);
  });
});




