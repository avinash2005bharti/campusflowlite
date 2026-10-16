import { parseISO, differenceInCalendarDays, isValid } from 'date-fns';

/**
 * Validate YYYY-MM-DD format
 * @param {string} dateStr
 * @returns {boolean}
 */
export const isValidDateStr = (dateStr) => {
  if (typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = parseISO(dateStr);
  return isValid(parsed);
};

/**
 * Get current date string in IST (Asia/Kolkata) formatted as YYYY-MM-DD
 * @returns {string}
 */
export const getTodayIST = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

/**
 * Compute inclusive day count between two YYYY-MM-DD strings
 * e.g., 2026-10-12 to 2026-10-12 is 1 day
 * @param {string} startDateStr
 * @param {string} endDateStr
 * @returns {number}
 */
export const calculateInclusiveDays = (startDateStr, endDateStr) => {
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  return differenceInCalendarDays(end, start) + 1;
};

/**
 * Check if endDate >= startDate
 * @param {string} startDateStr
 * @param {string} endDateStr
 * @returns {boolean}
 */
export const isEndDateGteStartDate = (startDateStr, endDateStr) => {
  return endDateStr >= startDateStr;
};

/**
 * Check if date is backdated by more than allowed days compared to today in IST
 * @param {string} startDateStr
 * @param {number} allowedBackdateDays
 * @returns {boolean}
 */
export const isExcessivelyBackdated = (startDateStr, allowedBackdateDays = 7) => {
  const todayIST = getTodayIST();
  const start = parseISO(startDateStr);
  const today = parseISO(todayIST);
  const diffDays = differenceInCalendarDays(today, start);
  return diffDays > allowedBackdateDays;
};

/**
 * Check if two date ranges [startA, endA] and [startB, endB] overlap
 * @param {string} startA
 * @param {string} endA
 * @param {string} startB
 * @param {string} endB
 * @returns {boolean}
 */
export const rangesOverlap = (startA, endA, startB, endB) => {
  return startA <= endB && endA >= startB;
};

/**
 * Get current time components in IST (Asia/Kolkata)
 * @param {Date} [date=new Date()]
 * @returns {{ hour: number, minute: number, second: number }}
 */
export const getISTTime = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  let hour = 0;
  let minute = 0;
  let second = 0;
  for (const part of parts) {
    if (part.type === 'hour') hour = parseInt(part.value, 10);
    if (part.type === 'minute') minute = parseInt(part.value, 10);
    if (part.type === 'second') second = parseInt(part.value, 10);
  }
  // If midnight hour12:false returns 24 in some environments, normalize to 0
  if (hour === 24) hour = 0;
  return { hour, minute, second };
};

/**
 * Check if the given time is within the student consideration application window
 * Allowed window: 9:00 AM to 4:00 PM IST (09:00 to 16:00 inclusive)
 * 9:00 AM = 9 * 60 = 540 minutes
 * 4:00 PM = 16 * 60 = 960 minutes
 * @param {Date} [date=new Date()]
 * @returns {boolean}
 */
export const isWithinConsiderationWindow = (date = new Date()) => {
  const { hour, minute } = getISTTime(date);
  const minutesFromMidnight = hour * 60 + minute;
  const startMinutes = 9 * 60; // 09:00 AM
  const endMinutes = 16 * 60;  // 04:00 PM (16:00)
  return minutesFromMidnight >= startMinutes && minutesFromMidnight <= endMinutes;
};

export default {
  isValidDateStr,
  getTodayIST,
  calculateInclusiveDays,
  isEndDateGteStartDate,
  isExcessivelyBackdated,
  rangesOverlap,
  getISTTime,
  isWithinConsiderationWindow,
};

