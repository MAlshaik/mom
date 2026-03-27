"use server";

import { db } from "@/server/db";
import { members, groups, dailyEntries } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getKhatmDay, getJuzForDay, formatForDb, nowInSaudi } from "@/lib/khatm-day";
import { getTodayPrayerData } from "@/lib/prayer-times";

export interface SlotData {
  juz: number;
  memberId: string | null;
  memberName: string | null;
  completed: boolean;
}

export interface GroupPageData {
  member: {
    id: string;
    name: string;
    code: string;
    startingJuz: number;
    isAdmin: boolean;
  };
  khatmDay: number;
  myJuz: number;
  isTodayCompleted: boolean;
  slots: SlotData[];
  missedDays: { khatmDay: number; juz: number }[];
  hijriDate: {
    day: string;
    month: string;
    year: string;
    monthEn: string;
  };
  maghribTime: string;
  doneCount: number;
  totalCount: number;
}

export async function getGroupPageData(): Promise<GroupPageData | null> {
  const session = await getSession();
  if (!session) return null;

  const member = await db
    .select()
    .from(members)
    .where(eq(members.id, session.memberId))
    .limit(1);

  if (!member[0]) return null;

  const group = await db
    .select()
    .from(groups)
    .where(eq(groups.id, session.groupId))
    .limit(1);

  if (!group[0]) return null;

  const prayer = await getTodayPrayerData(group[0].city, group[0].country);
  const todayStr = formatForDb(nowInSaudi());
  const khatmDay = getKhatmDay(group[0].startDate, todayStr, prayer.maghribTime);

  // Get all members in the group
  const groupMembers = await db
    .select()
    .from(members)
    .where(eq(members.groupId, session.groupId));

  // Get all entries for today
  const todayEntries = await db
    .select()
    .from(dailyEntries)
    .where(eq(dailyEntries.khatmDay, khatmDay));

  const entryMap = new Map(todayEntries.map((e) => [e.memberId, e]));

  // Build 30 juz slots
  const juzToMember = new Map<number, (typeof groupMembers)[0]>();
  for (const m of groupMembers) {
    const juz = getJuzForDay(m.startingJuz, khatmDay);
    juzToMember.set(juz, m);
  }

  const slots: SlotData[] = Array.from({ length: 30 }, (_, i) => {
    const juz = i + 1;
    const m = juzToMember.get(juz) ?? null;
    const entry = m ? entryMap.get(m.id) : null;
    return {
      juz,
      memberId: m?.id ?? null,
      memberName: m?.name ?? null,
      completed: entry?.completed ?? false,
    };
  });

  const myJuz = getJuzForDay(member[0].startingJuz, khatmDay);
  const myEntry = entryMap.get(member[0].id);
  const isTodayCompleted = myEntry?.completed ?? false;

  // Missed days — check all past days back to start
  const missedDays: { khatmDay: number; juz: number }[] = [];
  for (let day = khatmDay - 1; day >= 0; day--) {
    const entry = await db
      .select()
      .from(dailyEntries)
      .where(
        and(
          eq(dailyEntries.memberId, session.memberId),
          eq(dailyEntries.khatmDay, day)
        )
      )
      .limit(1);

    if (!entry[0] || !entry[0].completed) {
      missedDays.push({
        khatmDay: day,
        juz: getJuzForDay(member[0].startingJuz, day),
      });
    }
  }

  const doneCount = slots.filter((s) => s.completed).length;

  // Hijri date — map month number to Arabic/English
  const hijriMonthNames: Record<string, string> = {
    "1": "Muharram", "2": "Safar", "3": "Rabi al-Awwal", "4": "Rabi al-Thani",
    "5": "Jumada al-Ula", "6": "Jumada al-Thani", "7": "Rajab", "8": "Shaban",
    "9": "Ramadan", "10": "Shawwal", "11": "Dhul Qadah", "12": "Dhul Hijjah",
  };

  return {
    member: {
      id: member[0].id,
      name: member[0].name,
      code: member[0].code,
      startingJuz: member[0].startingJuz,
      isAdmin: member[0].isAdmin,
    },
    khatmDay,
    myJuz,
    isTodayCompleted,
    slots,
    missedDays,
    hijriDate: {
      day: prayer.hijriDay,
      month: prayer.hijriMonthAr,
      year: prayer.hijriYear,
      monthEn: hijriMonthNames[prayer.hijriMonth] ?? prayer.hijriMonth,
    },
    maghribTime: prayer.maghribTime,
    doneCount,
    totalCount: 30,
  };
}

export async function getAdminReportData() {
  const session = await getSession();
  if (!session) return null;

  const group = await db
    .select()
    .from(groups)
    .where(eq(groups.id, session.groupId))
    .limit(1);

  if (!group[0]) return null;

  const prayer = await getTodayPrayerData(group[0].city, group[0].country);
  const todayStr = formatForDb(nowInSaudi());
  const khatmDay = getKhatmDay(group[0].startDate, todayStr, prayer.maghribTime);

  const groupMembers = await db
    .select()
    .from(members)
    .where(eq(members.groupId, session.groupId))
    .orderBy(members.startingJuz);

  const todayEntries = await db
    .select()
    .from(dailyEntries)
    .where(eq(dailyEntries.khatmDay, khatmDay));

  const entryMap = new Map(todayEntries.map((e) => [e.memberId, e]));

  const membersWithStatus = groupMembers.map((m) => ({
    id: m.id,
    name: m.name,
    code: m.code,
    startingJuz: m.startingJuz,
    isAdmin: m.isAdmin,
    completed: entryMap.get(m.id)?.completed ?? false,
  }));

  return {
    members: membersWithStatus,
    hijriDate: {
      day: prayer.hijriDay,
      month: prayer.hijriMonthAr,
      year: prayer.hijriYear,
      monthEn: prayer.hijriMonth,
    },
    doneCount: membersWithStatus.filter((m) => m.completed).length,
    totalCount: membersWithStatus.length,
    groupId: group[0].id,
  };
}
