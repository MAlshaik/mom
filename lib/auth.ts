import { cookies } from "next/headers";
import { db } from "@/server/db";
import { members } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "khatm_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

interface SessionData {
  memberId: string;
  groupId: string;
  isAdmin: boolean;
}

export async function createSession(data: SessionData) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}

export async function requireAdmin(): Promise<SessionData> {
  const session = await requireSession();
  if (!session.isAdmin) throw new Error("Not authorized");
  return session;
}

export async function getMemberByCode(code: string) {
  const result = await db
    .select()
    .from(members)
    .where(eq(members.code, code.toUpperCase()))
    .limit(1);

  return result[0] ?? null;
}
