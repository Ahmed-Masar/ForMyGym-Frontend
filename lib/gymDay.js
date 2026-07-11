import { format, subDays, parseISO } from 'date-fns';

// A "gym day" doesn't flip at midnight — it flips at this hour the next morning,
// so a workout that spills past 12 AM still counts as the night it started.
// Anything logged before the cutoff belongs to the PREVIOUS calendar day.
// Bump this single number to change the boundary.
export const GYM_DAY_CUTOFF_HOUR = 6;

// The current gym-day key ("YYYY-MM-DD"), honoring the cutoff. Before the cutoff
// hour it returns yesterday; otherwise today. Computed from local device time,
// so "today" is always defined by the user's clock.
export function currentGymDayKey(now = new Date()) {
  const day = now.getHours() < GYM_DAY_CUTOFF_HOUR ? subDays(now, 1) : now;
  return format(day, 'yyyy-MM-dd');
}

// True when right now is in the after-midnight window and the given dateKey is
// still the (previous-calendar-day) gym day — i.e. worth flagging in the UI so
// a late-night log to "yesterday" isn't a surprise.
export function isLateNightGymDay(dateKey, now = new Date()) {
  return now.getHours() < GYM_DAY_CUTOFF_HOUR && dateKey === currentGymDayKey(now);
}

// Parse a "YYYY-MM-DD" key to a LOCAL Date (midnight), for display/formatting.
export function parseDayKey(dateKey) {
  return parseISO(dateKey);
}
