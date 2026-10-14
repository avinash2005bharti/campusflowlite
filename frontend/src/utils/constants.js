/**
 * CampusFlow Lite - Centralized Constants, Status Mappings & Formatters
 * Established for Indian Engineering College Conventions (OIST CSE)
 */

export const DEFAULT_ACADEMIC_SESSION = '2025-26';
export const FULL_ACADEMIC_SESSION = '2025-2026';

export const STATUS_LABELS = {
  PENDING: 'Pending',
  RECOMMENDED_BY_TG: 'Recommended by TG',
  APPROVED_BY_HOD: 'Approved by HOD',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REJECTED_BY_HOD: 'Rejected by HOD',
  REJECTED_BY_TG: 'Rejected by TG',
  CANCELLED: 'Cancelled',
};

export const ACTION_LABELS = {
  CREATE_CONSIDERATION: 'Created Attendance Consideration',
  TG_RECOMMEND_CONSIDERATION: 'TG Recommended Consideration',
  TG_REJECT_CONSIDERATION: 'TG Rejected Consideration',
  HOD_APPROVE_CONSIDERATION: 'Approved Consideration',
  HOD_REJECT_CONSIDERATION: 'Rejected Consideration',
  CANCEL_CONSIDERATION: 'Cancelled Attendance Consideration',

  CREATE_LEAVE: 'Submitted Leave Application',
  TG_RECOMMEND_LEAVE: 'TG Recommended Leave',
  TG_REJECT_LEAVE: 'TG Rejected Leave',
  FINAL_APPROVE_LEAVE: 'Approved Leave Application',
  FINAL_REJECT_LEAVE: 'Rejected Leave Application',
  CANCEL_LEAVE: 'Cancelled Leave Application',

  APPOINT_TG: 'Appointed Tutor Guardian (TG)',
  REVOKE_TG: 'Revoked Tutor Guardian (TG)',
  UPDATE_MENTOR_GROUP: 'Updated Mentored Students',
  ESCALATE: 'Escalated to HOD',
  RESET_PASSWORD: 'Reset User Password',
  UPDATE: 'Updated Record',
  CREATE: 'Created Record',
};

export const REQUEST_TYPE_LABELS = {
  HACKATHON: 'Hackathon / Competition',
  SPORTS: 'Sports Activity',
  CULTURAL: 'Cultural Activity',
  COLLEGE_DUTY: 'On-Duty (College Service)',
  OD: 'On-Duty (OD)',
  MEDICAL: 'Medical',
  CASUAL: 'Casual Leave',
  SICK: 'Sick Leave',
  ACADEMIC: 'Academic Leave',
  EMERGENCY: 'Emergency Leave',
  DUTY: 'Duty Leave',
  OTHER: 'Special Activity',
};

/**
 * Format date string into standard Indian format (e.g. "14 Oct 2026")
 * Avoids UTC timezone day-shift by parsing year-month-day components.
 */
export function formatDateIST(dateStr) {
  if (!dateStr) return 'Not available';
  try {
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Format timestamp into standard Indian format with time (e.g. "14 Oct 2026, 03:45 PM")
 */
export function formatDateTimeIST(dateStr) {
  if (!dateStr) return 'Not available';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Format periods count
 */
export function formatPeriods(periods) {
  if (periods === undefined || periods === null) return '0 periods';
  const num = Number(periods);
  return `${num} ${num === 1 ? 'period' : 'periods'}`;
}

/**
 * Resolve display name without inventing mock names
 */
export function getFacultyDisplayName(user, designation) {
  if (user?.name && user.name.trim()) return user.name.trim();
  if (designation && designation.trim()) return designation.trim();
  return 'Faculty Member';
}

export function getStudentDisplayName(user, rollNumber) {
  if (user?.name && user.name.trim()) return user.name.trim();
  if (rollNumber && rollNumber.trim()) return `Student (${rollNumber.trim()})`;
  return 'Student';
}

export default {
  DEFAULT_ACADEMIC_SESSION,
  FULL_ACADEMIC_SESSION,
  STATUS_LABELS,
  ACTION_LABELS,
  REQUEST_TYPE_LABELS,
  formatDateIST,
  formatDateTimeIST,
  formatPeriods,
  getFacultyDisplayName,
  getStudentDisplayName,
};
