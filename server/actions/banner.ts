"use server";

import { db } from "@/server/db";
import { groups } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { uploadBanner } from "@/lib/supabase";

export async function uploadBannerAction(groupId: string, base64Data: string, contentType: string) {
  const url = await uploadBanner(groupId, base64Data, contentType);
  if (!url) return { success: false, error: "Upload failed" };

  await db.update(groups).set({ bannerUrl: url }).where(eq(groups.id, groupId));

  return { success: true, url };
}
