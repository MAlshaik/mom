"use server";

import { db } from "@/server/db";
import { members, groups, dailyEntries, memberJuz } from "@/server/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { generateCode, generateSlug } from "@/lib/arabic-to-english";

export async function listGroupsAction() {
  const allGroups = await db.select().from(groups).orderBy(groups.createdAt);

  const result = [];
  for (const g of allGroups) {
    const memberCount = await db.select().from(members).where(eq(members.groupId, g.id));
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
