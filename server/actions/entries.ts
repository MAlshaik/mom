"use server";

import { db } from "@/server/db";
import { dailyEntries, members, groups } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { getKhatmDay, getJuzForDay, formatForDb, nowInSaudi } from "@/lib/khatm-day";
import { getTodayPrayerData } from "@/lib/prayer-times";

export async function toggleEntryAction(khatmDay: number) {
  const session = await requireSession();

  // Validate that khatmDay is today or any past day back to group start
  const member = await db
    .select()
    .from(members)
    .where(eq(members.id, session.memberId))
    .limit(1);

  if (!member[0]) return { success: false, error: "Member not found" };

  const group = await db
    .select()
    .from(groups)
    .where(eq(groups.id, session.groupId))
    .limit(1);

  if (!group[0]) return { success: false, error: "Group not found" };

  const prayer = await getTodayPrayerData(group[0].city, group[0].country);
  const todayStr = formatForDb(nowInSaudi());
  const currentKhatmDay = getKhatmDay(group[0].startDate, todayStr, prayer.maghribTime);

  // Allow marking today and any past day back to group start
  if (khatmDay > currentKhatmDay || khatmDay < 0) {
    return { success: false, error: "Cannot modify this day" };
  }

  // Check if entry exists
  const existing = await db
    .select()
    .from(dailyEntries)
    .where(
      and(
        eq(dailyEntries.memberId, session.memberId),
        eq(dailyEntries.khatmDay, khatmDay)
      )
    )
    .limit(1);

  if (existing[0]) {
    // Toggle: if completed, mark as not completed and vice versa
    await db
      .update(dailyEntries)
      .set({
        completed: !existing[0].completed,
        markedAt: new Date(),
      })
      .where(eq(dailyEntries.id, existing[0].id));

    return { success: true, completed: !existing[0].completed };
  } else {
    // Create new entry as completed
    await db.insert(dailyEntries).values({
      memberId: session.memberId,
      khatmDay,
      completed: true,
    });

    return { success: true, completed: true };
  }
}

/**
 * Get all entries for a group on a specific khatm day.
 */
export async function getGroupEntriesAction(khatmDay: number) {
  const session = await requireSession();

  const groupMembers = await db
    .select()
    .from(members)
    .where(eq(members.groupId, session.groupId));

  const entries = await db
    .select()
    .from(dailyEntries)
    .where(eq(dailyEntries.khatmDay, khatmDay));

  const entryMap = new Map(entries.map((e) => [e.memberId, e]));

  return groupMembers.map((m) => {
    const entry = entryMap.get(m.id);
    return {
      memberId: m.id,
      memberName: m.name,
      juz: getJuzForDay(m.startingJuz, khatmDay),
      completed: entry?.completed ?? false,
    };
  });
}

/**
 * Get missed days for a member (days with no completed entry).
 */
export async function getMissedDaysAction() {
  const session = await requireSession();

  const member = await db
    .select()
    .from(members)
    .where(eq(members.id, session.memberId))
    .limit(1);

  if (!member[0]) return [];

  const group = await db
    .select()
    .from(groups)
    .where(eq(groups.id, session.groupId))
    .limit(1);

  if (!group[0]) return [];

  const prayer = await getTodayPrayerData(group[0].city, group[0].country);
  const todayStr = formatForDb(nowInSaudi());
  const currentKhatmDay = getKhatmDay(group[0].startDate, todayStr, prayer.maghribTime);

  // Check all past days back to group start (excluding today)
  const missedDays: { khatmDay: number; juz: number }[] = [];

  for (let day = currentKhatmDay - 1; day >= 0; day--) {
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

  return missedDays;
}
