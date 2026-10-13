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
import { loginSchema, changePasswordSchema } from '../src/modules/auth/auth.schema.js';
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
