"use server";

import { db } from "@/server/db";
import { members, groups, dailyEntries } from "@/server/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { generateCode } from "@/lib/arabic-to-english";

export async function listGroupsAction() {
  const allGroups = await db
    .select()
    .from(groups)
    .orderBy(groups.createdAt);

  // Get member count for each group
  const result = [];
  for (const g of allGroups) {
    const memberCount = await db
      .select()
      .from(members)
      .where(eq(members.groupId, g.id));

    result.push({
      id: g.id,
      name: g.name,
      city: g.city,
      country: g.country,
      startDate: g.startDate,
      memberCount: memberCount.length,
    });
  }

  return result;
}

export async function createGroupAction(data: {
  name: string;
  startDate: string;
  city?: string;
  country?: string;
}) {
  const [group] = await db
    .insert(groups)
    .values({
      name: data.name.trim(),
      city: data.city ?? "Qatif",
      country: data.country ?? "Saudi Arabia",
      startDate: data.startDate,
    })
    .returning();

  return { success: true, group };
}

export async function deleteGroupAction(groupId: string) {
  // Cascade will handle members and entries
  await db.delete(groups).where(eq(groups.id, groupId));
  return { success: true };
}

export async function getGroupMembersAction(groupId: string) {
  const groupMembers = await db
    .select()
    .from(members)
    .where(eq(members.groupId, groupId))
    .orderBy(members.startingJuz);

  return groupMembers.map((m) => ({
    id: m.id,
    name: m.name,
    code: m.code,
    startingJuz: m.startingJuz,
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

  // Check that no other member in the group has this starting juz
  const existing = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.groupId, data.groupId),
        eq(members.startingJuz, data.startingJuz)
      )
    )
    .limit(1);

  if (existing[0]) {
    return {
      success: false,
      error: `Juz ${data.startingJuz} is already assigned to ${existing[0].name}`,
    };
  }

  const code = generateCode(data.name, data.startingJuz);

  // Check code uniqueness — if collision, append a number
  let finalCode = code;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const codeExists = await db
      .select()
      .from(members)
      .where(eq(members.code, finalCode))
      .limit(1);

    if (!codeExists[0]) break;
    attempt++;
    finalCode = `${code}${attempt}`;
  }

  const [newMember] = await db
    .insert(members)
    .values({
      name: data.name.trim(),
      code: finalCode,
      startingJuz: data.startingJuz,
      groupId: data.groupId,
      isAdmin: false,
    })
    .returning();

  return {
    success: true,
    member: newMember,
    code: finalCode,
  };
}

export async function updateMemberAction(data: {
  memberId: string;
  name: string;
  startingJuz: number;
  groupId: string;
}) {
  if (data.startingJuz < 1 || data.startingJuz > 30) {
    return { success: false, error: "Starting juz must be between 1 and 30" };
  }

  const existing = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.groupId, data.groupId),
        eq(members.startingJuz, data.startingJuz),
        ne(members.id, data.memberId)
      )
    )
    .limit(1);

  if (existing[0]) {
    return {
      success: false,
      error: `Juz ${data.startingJuz} is already assigned to ${existing[0].name}`,
    };
  }

  const newCode = generateCode(data.name, data.startingJuz);

  let finalCode = newCode;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const codeExists = await db
      .select()
      .from(members)
      .where(and(eq(members.code, finalCode), ne(members.id, data.memberId)))
      .limit(1);

    if (!codeExists[0]) break;
    attempt++;
    finalCode = `${newCode}${attempt}`;
  }

  const [updated] = await db
    .update(members)
    .set({
      name: data.name.trim(),
      startingJuz: data.startingJuz,
      code: finalCode,
    })
    .where(eq(members.id, data.memberId))
    .returning();

  return {
    success: true,
    member: updated,
    code: finalCode,
  };
}

export async function removeMemberAction(memberId: string) {
  await db.delete(dailyEntries).where(eq(dailyEntries.memberId, memberId));
  await db.delete(members).where(eq(members.id, memberId));
  return { success: true };
}
