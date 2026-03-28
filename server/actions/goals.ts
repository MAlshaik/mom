"use server";

import { db } from "@/server/db";
import { groups, goalEntries } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export interface GoalPageData {
  group: {
    id: string;
    name: string;
    slug: string;
    goalDescription: string | null;
    targetCount: number | null;
    startDate: string;
    endDate: string | null;
    bannerUrl: string | null;
  };
  entries: {
    id: string;
    name: string;
    completed: boolean;
    claimedAt: string;
  }[];
  claimedCount: number;
  completedCount: number;
}

export async function getGoalPageData(groupId: string): Promise<GoalPageData | null> {
  const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group[0]) return null;

  const entries = await db
    .select()
    .from(goalEntries)
    .where(eq(goalEntries.groupId, groupId))
    .orderBy(goalEntries.claimedAt);

  return {
    group: {
      id: group[0].id,
      name: group[0].name,
      slug: group[0].slug,
      goalDescription: group[0].goalDescription,
      targetCount: group[0].targetCount,
      startDate: group[0].startDate,
      endDate: group[0].endDate,
      bannerUrl: group[0].bannerUrl,
    },
    entries: entries.map((e) => ({
      id: e.id,
      name: e.name,
      completed: e.completed,
      claimedAt: e.claimedAt.toISOString(),
    })),
    claimedCount: entries.length,
    completedCount: entries.filter((e) => e.completed).length,
  };
}

export async function claimGoalSlotAction(groupId: string, name: string) {
  if (!name.trim()) return { success: false, error: "Name required" };

  const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group[0]) return { success: false, error: "Group not found" };

  // Check if target reached
  if (group[0].targetCount) {
    const entries = await db.select().from(goalEntries).where(eq(goalEntries.groupId, groupId));
    if (entries.length >= group[0].targetCount) {
      return { success: false, error: "All slots are taken" };
    }
  }

  const [entry] = await db
    .insert(goalEntries)
    .values({
      groupId,
      name: name.trim(),
    })
    .returning();

  return { success: true, entry };
}

export async function toggleGoalCompletionAction(entryId: string) {
  const existing = await db.select().from(goalEntries).where(eq(goalEntries.id, entryId)).limit(1);
  if (!existing[0]) return { success: false };

  await db
    .update(goalEntries)
    .set({
      completed: !existing[0].completed,
      completedAt: !existing[0].completed ? new Date() : null,
    })
    .where(eq(goalEntries.id, entryId));

  return { success: true, completed: !existing[0].completed };
}
