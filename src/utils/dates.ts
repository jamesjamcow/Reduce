import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

export function formatTimestamp(value?: number | null, fallback = 'No date yet') {
  if (!value) return fallback;
  return dayjs(value).format('ddd, MMM D • h:mm A');
}

export function formatShortDate(value?: number | null, fallback = 'TBD') {
  if (!value) return fallback;
  return dayjs(value).format('MMM D');
}

export function formatRelative(value?: number | null) {
  if (!value) return 'No reminder';
  return dayjs(value).fromNow();
}

export function isoFromUnix(value?: number | null) {
  if (!value) return '';
  return dayjs(value).format('YYYY-MM-DDTHH:mm');
}

export function unixFromInput(value?: string | null) {
  if (!value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.valueOf() : undefined;
}

export function nextMorning(value: number) {
  return dayjs(value).hour(9).minute(0).second(0).millisecond(0).valueOf();
}

export function plusDays(value: number, days: number) {
  return dayjs(value).add(days, 'day').valueOf();
}

export function minusDays(value: number, days: number) {
  return dayjs(value).subtract(days, 'day').valueOf();
}
