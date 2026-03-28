import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const BANNER_WIDTH = 1200;
export const BANNER_HEIGHT = 630;

export async function uploadBanner(groupId: string, base64Data: string, contentType: string): Promise<string | null> {
  const supabase = getSupabase();
  const buffer = Buffer.from(base64Data, "base64");
  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = `${groupId}.${ext}`;

  const { error } = await supabase.storage
    .from("banners")
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("Banner upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from("banners").getPublicUrl(path);
  return data.publicUrl;
}
