const RIYADH_TZ = "Asia/Riyadh";

export function nowInSaudi(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: RIYADH_TZ })
  );
}

export function formatForApi(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export function formatForDb(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${y}-${m}-${d}`;
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(":").map(Number);
  return { hours: h, minutes: m };
}

/**
 * Check if current Saudi time is past a given HH:MM time.
 */
export function isPastTime(timeStr: string): boolean {
  const now = nowInSaudi();
  const { hours, minutes } = parseTime(timeStr);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = hours * 60 + minutes;
  return nowMinutes >= targetMinutes;
}

/**
 * Get the reset time for a group based on its config and today's prayer data.
 */
export function getResetTime(
  resetType: string,
  resetValue: string,
  prayerTimes: Record<string, string>
): string {
  if (resetType === "fixed") {
    return resetValue; // e.g., "21:30"
  }
  // Prayer-based: look up the prayer name
  return prayerTimes[resetValue] ?? prayerTimes["Maghrib"] ?? "18:30";
}

/**
 * Calculate khatm day relative to the group's start day within the month.
 *
 * The group starts on a specific Hijri day (e.g., 9 Shawwal).
 * Each month, the cycle resets on that same day number.
 *
 * Example: startDayInMonth=9, currentHijriDay=9, pastReset=false → khatmDay=0
 * Example: startDayInMonth=9, currentHijriDay=9, pastReset=true  → khatmDay=1
 * Example: startDayInMonth=9, currentHijriDay=10, pastReset=false → khatmDay=1
 * Example: startDayInMonth=9, currentHijriDay=15, pastReset=false → khatmDay=6
 *
 * If current day is before the start day in the month, it means we're still
 * in the previous cycle (wrapping from last month).
 */
export function getKhatmDayHijri(
  currentHijriDay: number,
  startDayInMonth: number,
  pastResetTime: boolean
): number {
  let day = currentHijriDay - startDayInMonth + (pastResetTime ? 1 : 0);
  // If negative, we're before the start day this month — wrap from previous month
  if (day < 0) {
    day += 30; // approximate, Hijri months are 29-30 days
  }
  return Math.max(0, day);
}

/**
 * Calculate which juz a member should read on a given khatm day.
 */
export function getJuzForDay(startingJuz: number, khatmDay: number): number {
  return ((startingJuz - 1 + khatmDay) % 30) + 1;
}

/**
 * Get juz label for display — handles 29-day month where last day is "29-30".
 */
export function getJuzLabel(
  startingJuz: number,
  khatmDay: number,
  isLastDayOf29DayMonth: boolean
): string {
  const juz = getJuzForDay(startingJuz, khatmDay);
  if (isLastDayOf29DayMonth && khatmDay === 28) {
    const juz2 = getJuzForDay(startingJuz, 29);
    return `${juz}-${juz2}`;
  }
  return String(juz);
}
