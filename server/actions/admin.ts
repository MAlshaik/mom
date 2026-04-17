"use server";

import { db } from "@/server/db";
import { members, groups, dailyEntries, memberJuz, goalEntries } from "@/server/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { generateCode, generateSlug } from "@/lib/arabic-to-english";
import { getJuzForDay, isPastTime, getResetTime, resolveHijriContext } from "@/lib/khatm-day";
import { getTodayPrayerData, prayerTimesMap, getHijriMonthLength } from "@/lib/prayer-times";

async function getResolvedContextForGroup(group: typeof groups.$inferSelect) {
  const prayer = await getTodayPrayerData(group.city, group.country);
  const prayers = prayerTimesMap(prayer);
  const resetTimeStr = getResetTime(group.resetType, group.resetValue, prayers);
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
  return { prayer, ...resolved };
}

export async function listGroupsAction() {
  const allGroups = await db.select().from(groups).orderBy(groups.createdAt);

  const result = [];
  for (const g of allGroups) {
    const memberCount = g.type === "goal"
      ? await db.select().from(goalEntries).where(eq(goalEntries.groupId, g.id))
      : await db.select().from(members).where(eq(members.groupId, g.id));
    result.push({
      id: g.id,
      name: g.name,
      slug: g.slug,
      type: g.type,
      city: g.city,
      country: g.country,
      startDate: g.startDate,
      resetType: g.resetType,
      resetValue: g.resetValue,
      bannerUrl: g.bannerUrl,
      memberCount: memberCount.length,
    });
  }
  return result;
}

export async function createGroupAction(data: {
  name: string;
  startDate: string;
  type?: string;
  city?: string;
  country?: string;
  resetType?: string;
  resetValue?: string;
  goalDescription?: string;
  targetCount?: number;
  endDate?: string;
}) {
  const slug = generateSlug(data.name);

  const [group] = await db
    .insert(groups)
    .values({
      name: data.name.trim(),
      slug,
      type: data.type ?? "khatm",
      city: data.city ?? "Qatif",
      country: data.country ?? "Saudi Arabia",
      startDate: data.startDate,
      resetType: data.resetType ?? "prayer",
      resetValue: data.resetValue ?? "Maghrib",
      goalDescription: data.goalDescription,
      targetCount: data.targetCount,
      endDate: data.endDate,
    })
    .returning();

  return { success: true, group };
}

