/**
 * Global Australia/Sydney Time Utility
 * Standardizes all date/time operations to AEST/AEDT.
 */

export const AU_TIMEZONE = 'Australia/Sydney';

/**
 * Returns the current date/time adjusted to Australia/Sydney.
 */
export function getSydneyNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: AU_TIMEZONE }));
}

/**
 * Converts a UTC date from the database to Sydney relative hours and minutes.
 * Returns { hours, minutes } in the Sydney timezone.
 */
export function toSydneyTime(date: Date): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: AU_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(date);

  const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  
  return { hours, minutes };
}

/**
 * Returns today's date string in YYYY-MM-DD format for Sydney.
 */
export function getSydneyTodayStr(): string {
  const now = getSydneyNow();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get Sydney Day of Week (0-6)
 */
export function getSydneyDayOfWeek(date: Date): number {
  const now = new Date(date.toLocaleString('en-US', { timeZone: AU_TIMEZONE }));
  return now.getDay();
}

/**
 * Standard Sydney Date Formatter
 */
export function formatSydney(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: AU_TIMEZONE,
    ...options
  }).format(date);
}
