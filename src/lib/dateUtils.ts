/**
 * India Standard Time (Asia/Kolkata) utility functions
 * NW Service Center, Solapur
 */

export function getNowIST(): Date {
  // Returns current date adjusted to IST representation
  return new Date();
}

/**
 * Formats date into standard IST format: "DD/MM/YYYY, hh:mm A"
 * Example: "01/10/2026, 10:35 AM"
 */
export function formatISTDateTime(dateInput?: Date | string | number): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat('en-IN', options);
  const parts = formatter.formatToParts(d);

  let day = '';
  let month = '';
  let year = '';
  let hour = '';
  let minute = '';
  let dayPeriod = '';

  for (const part of parts) {
    if (part.type === 'day') day = part.value;
    if (part.type === 'month') month = part.value;
    if (part.type === 'year') year = part.value;
    if (part.type === 'hour') hour = part.value;
    if (part.type === 'minute') minute = part.value;
    if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
  }

  return `${day}/${month}/${year}, ${hour}:${minute} ${dayPeriod}`;
}

/**
 * Formats date into standard IST Date only: "DD/MM/YYYY"
 * Example: "01/10/2026"
 */
export function formatISTDateOnly(dateInput?: Date | string | number): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  const formatter = new Intl.DateTimeFormat('en-IN', options);
  const parts = formatter.formatToParts(d);

  let day = '';
  let month = '';
  let year = '';

  for (const part of parts) {
    if (part.type === 'day') day = part.value;
    if (part.type === 'month') month = part.value;
    if (part.type === 'year') year = part.value;
  }

  return `${day}/${month}/${year}`;
}

/**
 * Returns current month identifier in "YYYY-MM" (e.g. "2026-10") in IST
 */
export function getCurrentMonthPeriod(): string {
  const d = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  };
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
  let year = '';
  let month = '';
  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    if (part.type === 'month') month = part.value;
  }
  return `${year}-${month}`;
}

/**
 * Formats month period into readable English, e.g. "2026-10" -> "October 2026"
 */
export function formatMonthName(period: string): string {
  if (!period || !period.includes('-')) return period;
  const [yearStr, monthStr] = period.split('-');
  const monthNum = parseInt(monthStr, 10);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const name = monthNames[monthNum - 1] || monthStr;
  return `${name} ${yearStr}`;
}

/**
 * Calculates a date offset by N days in "YYYY-MM-DD" or "DD/MM/YYYY" format
 */
export function calculateDueDate(daysFromNow: number = 3): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return formatISTDateOnly(d);
}

/**
 * Check if a date string in "DD/MM/YYYY" or "YYYY-MM-DD" is overdue or due today
 */
export function checkDueDateStatus(dueDateStr?: string): 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none' {
  if (!dueDateStr) return 'none';

  let due: Date;
  if (dueDateStr.includes('/')) {
    const [day, month, year] = dueDateStr.split('/').map(Number);
    due = new Date(year, month - 1, day);
  } else {
    due = new Date(dueDateStr);
  }

  if (isNaN(due.getTime())) return 'none';

  const todayStr = formatISTDateOnly(new Date());
  const [tDay, tMonth, tYear] = todayStr.split('/').map(Number);
  const today = new Date(tYear, tMonth - 1, tDay);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return 'upcoming';
}