export async function updateGroupAction(
  groupId: string,
  data: {
    name?: string;
    slug?: string;
    city?: string;
    country?: string;
    startDate?: string;
    resetType?: string;
    resetValue?: string;
    goalDescription?: string;
    targetCount?: number;
    endDate?: string;
  }
) {
  if (data.slug) {
    const existing = await db.select().from(groups).where(
      and(eq(groups.slug, data.slug), ne(groups.id, groupId))
    ).limit(1);
    if (existing[0]) {
      return { success: false, error: "Slug already taken" };
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.resetType !== undefined) updateData.resetType = data.resetType;
  if (data.resetValue !== undefined) updateData.resetValue = data.resetValue;
  if (data.goalDescription !== undefined) updateData.goalDescription = data.goalDescription;
  if (data.targetCount !== undefined) updateData.targetCount = data.targetCount;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;

  const [updated] = await db
    .update(groups)
    .set(updateData)
    .where(eq(groups.id, groupId))
    .returning();

  return { success: true, group: updated };
}

export async function deleteGroupAction(groupId: string) {
  await db.delete(groups).where(eq(groups.id, groupId));
  return { success: true };
}

export async function getGroupBySlug(slug: string) {
  const result = await db.select().from(groups).where(eq(groups.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function getGroupMembersAction(groupId: string) {
  const [groupMembers, allJuz] = await Promise.all([
    db.select().from(members).where(eq(members.groupId, groupId)).orderBy(members.startingJuz),
    db.select().from(memberJuz).where(eq(memberJuz.groupId, groupId)),
  ]);

  // Group juz assignments by member
  const juzByMember = new Map<string, number[]>();
  for (const j of allJuz) {
    const list = juzByMember.get(j.memberId) ?? [];
    list.push(j.startingJuz);
    juzByMember.set(j.memberId, list);
  }

  return groupMembers.map((m) => ({
    id: m.id,
    name: m.name,
    code: m.code,
    startingJuz: m.startingJuz,
    juzAssignments: (juzByMember.get(m.id) ?? [m.startingJuz]).sort((a, b) => a - b),
    isAdmin: m.isAdmin,
  }));
}

export async function addMemberAction(data: {
  name: string;
  startingJuz: number;
  groupId: string;
}) {
  if (data.startingJuz < 1 || data.startingJuz > 30) {
    return { success: false, error: "Starting juz must be between 1 and 30" };
  }

  // Check juz not taken (in member_juz)
  const existing = await db.select().from(memberJuz).where(
    and(eq(memberJuz.groupId, data.groupId), eq(memberJuz.startingJuz, data.startingJuz))
  ).limit(1);

  if (existing[0]) {
    // Find who has it
    const owner = await db.select().from(members).where(eq(members.id, existing[0].memberId)).limit(1);
    return { success: false, error: `Juz ${data.startingJuz} is already assigned to ${owner[0]?.name ?? "someone"}` };
  }

  const code = generateCode(data.name, data.startingJuz);
  let finalCode = code;
  let attempt = 0;
  while (true) {
    const codeExists = await db.select().from(members).where(eq(members.code, finalCode)).limit(1);
    if (!codeExists[0]) break;
    attempt++;
    finalCode = `${code}${attempt}`;
  }

  const [newMember] = await db.insert(members).values({
    name: data.name.trim(),
    code: finalCode,
    startingJuz: data.startingJuz,
    groupId: data.groupId,
    isAdmin: false,
  }).returning();

  // Also create the member_juz assignment
  await db.insert(memberJuz).values({
    memberId: newMember.id,
    groupId: data.groupId,
    startingJuz: data.startingJuz,
  });

  return { success: true, member: newMember, code: finalCode };
}

export async function addJuzToMemberAction(data: {
  memberId: string;
  startingJuz: number;
  groupId: string;
}) {
  if (data.startingJuz < 1 || data.startingJuz > 30) {
    return { success: false, error: "Juz must be between 1 and 30" };
  }

  // Check juz not already taken in this group
  const existing = await db.select().from(memberJuz).where(
    and(eq(memberJuz.groupId, data.groupId), eq(memberJuz.startingJuz, data.startingJuz))
  ).limit(1);

  if (existing[0]) {
    const owner = await db.select().from(members).where(eq(members.id, existing[0].memberId)).limit(1);
    return { success: false, error: `Juz ${data.startingJuz} is already assigned to ${owner[0]?.name ?? "someone"}` };
  }

  await db.insert(memberJuz).values({
    memberId: data.memberId,
    groupId: data.groupId,
    startingJuz: data.startingJuz,
  });

  return { success: true };
}

export async function removeJuzFromMemberAction(data: {
  memberId: string;
  startingJuz: number;
  groupId: string;
}) {
  await db.delete(memberJuz).where(
    and(
      eq(memberJuz.memberId, data.memberId),
      eq(memberJuz.groupId, data.groupId),
      eq(memberJuz.startingJuz, data.startingJuz)
    )
  );
  return { success: true };
}

export async function updateMemberAction(data: {
  memberId: string;
  name: string;
  startingJuz: number;
  groupId: string;
  code?: string;
}) {
  if (data.startingJuz < 1 || data.startingJuz > 30) {
    return { success: false, error: "Starting juz must be between 1 and 30" };
  }

  let finalCode: string;

  if (data.code) {
    // Admin set a custom code — check uniqueness
    const codeExists = await db.select().from(members).where(
      and(eq(members.code, data.code), ne(members.id, data.memberId))
    ).limit(1);
    if (codeExists[0]) {
      return { success: false, error: `Code "${data.code}" is already taken` };
    }
    finalCode = data.code;
  } else {
    // Auto-generate code
    const newCode = generateCode(data.name, data.startingJuz);
    finalCode = newCode;
    let attempt = 0;
    while (true) {
      const codeExists = await db.select().from(members).where(
        and(eq(members.code, finalCode), ne(members.id, data.memberId))
      ).limit(1);
      if (!codeExists[0]) break;
      attempt++;
      finalCode = `${newCode}${attempt}`;
    }
  }

  const [updated] = await db.update(members).set({
    name: data.name.trim(),
    startingJuz: data.startingJuz,
    code: finalCode,
  }).where(eq(members.id, data.memberId)).returning();

  return { success: true, member: updated, code: finalCode };
}

export async function removeMemberAction(memberId: string) {
  await db.delete(memberJuz).where(eq(memberJuz.memberId, memberId));
  await db.delete(dailyEntries).where(eq(dailyEntries.memberId, memberId));
  await db.delete(members).where(eq(members.id, memberId));
  return { success: true };
}

/**
 * Get which members have completed all their juz for today.
 */
export async function getTodayCompletionsAction(groupId: string) {
  const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group[0]) return new Set<string>();

  const { khatmDay, hijriMonth, hijriYear } = await getResolvedContextForGroup(group[0]);

  const [allJuz, todayEntries] = await Promise.all([
    db.select().from(memberJuz).where(eq(memberJuz.groupId, groupId)),
    db.select().from(dailyEntries).where(
      and(
        eq(dailyEntries.khatmDay, khatmDay),
        eq(dailyEntries.hijriMonth, hijriMonth),
        eq(dailyEntries.hijriYear, hijriYear)
      )
    ),
  ]);

  // Group juz assignments by member
  const juzByMember = new Map<string, number[]>();
  for (const j of allJuz) {
    const list = juzByMember.get(j.memberId) ?? [];
    list.push(j.startingJuz);
    juzByMember.set(j.memberId, list);
  }

  // Check completions
  const completedEntries = new Set(
    todayEntries.filter((e) => e.completed).map((e) => `${e.memberId}:${e.startingJuz}`)
  );

  const completedMembers: string[] = [];
  for (const [memberId, juzList] of juzByMember) {
    const allDone = juzList.every((juz) => completedEntries.has(`${memberId}:${juz}`));
    if (allDone) completedMembers.push(memberId);
  }

  return completedMembers;
}

/**
 * Admin marks all of a member's juz as done for today.
 */
export async function adminMarkDoneAction(memberId: string, juzAssignments: number[], groupId: string) {
  const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group[0]) return { success: false };

  const { khatmDay, hijriMonth, hijriYear } = await getResolvedContextForGroup(group[0]);

  for (const startingJuz of juzAssignments) {
    const existing = await db.select().from(dailyEntries).where(
      and(
        eq(dailyEntries.memberId, memberId),
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
    } else {
      await db.insert(dailyEntries).values({
        memberId,
        khatmDay,
        startingJuz,
        hijriMonth,
        hijriYear,
        completed: true,
      });
    }
  }

  return { success: true };
}

/**
 * Get a member's month completion grid.
 */
export async function getMemberMonthDataAction(memberId: string, groupId: string) {
  const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group[0]) return null;

  const { prayer, khatmDay: currentKhatmDay, hijriMonth, hijriYear } = await getResolvedContextForGroup(group[0]);

  const [assignments, entries, monthLength] = await Promise.all([
    db.select().from(memberJuz).where(
      and(eq(memberJuz.memberId, memberId), eq(memberJuz.groupId, groupId))
    ),
    db.select().from(dailyEntries).where(
      and(
        eq(dailyEntries.memberId, memberId),
        eq(dailyEntries.hijriMonth, hijriMonth),
        eq(dailyEntries.hijriYear, hijriYear)
      )
    ),
    getHijriMonthLength(hijriMonth, hijriYear),
  ]);

  const is29DayMonth = monthLength === 29;

  const completionMap = new Map<string, boolean>();
  for (const e of entries) {
    completionMap.set(`${e.khatmDay}:${e.startingJuz}`, e.completed);
  }

  const days: {
    khatmDay: number;
    hijriDay: number;
    juzList: { juz: number; juzLabel: string; startingJuz: number; completed: boolean }[];
  }[] = [];

  for (let day = 0; day <= currentKhatmDay; day++) {
    const isLastDayOf29 = is29DayMonth && day === 28;
    const juzList = assignments.map((a) => {
      const juz = getJuzForDay(a.startingJuz, day);
      const completed = completionMap.get(`${day}:${a.startingJuz}`) ?? false;
      let juzLabel = String(juz);
      if (isLastDayOf29) {
        const juz30 = getJuzForDay(a.startingJuz, 29);
        juzLabel = `${juz}, ${juz30}`;
      }
      return { juz, juzLabel, startingJuz: a.startingJuz, completed };
    }).sort((a, b) => a.juz - b.juz);

    days.push({ khatmDay: day, hijriDay: day + 1, juzList });
  }

  return {
    days,
    hijriMonth,
    hijriYear,
    hijriMonthAr: hijriMonth === prayer.hijriMonth ? prayer.hijriMonthAr : undefined,
  };
}

/**
 * Admin toggles a specific day+juz for a member.
 */
export async function adminToggleDayAction(
  memberId: string,
  khatmDay: number,
  startingJuz: number,
  groupId: string
) {
  const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group[0]) return { success: false };

  const { hijriMonth, hijriYear } = await getResolvedContextForGroup(group[0]);

  const existing = await db.select().from(dailyEntries).where(
    and(
      eq(dailyEntries.memberId, memberId),
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
      memberId,
      khatmDay,
      startingJuz,
      hijriMonth,
      hijriYear,
      completed: true,
    });
    return { success: true, completed: true };
  }
}
