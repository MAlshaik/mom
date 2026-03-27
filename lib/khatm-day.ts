const RIYADH_TZ = "Asia/Riyadh";

/**
 * Get current date/time in Saudi Arabia.
 */
export function nowInSaudi(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: RIYADH_TZ })
  );
}

/**
 * Format a Date as DD-MM-YYYY (for aladhan API).
 */
export function formatForApi(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

/**
 * Format a Date as YYYY-MM-DD (for DB storage).
 */
export function formatForDb(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${y}-${m}-${d}`;
}

/**
 * Parse an HH:MM time string into { hours, minutes }.
 */
function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(":").map(Number);
  return { hours: h, minutes: m };
}

/**
 * Check if the current Saudi time is past Maghrib.
 */
export function isPastMaghrib(maghribTime: string): boolean {
  const now = nowInSaudi();
  const { hours, minutes } = parseTime(maghribTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const maghribMinutes = hours * 60 + minutes;
  return nowMinutes >= maghribMinutes;
}

/**
 * Count days between two YYYY-MM-DD dates.
 */
function daysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T00:00:00");
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate the current khatm day (0-indexed from group start).
 * If past Maghrib, the day advances by 1.
 */
export function getKhatmDay(
  groupStartDate: string,
  todayDate: string,
  maghribTime: string
): number {
  const base = daysBetween(groupStartDate, todayDate);
  const pastMaghrib = isPastMaghrib(maghribTime);
  return Math.max(0, base + (pastMaghrib ? 1 : 0));
}

/**
 * Calculate which juz a member should read on a given khatm day.
 */
export function getJuzForDay(startingJuz: number, khatmDay: number): number {
  return ((startingJuz - 1 + khatmDay) % 30) + 1;
}
