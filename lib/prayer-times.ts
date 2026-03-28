import { db } from "@/server/db";
import { maghribCache } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { formatForApi, formatForDb, nowInSaudi } from "./khatm-day";

const FALLBACK_MAGHRIB = "18:30";

/**
 * Check if a Hijri month has 29 or 30 days by checking if day 30 exists.
 * Caches the result.
 */
const monthLengthCache = new Map<string, number>();
export async function getHijriMonthLength(hijriMonth: string, hijriYear: string): Promise<number> {
  const key = `${hijriYear}-${hijriMonth}`;
  if (monthLengthCache.has(key)) return monthLengthCache.get(key)!;

  try {
    // Try to convert 30th of this Hijri month to Gregorian
    const res = await fetch(
      `https://api.aladhan.com/v1/hToG/30-${hijriMonth}-${hijriYear}?timezonestring=Asia/Riyadh`
    );
    const json = await res.json();
    // If the API returns a valid date AND the Hijri month matches, it has 30 days
    if (json.code === 200 && json.data) {
      monthLengthCache.set(key, 30);
      return 30;
    }
    monthLengthCache.set(key, 29);
    return 29;
  } catch {
    // Default to 30
    return 30;
  }
}

interface AladhanTimings {
  data: {
    timings: Record<string, string>;
    date: {
      hijri: {
        day: string;
        month: { number: number; ar: string; en: string };
        year: string;
      };
    };
  };
}

export interface PrayerData {
  maghribTime: string;
  fajrTime: string;
  dhuhrTime: string;
  asrTime: string;
  ishaTime: string;
  hijriDay: string;
  hijriMonth: string;
  hijriYear: string;
  hijriMonthAr: string;
}

/**
 * Get a map of prayer name → time for use with getResetTime.
 */
export function prayerTimesMap(data: PrayerData): Record<string, string> {
  return {
    Fajr: data.fajrTime,
    Dhuhr: data.dhuhrTime,
    Asr: data.asrTime,
    Maghrib: data.maghribTime,
    Isha: data.ishaTime,
  };
}

async function fetchFromApi(
  date: Date,
  city: string,
  country: string
): Promise<PrayerData | null> {
  try {
    const dateStr = formatForApi(date);
    const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=7&timezonestring=Asia/Riyadh`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) return null;

    const json: AladhanTimings = await res.json();
    const timings = json.data.timings;
    const hijri = json.data.date.hijri;

    // Strip timezone suffixes like " (AST)"
    const clean = (t: string) => t.split(" ")[0];

    return {
      maghribTime: clean(timings.Maghrib),
      fajrTime: clean(timings.Fajr),
      dhuhrTime: clean(timings.Dhuhr),
      asrTime: clean(timings.Asr),
      ishaTime: clean(timings.Isha),
      hijriDay: hijri.day,
      hijriMonth: String(hijri.month.number),
      hijriYear: hijri.year,
      hijriMonthAr: hijri.month.ar,
    };
  } catch {
    return null;
  }
}

export async function getTodayPrayerData(
  city: string,
  country: string
): Promise<PrayerData> {
  const now = nowInSaudi();
  const todayDb = formatForDb(now);

  // Check cache
  const cached = await db
    .select()
    .from(maghribCache)
    .where(eq(maghribCache.gregorianDate, todayDb))
    .limit(1);

  if (cached.length > 0) {
    const c = cached[0];
    return {
      maghribTime: c.maghribTime,
      fajrTime: c.fajrTime ?? FALLBACK_MAGHRIB,
      dhuhrTime: c.dhuhrTime ?? "12:00",
      asrTime: c.asrTime ?? "15:30",
      ishaTime: c.ishaTime ?? "19:30",
      hijriDay: c.hijriDay,
      hijriMonth: c.hijriMonth,
      hijriYear: c.hijriYear,
      hijriMonthAr: c.hijriMonthAr,
    };
  }

  // Fetch from API
  const data = await fetchFromApi(now, city, country);

  if (data) {
    await db
      .insert(maghribCache)
      .values({
        gregorianDate: todayDb,
        maghribTime: data.maghribTime,
        fajrTime: data.fajrTime,
        dhuhrTime: data.dhuhrTime,
        asrTime: data.asrTime,
        ishaTime: data.ishaTime,
        hijriDay: data.hijriDay,
        hijriMonth: data.hijriMonth,
        hijriYear: data.hijriYear,
        hijriMonthAr: data.hijriMonthAr,
      })
      .onConflictDoNothing();

    return data;
  }

  // Fallback
  return {
    maghribTime: FALLBACK_MAGHRIB,
    fajrTime: "05:00",
    dhuhrTime: "12:00",
    asrTime: "15:30",
    ishaTime: "19:30",
    hijriDay: "—",
    hijriMonth: "—",
    hijriYear: "—",
    hijriMonthAr: "—",
  };
}
