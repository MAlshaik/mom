"use server";

import { db } from "@/server/db";
import { groups } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createSession, clearSession, getMemberByCode } from "@/lib/auth";

export async function loginAction(code: string) {
  const member = await getMemberByCode(code);
  if (!member) {
    return { success: false as const, error: "Invalid code" };
  }

  await createSession({
    memberId: member.id,
    groupId: member.groupId,
    isAdmin: member.isAdmin,
  });

  // Get the group slug for redirect
  const group = await db
    .select({ slug: groups.slug })
    .from(groups)
    .where(eq(groups.id, member.groupId))
    .limit(1);

  return {
    success: true as const,
    member: {
      id: member.id,
      name: member.name,
      code: member.code,
      startingJuz: member.startingJuz,
      isAdmin: member.isAdmin,
      groupId: member.groupId,
    },
    slug: group[0]?.slug ?? null,
  };
}

export async function logoutAction() {
  await clearSession();
  return { success: true };
}
