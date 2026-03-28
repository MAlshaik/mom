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

export function isPastTime(timeStr: string): boolean {
  const now = nowInSaudi();
  const { hours, minutes } = parseTime(timeStr);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = hours * 60 + minutes;
  return nowMinutes >= targetMinutes;
}

export function getResetTime(
  resetType: string,
  resetValue: string,
  prayerTimes: Record<string, string>
): string {
  if (resetType === "fixed") {
    return resetValue;
  }
  return prayerTimes[resetValue] ?? prayerTimes["Maghrib"] ?? "18:30";
}

/**
 * khatmDay = hijriDay - 1 (always from 1st of month).
 * After reset time, advance by 1.
 */
export function getKhatmDay(currentHijriDay: number, pastResetTime: boolean): number {
  return Math.max(0, currentHijriDay - 1 + (pastResetTime ? 1 : 0));
}

/**
 * Calculate which juz a member reads on a given khatm day.
 * On a 29-day month, when the result is 29, they also read 30.
 */
export function getJuzForDay(startingJuz: number, khatmDay: number): number {
  return ((startingJuz - 1 + khatmDay) % 30) + 1;
}

/**
 * Check if a member's juz for a given day is 29 (meaning they also do 30 on 29-day months).
 */
export function isDoubleJuzDay(startingJuz: number, khatmDay: number): boolean {
  return getJuzForDay(startingJuz, khatmDay) === 29;
}
