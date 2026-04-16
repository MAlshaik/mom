"use server";

import { db } from "@/server/db";
import { members, groups, dailyEntries, memberJuz } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getKhatmDay, getJuzForDay, isDoubleJuzDay, isPastTime, getResetTime } from "@/lib/khatm-day";
import { getTodayPrayerData, prayerTimesMap, getHijriMonthLength } from "@/lib/prayer-times";
import { getHijriStartDay } from "@/lib/hijri-start-cache";

export interface SlotData {
  juz: number;
  juzLabel: string;
  startingJuz: number | null;
  memberId: string | null;
  memberName: string | null;
  completed: boolean;
}

export interface GroupPageData {
  groupName: string;
  member: {
    id: string;
    name: string;
    code: string;
    startingJuz: number;
    isAdmin: boolean;
  };
  khatmDay: number;
  myJuzSlots: { juz: number; startingJuz: number; completed: boolean }[];
  allMyJuzCompleted: boolean;
  slots: SlotData[];
  missedDays: { khatmDay: number; juzList: { juz: number; startingJuz: number }[] }[];
  hijriDate: {
    day: string;
    month: string;
    year: string;
    monthEn: string;
  };
  resetTime: string;
  resetLabel: string;
  doneCount: number;
  totalCount: number;
  hijriMonth: string;
  hijriYear: string;
  is29DayMonth: boolean;
}

const HIJRI_MONTH_NAMES_EN: Record<string, string> = {
  "1": "Muharram", "2": "Safar", "3": "Rabi al-Awwal", "4": "Rabi al-Thani",
  "5": "Jumada al-Ula", "6": "Jumada al-Thani", "7": "Rajab", "8": "Shaban",
  "9": "Ramadan", "10": "Shawwal", "11": "Dhul Qadah", "12": "Dhul Hijjah",
};

