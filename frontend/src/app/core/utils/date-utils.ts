/**
 * Utility functions for date/time handling.
 */

/**
 * Formats a Date as an ISO string with timezone offset.
 * This ensures the backend receives the time as the user intended,
 * preserving the local time context rather than converting to UTC.
 * 
 * @param date The date to format
 * @returns ISO string with timezone offset (e.g., "2024-01-15T10:30:00+01:00")
 */
export function toLocalISOString(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    sign + pad(offset / 60) + ':' + pad(offset % 60);
}
