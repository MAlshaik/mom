import { db } from "@/server/db";
import { maghribCache } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { formatForApi, formatForDb, nowInSaudi } from "./khatm-day";

const FALLBACK_MAGHRIB = "18:30";

interface AladhanTimings {
  data: {
    timings: { Maghrib: string };
    date: {
      hijri: {
        day: string;
        month: { number: number; ar: string; en: string };
        year: string;
      };
    };
  };
}

interface PrayerData {
  maghribTime: string;
  hijriDay: string;
  hijriMonth: string;
  hijriYear: string;
  hijriMonthAr: string;
}

/**
 * Fetch prayer times from aladhan.com for a given city/country.
 * Uses method=7 (Jafari / University of Tehran) for Shia times.
 */
async function fetchFromApi(
  date: Date,
  city: string,
  country: string
): Promise<PrayerData | null> {
  try {
    const dateStr = formatForApi(date);
    const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=7`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) return null;

    const json: AladhanTimings = await res.json();
    const maghribRaw = json.data.timings.Maghrib;
    // API sometimes returns "HH:MM (TZ)", strip the timezone part
    const maghribTime = maghribRaw.split(" ")[0];
    const hijri = json.data.date.hijri;

    return {
      maghribTime,
      hijriDay: hijri.day,
      hijriMonth: String(hijri.month.number),
      hijriYear: hijri.year,
      hijriMonthAr: hijri.month.ar,
    };
  } catch {
    return null;
  }
}

/**
 * Get today's prayer data, using DB cache first, then API, then fallback.
 */
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
      hijriDay: c.hijriDay,
      hijriMonth: c.hijriMonth,
      hijriYear: c.hijriYear,
      hijriMonthAr: c.hijriMonthAr,
    };
  }

  // Fetch from API
  const data = await fetchFromApi(now, city, country);

  if (data) {
    // Cache it
    await db
      .insert(maghribCache)
      .values({
        gregorianDate: todayDb,
        ...data,
      })
      .onConflictDoNothing();

    return data;
  }

  // Fallback
  return {
    maghribTime: FALLBACK_MAGHRIB,
    hijriDay: "—",
    hijriMonth: "—",
    hijriYear: "—",
    hijriMonthAr: "—",
  };
}
