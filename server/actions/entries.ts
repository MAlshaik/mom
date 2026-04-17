"use server";

import { db } from "@/server/db";
import { dailyEntries, members, groups, memberJuz } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession, requireAdmin } from "@/lib/auth";
import { resolveHijriContext, isPastTime, getResetTime } from "@/lib/khatm-day";
import { getTodayPrayerData, prayerTimesMap, getHijriMonthLength } from "@/lib/prayer-times";

async function getGroupContext(groupId: string) {
  const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group[0]) return null;

  const prayer = await getTodayPrayerData(group[0].city, group[0].country);
  const prayers = prayerTimesMap(prayer);
  const resetTimeStr = getResetTime(group[0].resetType, group[0].resetValue, prayers);
  const pastReset = isPastTime(resetTimeStr);

  const currentHijriDay = parseInt(prayer.hijriDay) || 1;
  const reportedMonthLength = await getHijriMonthLength(prayer.hijriMonth, prayer.hijriYear);
  const resolved = resolveHijriContext(
    currentHijriDay,
    prayer.hijriMonth,
    prayer.hijriYear,
    reportedMonthLength,
    pastReset
  );

  return {
    group: group[0],
    khatmDay: resolved.khatmDay,
    hijriMonth: resolved.hijriMonth,
    hijriYear: resolved.hijriYear,
  };
}

/**
 * Toggle a single juz entry for the current member.
 * startingJuz = which juz assignment to toggle (from member_juz.starting_juz)
 */
export async function toggleSingleJuzAction(
  khatmDay: number,
  startingJuz: number,
  hijriMonth: string,
  hijriYear: string
) {
  const session = await requireSession();

  const ctx = await getGroupContext(session.groupId);
  if (!ctx) return { success: false, error: "Group not found" };
  if (khatmDay > ctx.khatmDay || khatmDay < 0) {
    return { success: false, error: "Cannot modify this day" };
  }

  const existing = await db.select().from(dailyEntries).where(
    and(
      eq(dailyEntries.memberId, session.memberId),
      eq(dailyEntries.khatmDay, khatmDay),
      eq(dailyEntries.startingJuz, startingJuz),
      eq(dailyEntries.hijriMonth, hijriMonth),
      eq(dailyEntries.hijriYear, hijriYear)
    )
  ).limit(1);

  if (existing[0]) {
    await db.update(dailyEntries).set({
      completed: !existing[0].completed,
      markedAt: new Date(),
    }).where(eq(dailyEntries.id, existing[0].id));
    return { success: true, completed: !existing[0].completed };
  } else {
    await db.insert(dailyEntries).values({
      memberId: session.memberId,
      khatmDay,
      startingJuz,
      hijriMonth,
      hijriYear,
      completed: true,
    });
    return { success: true, completed: true };
  }
}

/**
 * Toggle ALL juz entries for the current member at once (the big button).
 */
export async function toggleAllJuzAction(
  khatmDay: number,
  hijriMonth: string,
  hijriYear: string
) {
  const session = await requireSession();

  const ctx = await getGroupContext(session.groupId);
  if (!ctx) return { success: false, error: "Group not found" };
  if (khatmDay > ctx.khatmDay || khatmDay < 0) {
    return { success: false, error: "Cannot modify this day" };
  }

  // Get all juz assignments for this member
  const assignments = await db.select().from(memberJuz).where(
    and(eq(memberJuz.memberId, session.memberId), eq(memberJuz.groupId, session.groupId))
  );

  // Check current state — if all are completed, undo all. Otherwise complete all.
  const existingEntries = await db.select().from(dailyEntries).where(
    and(
      eq(dailyEntries.memberId, session.memberId),
      eq(dailyEntries.khatmDay, khatmDay),
      eq(dailyEntries.hijriMonth, hijriMonth),
      eq(dailyEntries.hijriYear, hijriYear)
    )
  );

  const completedJuz = new Set(
    existingEntries.filter((e) => e.completed).map((e) => e.startingJuz)
  );
  const allCompleted = assignments.every((a) => completedJuz.has(a.startingJuz));

  for (const assignment of assignments) {
    const existing = existingEntries.find((e) => e.startingJuz === assignment.startingJuz);

    if (allCompleted) {
      // Undo all
      if (existing) {
        await db.update(dailyEntries).set({ completed: false, markedAt: new Date() })
          .where(eq(dailyEntries.id, existing.id));
      }
    } else {
      // Complete all that aren't already done
      if (existing && !existing.completed) {
        await db.update(dailyEntries).set({ completed: true, markedAt: new Date() })
          .where(eq(dailyEntries.id, existing.id));
      } else if (!existing) {
        await db.insert(dailyEntries).values({
          memberId: session.memberId,
          khatmDay,
          startingJuz: assignment.startingJuz,
          hijriMonth,
          hijriYear,
          completed: true,
        });
      }
    }
  }

  return { success: true, completed: !allCompleted };
}

/**
 * Admin toggles a single juz entry for any member.
 */
export async function adminToggleEntryAction(
  targetMemberId: string,
  khatmDay: number,
  startingJuz: number,
  hijriMonth: string,
  hijriYear: string
) {
  const session = await requireAdmin();

  const member = await db.select().from(members).where(
    and(eq(members.id, targetMemberId), eq(members.groupId, session.groupId))
  ).limit(1);
  if (!member[0]) return { success: false, error: "Member not found" };

  const existing = await db.select().from(dailyEntries).where(
    and(
      eq(dailyEntries.memberId, targetMemberId),
      eq(dailyEntries.khatmDay, khatmDay),
      eq(dailyEntries.startingJuz, startingJuz),
      eq(dailyEntries.hijriMonth, hijriMonth),
      eq(dailyEntries.hijriYear, hijriYear)
    )
  ).limit(1);

  if (existing[0]) {
    await db.update(dailyEntries).set({
      completed: !existing[0].completed,
      markedAt: new Date(),
    }).where(eq(dailyEntries.id, existing[0].id));
    return { success: true, completed: !existing[0].completed };
  } else {
    await db.insert(dailyEntries).values({
      memberId: targetMemberId,
      khatmDay,
      startingJuz,
      hijriMonth,
      hijriYear,
      completed: true,
    });
    return { success: true, completed: true };
  }
}