export async function getGroupPageData(): Promise<GroupPageData | null> {
  const session = await getSession();
  if (!session) return null;

  const [memberResult, groupResult] = await Promise.all([
    db.select().from(members).where(eq(members.id, session.memberId)).limit(1),
    db.select().from(groups).where(eq(groups.id, session.groupId)).limit(1),
  ]);

  if (!memberResult[0] || !groupResult[0]) return null;
  const member = memberResult[0];
  const group = groupResult[0];

  const [prayer, startDayInMonth] = await Promise.all([
    getTodayPrayerData(group.city, group.country),
    getHijriStartDay(group.startDate),
  ]);

  const prayers = prayerTimesMap(prayer);
  const resetTimeStr = getResetTime(group.resetType, group.resetValue, prayers);
  const pastReset = isPastTime(resetTimeStr);
  const currentHijriDay = parseInt(prayer.hijriDay) || 1;
  // khatmDay is always from the 1st of the Hijri month
  const khatmDay = getKhatmDay(currentHijriDay, pastReset);
  const hijriMonth = prayer.hijriMonth;
  const hijriYear = prayer.hijriYear;

  const [groupMembers, allJuzAssignments, todayEntries, myMonthEntries, monthLength] = await Promise.all([
    db.select().from(members).where(eq(members.groupId, session.groupId)),
    db.select().from(memberJuz).where(eq(memberJuz.groupId, session.groupId)),
    db.select().from(dailyEntries).where(
      and(eq(dailyEntries.khatmDay, khatmDay), eq(dailyEntries.hijriMonth, hijriMonth), eq(dailyEntries.hijriYear, hijriYear))
    ),
    db.select().from(dailyEntries).where(
      and(eq(dailyEntries.memberId, session.memberId), eq(dailyEntries.hijriMonth, hijriMonth), eq(dailyEntries.hijriYear, hijriYear))
    ),
    getHijriMonthLength(hijriMonth, hijriYear),
  ]);

  const is29DayMonth = monthLength === 29;
  const isLastDayOf29 = is29DayMonth && khatmDay === 28; // 0-indexed day 28 = 29th day
  const memberMap = new Map(groupMembers.map((m) => [m.id, m]));

  // Build juz → assignment map for today (day-29 juz only — each member appears once)
  const juzToAssignment = new Map<number, { memberId: string; startingJuz: number }>();
  for (const a of allJuzAssignments) {
    const juz = getJuzForDay(a.startingJuz, khatmDay);
    juzToAssignment.set(juz, { memberId: a.memberId, startingJuz: a.startingJuz });
  }

  // Completion map: (memberId:startingJuz) → completed
  const entryKey = (memberId: string, startingJuz: number | null) => `${memberId}:${startingJuz}`;
  const completionMap = new Map<string, boolean>();
  for (const e of todayEntries) {
    completionMap.set(entryKey(e.memberId, e.startingJuz), e.completed);
  }

  // Build 30 slots
  const slots: SlotData[] = Array.from({ length: 30 }, (_, i) => {
    const juz = i + 1;
    const assignment = juzToAssignment.get(juz);
    const m = assignment ? memberMap.get(assignment.memberId) : null;
    const completed = assignment
      ? (completionMap.get(entryKey(assignment.memberId, assignment.startingJuz)) ?? false)
      : false;

    // On the last day of a 29-day month, show both juz numbers (day-29 + day-30)
    let juzLabel = String(juz);
    if (assignment && isLastDayOf29) {
      const juz30 = getJuzForDay(assignment.startingJuz, 29);
      juzLabel = `${juz}, ${juz30}`;
    }

    return {
      juz,
      juzLabel,
      startingJuz: assignment?.startingJuz ?? null,
      memberId: m?.id ?? null,
      memberName: m?.name ?? null,
      completed,
    };
  });

  // My juz for today — include double juz on last day of 29-day month
  const myAssignments = allJuzAssignments.filter((a) => a.memberId === member.id);
  const myJuzSlots: { juz: number; startingJuz: number; completed: boolean }[] = [];
  for (const a of myAssignments) {
    const juz = getJuzForDay(a.startingJuz, khatmDay);
    const completed = completionMap.get(entryKey(member.id, a.startingJuz)) ?? false;
    myJuzSlots.push({ juz, startingJuz: a.startingJuz, completed });

    // Last day of 29-day month: everyone also does their day-30 juz
    if (isLastDayOf29) {
      const juz30 = getJuzForDay(a.startingJuz, 29);
      myJuzSlots.push({ juz: juz30, startingJuz: a.startingJuz, completed });
    }
  }
  myJuzSlots.sort((a, b) => a.juz - b.juz);

  const allMyJuzCompleted = myJuzSlots.length > 0 && myJuzSlots.every((s) => s.completed);

  // Missed days — from day 0 (1st of Hijri month) to yesterday
  const myMonthCompletionMap = new Map<string, boolean>();
  for (const e of myMonthEntries) {
    myMonthCompletionMap.set(`${e.khatmDay}:${e.startingJuz}`, e.completed);
  }

  const missedDays: { khatmDay: number; juzList: { juz: number; startingJuz: number }[] }[] = [];
  for (let day = khatmDay - 1; day >= 0; day--) {
    const incomplete: { juz: number; startingJuz: number }[] = [];
    for (const a of myAssignments) {
      const juz = getJuzForDay(a.startingJuz, day);
      const done = myMonthCompletionMap.get(`${day}:${a.startingJuz}`) ?? false;
      if (!done) {
        incomplete.push({ juz, startingJuz: a.startingJuz });
        // Also check the 30 if it was a double day
        if (is29DayMonth && juz === 29) {
          incomplete.push({ juz: 30, startingJuz: a.startingJuz });
        }
      }
    }
    if (incomplete.length > 0) {
      missedDays.push({ khatmDay: day, juzList: incomplete });
    }
  }

  let resetLabel = resetTimeStr;
  if (group.resetType === "prayer") resetLabel = group.resetValue;

  return {
    groupName: group.name,
    member: {
      id: member.id,
      name: member.name,
      code: member.code,
      startingJuz: member.startingJuz,
      isAdmin: member.isAdmin,
    },
    khatmDay,
    myJuzSlots,
    allMyJuzCompleted,
    slots,
    missedDays,
    hijriDate: {
      day: prayer.hijriDay,
      month: prayer.hijriMonthAr,
      year: prayer.hijriYear,
      monthEn: HIJRI_MONTH_NAMES_EN[prayer.hijriMonth] ?? prayer.hijriMonth,
    },
    resetTime: resetTimeStr,
    resetLabel,
    doneCount: slots.filter((s) => s.completed).length,
    totalCount: 30,
    hijriMonth,
    hijriYear,
    is29DayMonth,
  };
}
