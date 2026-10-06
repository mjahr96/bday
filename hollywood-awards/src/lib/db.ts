import { createClient } from "@supabase/supabase-js";

// Nur serverseitig importieren! Nutzt den Service-Role-Key.
export const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const BUCKET = "photos";

export async function signPhotos(paths: (string | null)[]): Promise<Record<string, string>> {
  const list = Array.from(new Set(paths.filter((p): p is string => !!p)));
  if (!list.length) return {};
  const { data } = await db.storage.from(BUCKET).createSignedUrls(list, 3600);
  const out: Record<string, string> = {};
  data?.forEach((d) => { if (d.path && d.signedUrl) out[d.path] = d.signedUrl; });
  return out;
}

export async function getStatus(): Promise<"upcoming" | "open" | "closed"> {
  const { data } = await db.from("settings").select("voting_status").eq("id", 1).single();
  return (data?.voting_status as any) ?? "upcoming";
}
