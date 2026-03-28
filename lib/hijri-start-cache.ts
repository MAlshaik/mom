const cache = new Map<string, number>();

export async function getHijriStartDay(gregorianDate: string): Promise<number> {
  if (cache.has(gregorianDate)) {
    return cache.get(gregorianDate)!;
  }

  try {
    const [y, m, d] = gregorianDate.split("-");
    const res = await fetch(
      `https://api.aladhan.com/v1/gToH/${d}-${m}-${y}?timezonestring=Asia/Riyadh`
    );
    const json = await res.json();
    const day = parseInt(json.data.hijri.day) || 1;
    cache.set(gregorianDate, day);
    return day;
  } catch {
    return 1;
  }
}
