"use server";

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
  };
}

export async function logoutAction() {
  await clearSession();
  return { success: true };
}
