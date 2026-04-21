export function getSydneyDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
}

export function startOfSydneyDay(date: Date) {
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatSydneyDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString('en-AU', {
    timeZone: 'Australia/Sydney',
    ...options
  });
}

export function formatSydneyTime(date: Date, options?: Intl.DateTimeFormatOptions) {
  return date.toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
}

export function getSydneyStartOfMonth(date: Date) {
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function getSydneyEndOfMonth(date: Date) {
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
